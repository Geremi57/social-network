package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"social-network/backend/internal/db"
	"strconv"
)

type PostRequest struct {
	Viewers []int  `json:"viewers"`
	Content string `json:"content"`
	Privacy string `json:"privacy"`
}

func SendPost(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")

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

	var authorName string
	var avatar string
	db.DB.QueryRow(
		"SELECT firstname, avatar FROM users WHERE id = ?",
		userID,
	).Scan(&authorName, &avatar)

	fmt.Println(authorName)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "content is required"})
		return
	}

	content := r.FormValue("content")
	privacy := r.FormValue("privacy")
	viewersJSON := r.FormValue("viewers")

	if content == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "content is required"})
		return
	}

	if privacy == "" {
		privacy = "public"
	}

	if privacy != "public" && privacy != "almost_private" && privacy != "private" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid privacy settings"})
		return
	}

	var imagePath string
	file, header, err := r.FormFile("image")

	if err == nil {
		defer file.Close()
		imagePath = "uploads/" + strconv.Itoa(userID) + "_" + header.Filename

	}

	fmt.Println(avatar)

	result, err := db.DB.Exec(
		"INSERT INTO posts (user_id, content, author_name, image_path, privacy, avatar) VALUES (?, ?, ?, ?, ?, ?)",
		userID, content, authorName, imagePath, privacy, avatar,
	)

	if err != nil {
		log.Println("failed to create post:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to create post"})
		return
	}

	postID, _ := result.LastInsertId()

	if privacy == "private" && viewersJSON != "" {
		var viewers []int
		if err := json.Unmarshal([]byte(viewersJSON), &viewers); err != nil {
			for _, viewerID := range viewers {
				db.DB.Exec(
					"INSERT INTO post_viewers (post_id, user_id) VALUES (?, ?)",
					postID, viewerID,
				)
			}
		}

	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "post created",
		"post_id": postID,
	})

}

func GetPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// get user from session
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

	rows, err := db.DB.Query(`
		SELECT 
			p.id, p.content, p.image_path, p.privacy, p.created_at,
			u.id, u.firstname, p.avatar
		FROM posts p
		JOIN users u ON u.id = p.user_id
		WHERE 
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
		ORDER BY p.created_at DESC
	`, userID, userID, userID)
	if err != nil {
		log.Println("failed to fetch posts:", err)
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
		Firstname  string `json:"firstname"`
		Avatar string `json:"avatar"`
	}

	posts := []Post{}
	for rows.Next() {
		var p Post
		err := rows.Scan(
			&p.ID, &p.Content, &p.ImagePath, &p.Privacy, &p.CreatedAt,
			&p.AuthorID, &p.Firstname, &p.Avatar,
		)
		if err != nil {
			log.Println("scan error:", err)
			continue
		}
		posts = append(posts, p)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}
