package auth

import "net/http"

func ShowRegister(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./register.html")
}

func Register(w http.ResponseWriter, r *http.Request){
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

	
}