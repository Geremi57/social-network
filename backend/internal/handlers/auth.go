package handlers

import (
	"net/http"
	"golang.org/x/crypto/bcrypt"
	"database/sql"
	"fmt"
	"social-network/backend/internal/db"
	"encoding/json"
)

type AuthHandler struct {
	DB       *sql.DB
	// Renderer *handlers.Handler
}

type RegisterRequest struct {
	Name string `json:"name"`
	Email string `json:"email"`
	Password string `json:"password"`
}

func ShowRegister(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../register.html")
}

func ShowLogin(w http.ResponseWriter, r *http.Request){
	http.ServeFile(w, r, "../login.html")
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request){
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
		json.NewEncoder(w).Encode(map[string]string{"error": "email or username already registered"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "registration successful"})


	http.Redirect(w, r, "/", http.StatusSeeOther)

	// fmt.Println(hashedPassword)
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