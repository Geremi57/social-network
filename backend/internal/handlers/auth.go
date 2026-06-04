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
	http.ServeFile(w, r, "../register.html")
}

func ShowLogin(w http.ResponseWriter, r *http.Request){
	http.ServeFile(w, r, "../login.html")
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


func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request){
	email := r.FormValue("email")
	password := r.FormValue("password")

	if password == "" || email == "" {
		http.Error(w, "please fill in all entries", http.StatusBadRequest)
		return
	}

	schema := `SELECT username, id, password_hash FROM users WHERE email = ?`

	row := h.DB.QueryRow(schema, email)

	var dbemail, dbPassword string

	var user_id int

	row.Scan(&dbemail, &user_id, &dbPassword)

	err := bcrypt.CompareHashAndPassword([]byte(dbPassword), []byte(password))

	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusBadRequest)
		return
	}

	fmt.Fprintf(w, "Welcome back %v", dbemail)
	fmt.Println(dbemail, email, user_id, dbPassword)
	// if 
}