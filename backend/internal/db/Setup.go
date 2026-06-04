package db

import (
	"database/sql"
	"fmt"
)

func Setup (database *sql.DB) {

	schema := `
	CREATE TABLE IF NOT EXISTS users(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
		`
	_, err := database.Exec(schema)
	if err != nil {
		fmt.Printf("failed to create table users %v", err)
	}	
}