CREATE TABLE IF NOT EXISTS users(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		firstname TEXT NOT NULL,
		lastname TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		date_of_birth DATE NOT NULL,
		email TEXT NOT NULL UNIQUE,
		avatar TEXT,
		about_me TEXT,
		nickname TEXT,
		is_public BOOLEAN,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);