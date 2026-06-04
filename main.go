package main

import (
	"social-network/auth"
	"net/http"
	"log"
	"fmt"
)


func main(){
	// func (w http.ResponseWriter, r *http.Request) {

	// }

	database, err := sql.Open("sqlite3", "./data/forum.db")
	if err != nil {
		fmt.Errorf("failed to open db %v", err)
	}

	defer database.Close()
	mux := http.NewServeMux()
	mux.HandleFunc("/", auth.ShowRegister)
	mux.HandleFunc("/register", auth.Register)

	fmt.Println("Server is running on port 8080")

	log.Fatal(http.ListenAndServe(":8080", mux))
	// auth.Register
}