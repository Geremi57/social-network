package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"social-net/internal/db"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)


type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var logReq LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&logReq); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}

	var id int
	var username, passwordHash string

	err := db.DB.QueryRow(
		"SELECT id, password_hash FROM users WHERE email = ?",
		logReq.Email).Scan(&id, &passwordHash)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid email or password"})
		return
	}


	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(logReq.Password)); err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid email or password"})
		return

	}

	db.DB.Exec("DELETE FROM sessions WHERE user_id = ?", id)


	sessionID := uuid.NewString()
	expiry := time.Now().Add(24 * time.Hour)

	_, err = db.DB.Exec("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
		sessionID, id, expiry)
	if err != nil {
		log.Println("session insert error:", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "something went wrong"})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Expires:  expiry,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "login successfull",
		"user": map[string]interface{}{
			"id":       id,
			"username": username,
			"email":    logReq.Email,
		},
	})

	http.Redirect(w, r, "/", http.StatusSeeOther)
}
