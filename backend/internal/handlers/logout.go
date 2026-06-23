package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"social-net/internal/db"
)

func Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-Type", "application/json")

	cookie, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "not logged in"})
		return
	}

	db.DB.Exec("DELETE FROM sessions WHERE id = ?", cookie.Value)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "logged out"})
}

func Me(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "not logged in"})
		return
	}

	var userID int
	var username, email, avatar string
	err = db.DB.QueryRow(`
        SELECT u.id, u.firstname, u.email, u.avatar 
        FROM users u 
        JOIN sessions s ON s.user_id = u.id 
        WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
    `, cookie.Value).Scan(&userID, &username, &email, &avatar)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "session expired"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":       userID,
		"firstname": username,
		"email":    email,
		"avatar": avatar,
	})
}
