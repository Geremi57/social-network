package models

import (
	"database/sql"

	"social-net/internal/db"
)

func UserRow(id int) map[string]any {
	var firstName, lastName, email, dob string
	var nickname, aboutMe, avatarPath sql.NullString
	var isPublic int
	db.DB.QueryRow(`
		SELECT firstname, lastname, email, date_of_birth, nickname, about_me, avatar_path, is_public
		FROM users WHERE id = ?
	`, id).Scan(&firstName, &lastName, &email, &dob, &nickname, &aboutMe, &avatarPath, &isPublic)

	user := map[string]any{
		"id":            id,
		"firstname":     firstName,
		"lastname":      lastName,
		"email":         email,
		"date_of_birth": dob,
		"is_public":     isPublic == 1,
	}
	if nickname.Valid {
		user["nickname"] = nickname.String
	}
	if aboutMe.Valid {
		user["about_me"] = aboutMe.String
	}
	if avatarPath.Valid {
		user["avatar_path"] = avatarPath.String
	}
	return user
}
