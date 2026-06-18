package handlers

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
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
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	DateOfBirth string `json:"dateOfBirth"`
	AboutMe     string `json:"aboutMe"`
	Nickname    string `json:"nickname"`
	Avatar      string `json:"avatar"`
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

	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	req := RegisterRequest{
		FirstName:   r.FormValue("firstName"),
		LastName:    r.FormValue("lastName"),
		Email:       r.FormValue("email"),
		Password:    r.FormValue("password"),
		DateOfBirth: r.FormValue("dateOfBirth"),
		Nickname:    r.FormValue("nickname"),
		AboutMe:     r.FormValue("aboutMe"),
	}

	file, header, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()

		os.MkdirAll("uploads", os.ModePerm)

		filePath := filepath.Join("uploads", header.Filename)

		dst, err := os.Create(filePath)
		if err != nil {
			log.Println(err)
		} else {
			defer dst.Close()

			_, err = io.Copy(dst, file)
if err != nil {
    log.Println("copy error:", err)
} else {
    log.Println("avatar saved successfully")
}
			if err != nil {
				log.Println(err)
			}

			req.Avatar = filePath
		}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "something went wrong"})
		return
	}

	_, err = db.DB.Exec(
		"INSERT INTO users (firstname, lastname, password_hash, date_of_birth, email, avatar, about_me, nickname) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		req.FirstName, req.LastName, string(hash), req.DateOfBirth, req.Email, req.Avatar, req.AboutMe, req.Nickname,
	)

	if err != nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "email is already taken"})
		return
	}

	// w.WriteHeader(http.StatusCreated)
	// json.NewEncoder(w).Encode(map[string]string{"message": "registration successful"})

	var id int
	var username string

	err = db.DB.QueryRow(
		"SELECT id, firstname FROM users WHERE email = ?",
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
