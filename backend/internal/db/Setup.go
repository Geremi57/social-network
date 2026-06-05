package db

import (
	"database/sql"
	_ "embed"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"

)

var (
	schema string
	DB     *sql.DB
)

func Setup() {
	var err error
	DB, err = sql.Open("sqlite3", "../social-network.db")

	_, err = DB.Exec(schema)
	if err != nil {
		fmt.Printf("failed to create table users %v", err)
		return
	}
	log.Println("databse is ready")
}

func RunMigrations() {
	driver, err := sqlite3.WithInstance(DB, &sqlite3.Config{})
	if err != nil {
		log.Fatal("failed to create migration driver:", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://internal/db/migrations/sqlite",
		"sqlite3",
		driver,
	)
	if err != nil {
		log.Fatal("failed to create migrator:", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatal("failed to run migrations:", err)
	}

	log.Println("migrations applied")
}
