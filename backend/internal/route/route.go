package route

import (
	"net/http"
	"strings"

	"social-net/internal/handlers"
	"social-net/internal/method"
	"social-net/internal/middlewares"
)

func Notifications(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/read") {
		method.POST(middlewares.RequireAuth(handlers.MarkNotificationRead))(w, r)
	} else {
		http.NotFound(w, r)
	}
}

func Chats(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		middlewares.RequireAuth(handlers.GetPrivateMessages)(w, r)
	case http.MethodPost:
		middlewares.RequireAuth(handlers.SendPrivateMessageHTTP)(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
