package chat

import (
	"fmt"

	"social-net/internal/db"
)

type Error struct{ Msg string }

func (e *Error) Error() string { return e.Msg }

func CanSendPrivateMessage(senderID, recipientID int) (bool, string) {
	if senderID == recipientID {
		return false, "cannot message yourself"
	}

	var linked int
	db.DB.QueryRow(`
		SELECT 1 FROM follows
		WHERE (follower_id = ? AND following_id = ?)
		   OR (follower_id = ? AND following_id = ?)
	`, senderID, recipientID, recipientID, senderID).Scan(&linked)
	if linked != 1 {
		return false, "users must follow each other or one must follow the other"
	}

	var recipientFollowsSender, isPublic int
	db.DB.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?),
			(SELECT is_public FROM users WHERE id = ?)
	`, recipientID, senderID, recipientID).Scan(&recipientFollowsSender, &isPublic)

	if recipientFollowsSender == 0 && isPublic == 0 {
		return false, "cannot send message to this user"
	}

	return true, ""
}

func SendPrivateMessage(senderID, recipientID int, content string) (int64, error) {
	ok, msg := CanSendPrivateMessage(senderID, recipientID)
	if !ok {
		return 0, &Error{Msg: msg}
	}

	res, err := db.DB.Exec(`
		INSERT INTO private_messages (sender_id, recipient_id, content) VALUES (?, ?, ?)
	`, senderID, recipientID, content)
	if err != nil {
		return 0, fmt.Errorf("insert message: %w", err)
	}
	return res.LastInsertId()
}

func IsGroupMember(groupID, userID int) bool {
	var exists int
	db.DB.QueryRow(`
		SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'
	`, groupID, userID).Scan(&exists)
	return exists == 1
}
