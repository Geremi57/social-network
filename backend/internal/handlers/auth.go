package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"social-network/backend/internal/db"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB *sql.DB
	// Renderer *handlers.Handler
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func ShowRegister(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../register.html")
}

func ShowLogin(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../login.html")
}

func Register(w http.ResponseWriter, r *http.Request) {
	// username := r.FormValue("username")

	// email := r.FormValue("email")

	// password := r.FormValue("password")

	// confPassword := r.FormValue("confirmPassword")

	// if confPassword == "" || username == "" || password == "" || email == "" {
	// 	http.Error(w, "all fields are required", http.StatusBadRequest)
	// 	return
	// }
	w.Header().Set("Content-Type", "application/json")

	var req RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "something went wrong"})
		return
	}

	_, err = db.DB.Exec(
		"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
		req.Name, req.Email, string(hash),
	)
	
	if err != nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "email or username already exists"})
		return
	}

	// w.WriteHeader(http.StatusCreated)
	// json.NewEncoder(w).Encode(map[string]string{"message": "registration successful"})

	var id int
	var username string

	err = db.DB.QueryRow(
		"SELECT id, username FROM users WHERE email = ?",
		req.Email).Scan(&id, &username)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid email or password"})
		return
	}

	
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
			"email":    req.Email,
		},
	})

	// http.Redirect(w, r, "/", http.StatusSeeOther)

	// fmt.Println(hashedPassword)
}
