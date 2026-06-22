package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"social-network/backend/internal/db"
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

	var userID int
	var firstName, lastName, email, avatar, about_me, nickname string
	var isPublic bool

	err = db.DB.QueryRow(
		"SELECT id, firstname, lastname, email, avatar, about_me, nickname, is_public FROM users WHERE id = ?",
		id,
	).Scan(&userID, &firstName, &lastName, &email, &avatar, &about_me, &nickname, &isPublic)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "user not found"})
		return
	}

	followStatus := "none"

	isOwn := requesterID == userID

	var isFollowing bool
	var numb int
	err = db.DB.QueryRow(
		"SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?",
		strconv.Itoa(requesterID), strconv.Itoa(userID),
	).Scan(new(int))
	isFollowing = (err == nil)

	if err == nil {
		followStatus = "following"
	}

	if followStatus == "none" {
    err = db.DB.QueryRow(
        `SELECT 1 FROM follow_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'`,
        requesterID,
        userID,
    ).Scan(&numb)

    if err == nil {
        followStatus = "pending"
    }
}

	restricted := !isPublic && !isOwn && !isFollowing

	fmt.Println(followStatus)

	if restricted {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":         userID,
			"firstname":  firstName,
			"lastname":   lastName,
			"avatar":     avatar,
			"is_public":  isPublic,
			"restricted": true,
			"follow_status": followStatus,
			"isfollowing": false,
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         userID,
		"firstname":  firstName,
		"lastname":   lastName,
		"email":      email,
		"avatar":     avatar,
		"aboutme":    about_me,
		"nickname":   nickname,
		"is_public":  isPublic,
		"follow_status": followStatus,
		"restricted": false,
		"isfollowing": isFollowing,
	})
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

	var isPublic bool
	err = db.DB.QueryRow("SELECT is_public FROM users WHERE id = ?", id).Scan(&isPublic)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "user not found"})
		return
	}

	isOwn := requesterID == id

	var isFollowing bool
	err = db.DB.QueryRow(
		"SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?",
		strconv.Itoa(requesterID), strconv.Itoa(id),
	).Scan(new(int))
	isFollowing = (err == nil)

	if !isPublic && !isOwn && !isFollowing {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode([]interface{}{}) // empty array, not an error
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
