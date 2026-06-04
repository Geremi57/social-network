package main

import (
	"social-network/backend/internal/handlers"
	"social-network/backend/internal/db"
	"net/http"
	"database/sql"
	"log"
	"fmt"
	_"github.com/mattn/go-sqlite3"
)

var database *sql.DB


func main(){
	// func (w http.ResponseWriter, r *http.Request) {

	// }

	var err error

	database, err = sql.Open("sqlite3", "forum.db")
	if err != nil {
		log.Fatalf("failed to open db %v", err)
	}

	defer database.Close()

	db.Setup(database)

	authHandler := &handlers.AuthHandler{
		DB: database,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", handlers.ShowRegister)
	mux.HandleFunc("/log", handlers.ShowLogin)
	mux.HandleFunc("/login", authHandler.Login)
	mux.HandleFunc("/register", authHandler.Register)

	fmt.Println("Server is running on port 8080")

	log.Fatal(http.ListenAndServe(":8080", mux))
	// auth.Register
}