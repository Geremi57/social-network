package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/backend/internal/db"
	"strconv"
	"strings"
)

func Like(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/posts/")
	path = strings.TrimSuffix(path, "/like")
	postID, err := strconv.Atoi(path)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid post id"})
		return
	}

	cookie, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "not logged in"})
		return
	}

	var userID int
	err = db.DB.QueryRow(
		"SELECT user_id FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP",
		cookie.Value,
	).Scan(&userID)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "session expired"})
		return
	}

	var existingID int
	err = db.DB.QueryRow(
		"SELECT id FROM reactions WHERE user_id = ? AND post_id = ? AND value = 1",
		userID, postID,
	).Scan(&existingID)

	if err == nil {
		_, err = db.DB.Exec("DELETE FROM reactions WHERE id = ?", existingID)
		if err != nil {
			log.Println("failed to remove like:", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to unlike"})
			return
		}
	} else {
		_, err = db.DB.Exec(
			"INSERT INTO reactions (user_id, post_id, value) VALUES (?, ?, 1)",
			userID, postID,
		)
		if err != nil {
			log.Println("failed to add like:", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "failed to like"})
			return
		}
	}

	var likesCount int
	db.DB.QueryRow(
		"SELECT COUNT(*) FROM reactions WHERE post_id = ? AND value = 1",
		postID,
	).Scan(&likesCount)

	var likedByMe bool
	err = db.DB.QueryRow(
		"SELECT 1 FROM reactions WHERE user_id = ? AND post_id = ? AND value = 1",
		userID, postID,
	).Scan(new(int))
	likedByMe = (err == nil)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"likes_count": likesCount,
		"liked_by_me": likedByMe,
	})
}
