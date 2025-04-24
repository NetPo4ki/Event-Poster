package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

// DB is the database connection
var DB *sql.DB

// InitDB initializes the database
func InitDB() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		// Create data directory if it doesn't exist
		dataDir := "./data"
		if err := os.MkdirAll(dataDir, 0755); err != nil {
			log.Fatalf("Failed to create data directory: %v", err)
		}

		// Default to a SQLite database in the data directory
		dbPath = "./data/event_poster.db"
		log.Printf("Using database at: %s", dbPath)
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB = db

	// Create tables if they don't exist
	createTables()
}

// createTables creates the database tables
func createTables() {
	// Enable foreign key constraints
	_, err := DB.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		log.Fatalf("Failed to enable foreign key constraints: %v", err)
	}

	// Create users table if it doesn't exist
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			role TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}

	// Create events table if it doesn't exist
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT,
			location TEXT,
			event_type TEXT NOT NULL,
			event_date TEXT NOT NULL,
			seats INTEGER NOT NULL,
			creator_id INTEGER,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (creator_id) REFERENCES users(id)
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create events table: %v", err)
	}

	// Create registrations table if it doesn't exist
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS registrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			event_id INTEGER NOT NULL,
			user_id INTEGER,
			first_name TEXT NOT NULL,
			last_name TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create registrations table: %v", err)
	}

	log.Println("Database tables verified successfully")
}

// CloseDB closes the database connection
func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}
