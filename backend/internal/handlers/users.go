package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"social-network/backend/internal/db"
	"strconv"
	"strings"

	"social-net/internal/middlewares"
	"social-net/internal/response"
)

func GetUser(w http.ResponseWriter, r *http.Request) {
	fmt.Println("ive been hit")
	w.Header().Set("Content-Type", "application/json")

	idStr := strings.TrimPrefix(r.URL.Path, "/users/")
	idStr = strings.TrimSuffix(idStr, "/posts") // in case it slips through
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid user id"})
		return
	}

	var userID int
	var firstName, lastName, email, avatar, about_me, nickname string
	// var date_of_birth date
	err = db.DB.QueryRow(
		"SELECT id, firstname, lastname, email, avatar, about_me, nickname FROM users WHERE id = ?",
		id,
	).Scan(&userID, &firstName, &lastName, &email, &avatar, &about_me, &nickname)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "user not found"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":        userID,
		"firstname": firstName,
		"lastname":  lastName,
		"email":     email,
		"avatar":    avatar,
		"aboutme":   about_me,
		"nickname":  nickname,
	})
}

type privacyRequest struct {
	IsPublic bool `json:"is_public"`
}

func UpdatePrivacy(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	var req privacyRequest
	if err := decodeJSON(r, &req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	val := 0
	if req.IsPublic {
		val = 1
	}
	db.DB.Exec("UPDATE users SET is_public = ? WHERE id = ?", val, userID)
	response.JSON(w, http.StatusOK, map[string]any{"is_public": req.IsPublic})
}

func GetUserPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	path := strings.TrimPrefix(r.URL.Path, "/users/")
	path = strings.TrimSuffix(path, "/posts")
	id, err := strconv.Atoi(path)
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

	rows, err := db.DB.Query(`
		SELECT 
    p.id, p.content, p.image_path, p.privacy, p.created_at,
    u.id, u.firstname, u.avatar
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.user_id = ?
AND (
    p.privacy = 'public'
    OR p.user_id = ?
    OR (p.privacy = 'almost_private' AND EXISTS (
        SELECT 1 FROM followers 
        WHERE follower_id = ? AND following_id = p.user_id
    ))
    OR (p.privacy = 'private' AND EXISTS (
        SELECT 1 FROM post_viewers 
        WHERE post_id = p.id AND user_id = ?
    ))
)
ORDER BY p.created_at DESC
	`, id, requesterID, requesterID, requesterID)
	if err != nil {
		log.Println("failed to fetch user posts:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch posts"})
		return
	}
	defer rows.Close()

	type Post struct {
		ID        int    `json:"id"`
		Content   string `json:"content"`
		ImagePath string `json:"image_path"`
		Privacy   string `json:"privacy"`
		CreatedAt string `json:"created_at"`
		AuthorID  int    `json:"author_id"`
		Firstname string `json:"firstname"`
		Avatar    string `json:"avatar"`
	}

	posts := []Post{}
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.Content, &p.ImagePath, &p.Privacy, &p.CreatedAt, &p.AuthorID, &p.Firstname, &p.Avatar); err != nil {
			log.Println("scan error:", err)
			continue
		}
		posts = append(posts, p)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}
