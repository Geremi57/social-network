package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"social-net/internal/chat"
	"social-net/internal/db"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	mu      sync.RWMutex
	clients map[int][]*websocket.Conn
	groups  map[int]map[int]*websocket.Conn
}

var GlobalHub = &Hub{
	clients: make(map[int][]*websocket.Conn),
	groups:  make(map[int]map[int]*websocket.Conn),
}

func (h *Hub) Register(userID int, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[userID] = append(h.clients[userID], conn)
}

func (h *Hub) Unregister(userID int, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	conns := h.clients[userID]
	for i, c := range conns {
		if c == conn {
			h.clients[userID] = append(conns[:i], conns[i+1:]...)
			break
		}
	}
}

func (h *Hub) JoinGroup(groupID, userID int, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.groups[groupID] == nil {
		h.groups[groupID] = make(map[int]*websocket.Conn)
	}
	h.groups[groupID][userID] = conn
}

func (h *Hub) SendToUser(userID int, payload any) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	data, _ := json.Marshal(payload)
	for _, conn := range h.clients[userID] {
		conn.WriteMessage(websocket.TextMessage, data)
	}
}

func (h *Hub) SendToGroup(groupID int, payload any, excludeUserID int) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	data, _ := json.Marshal(payload)
	for uid, conn := range h.groups[groupID] {
		if uid != excludeUserID {
			conn.WriteMessage(websocket.TextMessage, data)
		}
	}
}

func HandleWS(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var userID int
	err = db.DB.QueryRow(`
		SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?
	`, cookie.Value, time.Now().UTC().Format("2006-01-02 15:04:05")).Scan(&userID)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade error:", err)
		return
	}
	defer conn.Close()

	GlobalHub.Register(userID, conn)
	defer GlobalHub.Unregister(userID, conn)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var incoming struct {
			Type    string `json:"type"`
			To      int    `json:"to"`
			GroupID int    `json:"group_id"`
			Content string `json:"content"`
		}
		if err := json.Unmarshal(msg, &incoming); err != nil {
			continue
		}

		switch incoming.Type {
		case "private_message":
			if incoming.To == 0 || incoming.Content == "" {
				continue
			}
			msgID, err := chat.SendPrivateMessage(userID, incoming.To, incoming.Content)
			if err != nil {
				errData, _ := json.Marshal(map[string]string{"error": err.Error()})
				conn.WriteMessage(websocket.TextMessage, errData)
				continue
			}
			payload := map[string]any{
				"type": "private_message",
				"data": map[string]any{
					"id": msgID, "sender_id": userID, "recipient_id": incoming.To,
					"content": incoming.Content,
				},
			}
			GlobalHub.SendToUser(incoming.To, payload)
			ack, _ := json.Marshal(payload)
			conn.WriteMessage(websocket.TextMessage, ack)

		case "join_group":
			if incoming.GroupID > 0 && chat.IsGroupMember(incoming.GroupID, userID) {
				GlobalHub.JoinGroup(incoming.GroupID, userID, conn)
			}

		case "group_message":
			if incoming.GroupID == 0 || incoming.Content == "" {
				continue
			}
			if !chat.IsGroupMember(incoming.GroupID, userID) {
				continue
			}
			res, err := db.DB.Exec(`
				INSERT INTO group_messages (group_id, sender_id, content) VALUES (?, ?, ?)
			`, incoming.GroupID, userID, incoming.Content)
			if err != nil {
				continue
			}
			msgID, _ := res.LastInsertId()
			payload := map[string]any{
				"type": "group_message",
				"data": map[string]any{
					"id": msgID, "group_id": incoming.GroupID,
					"sender_id": userID, "content": incoming.Content,
				},
			}
			GlobalHub.SendToGroup(incoming.GroupID, payload, 0)
		}
	}
}
