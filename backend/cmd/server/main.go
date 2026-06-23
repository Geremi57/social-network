package main

import (
	// "database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"

	// "social-network/backend/internal/db"
	"social-net/internal/db"
	"social-net/internal/handlers"
	"social-net/internal/middlewares"

	_ "github.com/mattn/go-sqlite3"
)

// var database *sql.DB

func main() {
	// func (w http.ResponseWriter, r *http.Request) {

	// }

	var err error

	// database, err = sql.Open("sqlite3", "social-network.db")
	if err != nil {
		log.Fatalf("failed to open db %v", err)
	}

	// defer database.Close()

	if err := db.Open(); err != nil {
		log.Fatalf("failed to open db: %v", err)
	}

	if err := db.RunMigrations(); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	// authHandler := &handlers.AuthHandler{
	// 	DB: database,
	// }

	mux := http.NewServeMux()
	mux.HandleFunc("/", handlers.ShowRegister)
	mux.HandleFunc("/log", handlers.ShowLogin)
	mux.HandleFunc("/login", handlers.Login)
	mux.HandleFunc("/logout", handlers.Logout)
	mux.HandleFunc("/register", handlers.Register)
	mux.HandleFunc("/me", handlers.Me)

	mux.Handle(
		"/uploads/",
		http.StripPrefix(
			"/uploads/",
			http.FileServer(http.Dir("./uploads")),
		),
	)
	mux.HandleFunc("/users/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/posts") {
			handlers.GetUserPosts(w, r)
		} else {
			handlers.GetUser(w, r)
		}
	})
	mux.HandleFunc("/posts", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.SendPost(w, r)
		} else if r.Method == http.MethodGet {
			handlers.GetPosts(w, r)
		}
	})

	mux.HandleFunc("/posts/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/like") && r.Method == http.MethodPost {
			handlers.Like(w, r)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	})

	mux.HandleFunc("/follow/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.FollowUser(w, r)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})
		mux.HandleFunc("/unfollow/", handlers.Unfollow)


	fmt.Println("Server is running on port 8080")

	log.Fatal(http.ListenAndServe(":8080", middlewares.EnableCORS(mux)))
	// auth.Register
}
