package handlers

import (
	"database/sql"
	"net/http"

	"social-net/internal/chat"
	"social-net/internal/db"
	"social-net/internal/middlewares"
	"social-net/internal/response"
	"social-net/internal/ws"
)

func ListChats(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	rows, err := db.DB.Query(`
		SELECT DISTINCT
			CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other_id,
			MAX(created_at) AS last_at
		FROM private_messages
		WHERE sender_id = ? OR recipient_id = ?
		GROUP BY other_id
		ORDER BY last_at DESC
	`, userID, userID, userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "something went wrong")
		return
	}
	defer rows.Close()

	var chats []map[string]any
	for rows.Next() {
		var otherID int
		var lastAt string
		rows.Scan(&otherID, &lastAt)
		var fn, ln string
		db.DB.QueryRow(`SELECT first_name, last_name FROM users WHERE id = ?`, otherID).Scan(&fn, &ln)
		chats = append(chats, map[string]any{
			"user_id": otherID, "first_name": fn, "last_name": ln, "last_message_at": lastAt,
		})
	}
	if chats == nil {
		chats = []map[string]any{}
	}
	response.JSON(w, http.StatusOK, chats)
}

func GetPrivateMessages(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	otherID, err := pathID(r, "chats")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, sender_id, recipient_id, content, created_at
		FROM private_messages
		WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
		ORDER BY created_at ASC
	`, userID, otherID, otherID, userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "something went wrong")
		return
	}
	defer rows.Close()

	msgs := scanMessages(rows)
	response.JSON(w, http.StatusOK, msgs)
}

func GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	groupID, err := pathID(r, "groups")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid group id")
		return
	}
	if !chat.IsGroupMember(groupID, userID) {
		response.Error(w, http.StatusForbidden, "not a group member")
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, sender_id, content, created_at
		FROM group_messages WHERE group_id = ? ORDER BY created_at ASC
	`, groupID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "something went wrong")
		return
	}
	defer rows.Close()

	var msgs []map[string]any
	for rows.Next() {
		var id, senderID int
		var content, createdAt string
		rows.Scan(&id, &senderID, &content, &createdAt)
		msgs = append(msgs, map[string]any{
			"id": id, "sender_id": senderID, "content": content, "created_at": createdAt,
		})
	}
	if msgs == nil {
		msgs = []map[string]any{}
	}
	response.JSON(w, http.StatusOK, msgs)
}

func SendPrivateMessageHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	recipientID, err := pathID(r, "chats")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := decodeJSON(r, &req); err != nil || req.Content == "" {
		response.Error(w, http.StatusBadRequest, "content is required")
		return
	}

	msgID, err := chat.SendPrivateMessage(userID, recipientID, req.Content)
	if err != nil {
		if _, ok := err.(*chat.Error); ok {
			response.Error(w, http.StatusForbidden, err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "something went wrong")
		return
	}

	payload := map[string]any{
		"type": "private_message",
		"data": map[string]any{
			"id": msgID, "sender_id": userID, "recipient_id": recipientID,
			"content": req.Content,
		},
	}
	ws.GlobalHub.SendToUser(recipientID, payload)

	response.JSON(w, http.StatusCreated, map[string]any{"id": msgID})
}

func SendGroupMessageHTTP(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	groupID, err := pathID(r, "groups")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid group id")
		return
	}
	if !chat.IsGroupMember(groupID, userID) {
		response.Error(w, http.StatusForbidden, "not a group member")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := decodeJSON(r, &req); err != nil || req.Content == "" {
		response.Error(w, http.StatusBadRequest, "content is required")
		return
	}

	res, err := db.DB.Exec(`
		INSERT INTO group_messages (group_id, sender_id, content) VALUES (?, ?, ?)
	`, groupID, userID, req.Content)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "something went wrong")
		return
	}
	msgID, _ := res.LastInsertId()

	payload := map[string]any{
		"type": "group_message",
		"data": map[string]any{
			"id": msgID, "group_id": groupID, "sender_id": userID, "content": req.Content,
		},
	}
	ws.GlobalHub.SendToGroup(groupID, payload, userID)

	response.JSON(w, http.StatusCreated, map[string]any{"id": msgID})
}

func scanMessages(rows *sql.Rows) []map[string]any {
	var msgs []map[string]any
	for rows.Next() {
		var id, senderID, recipientID int
		var content, createdAt string
		rows.Scan(&id, &senderID, &recipientID, &content, &createdAt)
		msgs = append(msgs, map[string]any{
			"id": id, "sender_id": senderID, "recipient_id": recipientID,
			"content": content, "created_at": createdAt,
		})
	}
	if msgs == nil {
		msgs = []map[string]any{}
	}
	return msgs
}
