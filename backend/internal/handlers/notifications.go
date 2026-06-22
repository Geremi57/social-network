package handlers

import (
	"database/sql"
	"net/http"

	"social-net/internal/db"
	"social-net/internal/middlewares"
	"social-net/internal/response"
)

func ListNotifications(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	rows, err := db.DB.Query(`
		SELECT n.id, n.type, n.actor_id, n.entity_id, n.entity_type, n.is_read, n.created_at,
		       u.first_name, u.last_name
		FROM notifications n
		LEFT JOIN users u ON u.id = n.actor_id
		WHERE n.user_id = ?
		ORDER BY n.created_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "something went wrong")
		return
	}
	defer rows.Close()

	notifs := scanNotifications(rows)
	response.JSON(w, http.StatusOK, notifs)
}

func MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	notifID, err := pathID(r, "notifications")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid notification id")
		return
	}

	db.DB.Exec(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, notifID, userID)
	response.JSON(w, http.StatusOK, map[string]string{"message": "marked as read"})
}

func MarkAllNotificationsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := middlewares.GetUserID(r)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "not logged in")
		return
	}

	db.DB.Exec(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, userID)
	response.JSON(w, http.StatusOK, map[string]string{"message": "all marked as read"})
}

func scanNotifications(rows *sql.Rows) []map[string]any {
	var notifs []map[string]any
	for rows.Next() {
		var id int
		var notifType, createdAt string
		var actorID, entityID sql.NullInt64
		var entityType sql.NullString
		var isRead int
		var fn, ln sql.NullString
		rows.Scan(&id, &notifType, &actorID, &entityID, &entityType, &isRead, &createdAt, &fn, &ln)
		n := map[string]any{
			"id": id, "type": notifType, "is_read": isRead == 1, "created_at": createdAt,
		}
		if actorID.Valid {
			n["actor_id"] = actorID.Int64
		}
		if entityID.Valid {
			n["entity_id"] = entityID.Int64
		}
		if entityType.Valid {
			n["entity_type"] = entityType.String
		}
		if fn.Valid {
			n["actor"] = map[string]string{"first_name": fn.String, "last_name": ln.String}
		}
		notifs = append(notifs, n)
	}
	if notifs == nil {
		notifs = []map[string]any{}
	}
	return notifs
}
