package db

import (
	"database/sql"
	_"embed"
	"fmt"
)

var schema string

func Setup (database *sql.DB) {
	_, err := database.Exec(schema)
	if err != nil {
		fmt.Printf("failed to create table users %v", err)
		return
		}	
}