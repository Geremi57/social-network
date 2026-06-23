package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Open() error {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = filepath.Join("data", "social-network.db")
	}

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return fmt.Errorf("create data dir: %w", err)
	}

	var err error
	DB, err = sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
	if err != nil {
		return fmt.Errorf("open db: %w", err)
	}

	if _, err = DB.Exec("PRAGMA journal_mode = WAL"); err != nil {
		return fmt.Errorf("set wal mode: %w", err)
	}

	return nil
}

func RunMigrations() error {
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		migrationsPath = filepath.Join("internal", "db", "migrations", "sqlite")
	}

	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("resolve migrations path: %w", err)
	}

	driver, err := sqlite3.WithInstance(DB, &sqlite3.Config{})
	if err != nil {
		return fmt.Errorf("migration driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://"+filepath.ToSlash(absPath),
		"sqlite3",
		driver,
	)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("run migrations: %w", err)
	}

	log.Println("migrations applied")
	return nil
}
