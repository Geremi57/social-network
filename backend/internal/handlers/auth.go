package handlers

import (
	"net/http"
	"golang.org/x/crypto/bcrypt"
	"database/sql"
	"fmt"
)

type AuthHandler struct {
	DB       *sql.DB
	// Renderer *handlers.Handler
}

func ShowRegister(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./register.html")
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request){
	username := r.FormValue("username")

	email := r.FormValue("email")

	password := r.FormValue("password")

	confPassword := r.FormValue("confirmPassword")

	if confPassword == "" || username == "" || password == "" || email == "" {
		http.Error(w, "all fields are required", http.StatusBadRequest)
		return
	}

	if confPassword != password {
		http.Error(w, "Passwords do not match", http.StatusBadRequest)
		return
	}

	schema := `INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)`

	passByte := []byte(password)

	fmt.Println(passByte)
	hashedPassword, erro := bcrypt.GenerateFromPassword(passByte, bcrypt.DefaultCost)

	if erro != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

		_,err := h.DB.Exec(schema, username, string(hashedPassword), email)
		if err != nil {
			http.Error(w, "user with these credentials already exists", http.StatusInternalServerError)
			return
		}


	fmt.Println(hashedPassword)
}