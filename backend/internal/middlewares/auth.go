package middlewares

import (
	"context"
	"net/http"
	"time"

	"social-net/internal/db"
	"social-net/internal/response"
)

type contextKey string

const UserIDKey contextKey = "userID"

func GetUserID(r *http.Request) (int, bool) {
	id, ok := r.Context().Value(UserIDKey).(int)
	return id, ok
}

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_id")
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "not logged in")
			return
		}

		var userID int
		err = db.DB.QueryRow(`
			SELECT user_id FROM sessions
			WHERE id = ? AND expires_at > ?
		`, cookie.Value, time.Now().UTC().Format("2006-01-02 15:04:05")).Scan(&userID)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "session expired")
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}
