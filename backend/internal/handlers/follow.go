package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"social-network/backend/internal/db"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

func FollowUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	path := strings.TrimPrefix(r.URL.Path, "/follow/")
	targetID, err := strconv.Atoi(path)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid user id"})
		return
	}

	cookie, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "not logged in"})
		return
	}

	var requesterID int
	err = db.DB.QueryRow(
		"SELECT user_id FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP",
		cookie.Value,
	).Scan(&requesterID)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "session expired"})
		return
	}

	if requesterID == targetID {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "cannot follow yourself"})
		return
	}

	var exists int
	err = db.DB.QueryRow(
		"SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?",
		strconv.Itoa(requesterID), strconv.Itoa(targetID),
	).Scan(&exists)
	if err == nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "already following"})
		return
	}

	var pendingExists int
	err = db.DB.QueryRow(
		"SELECT 1 FROM follow_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'",
		strconv.Itoa(requesterID), strconv.Itoa(targetID),
	).Scan(&pendingExists)
	if err == nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "follow request already pending"})
		return
	}

	var isPublic bool
	err = db.DB.QueryRow(
		"SELECT is_public FROM users WHERE id = ?",
		targetID,
	).Scan(&isPublic)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "user not found"})
		return
	}

	if isPublic {
		_, err = db.DB.Exec(
			"INSERT INTO followers (follower_id, following_id) VALUES (?, ?)",
			strconv.Itoa(requesterID), strconv.Itoa(targetID),
		)
		if err != nil {
			log.Println("failed to insert follower:", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to follow"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "following"})
		return
	}

	_, err = db.DB.Exec(
		"INSERT INTO follow_requests (id, sender_id, receiver_id, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
		uuid.NewString(), strconv.Itoa(requesterID), strconv.Itoa(targetID), time.Now(),
	)
	if err != nil {
		log.Println("failed to insert follow request:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to send follow request"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "pending"})

}


func Unfollow(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Content-Type", "application/json")

	parts := strings.Split(r.URL.Path, "/")
targetID, err := strconv.Atoi(parts[len(parts)-1])
	fmt.Println(parts)
	log.Println("UNFOLLOW PATH:", parts)
	fmt.Println(targetID)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "invalid user id",
		})
		return
	}

	cookie, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var requesterID int

	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP",
	 cookie.Value,).Scan(&requesterID)
	 
	 if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	 }

	 _,err = db.DB.Exec(`DELETE FROM followers WHERE follower_id = ? AND following_id = ?`,
	requesterID, targetID,)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "failed to unfollow", 
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"status": "unfollowed",
	})
}