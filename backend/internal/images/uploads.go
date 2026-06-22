package images

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	uuid "github.com/gofrs/uuid/v5"
)

var allowedMIME = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
}

func Save(file multipart.File, header *multipart.FileHeader, category string) (string, string, error) {
	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return "", "", fmt.Errorf("read file: %w", err)
	}

	mime := http.DetectContentType(buf[:n])
	ext, ok := allowedMIME[mime]
	if !ok {
		return "", "", fmt.Errorf("unsupported image type: %s", mime)
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", "", fmt.Errorf("seek file: %w", err)
	}

	dir := filepath.Join("uploads", category)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", "", fmt.Errorf("create upload dir: %w", err)
	}

	addUd, _ := uuid.NewV4()

	name := addUd.String() + ext
	fullPath := filepath.Join(dir, name)

	out, err := os.Create(fullPath)
	if err != nil {
		return "", "", fmt.Errorf("create file: %w", err)
	}
	defer out.Close()

	reader := io.MultiReader(bytes.NewReader(buf[:n]), file)
	if _, err := io.Copy(out, reader); err != nil {
		os.Remove(fullPath)
		return "", "", fmt.Errorf("write file: %w", err)
	}

	return filepath.ToSlash(fullPath), mime, nil
}
