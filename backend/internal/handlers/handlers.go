package handlers

import (
	"encoding/json"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"social-net/internal/db"
	imginternal "social-net/internal/images"
)

func decodeJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func pathID(r *http.Request, segment string) (int, error) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	for i, p := range parts {
		if p == segment && i+1 < len(parts) {
			return strconv.Atoi(parts[i+1])
		}
	}
	return 0, strconv.ErrSyntax
}

func saveAvatar(file multipart.File, header *multipart.FileHeader) (string, string, error) {
	return imginternal.Save(file, header, "avatars")
}

func createNotification(recipientID int, notifType string, actorID, entityID int, entityType string) {
	db.DB.Exec(`
		INSERT INTO notifications (user_id, type, actor_id, entity_id, entity_type)
		VALUES (?, ?, ?, ?, ?)
	`, recipientID, notifType, actorID, entityID, entityType)
}

func isGroupMember(groupID, userID int) bool {
	var exists int
	db.DB.QueryRow(`
		SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'
	`, groupID, userID).Scan(&exists)
	return exists == 1
}
