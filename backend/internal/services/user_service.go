package services

import (
	"database/sql"
	"errors"
	"time"

	"github.com/netpo4ki/event-poster/internal/database"
	"github.com/netpo4ki/event-poster/internal/middleware"
	"github.com/netpo4ki/event-poster/internal/models"
)

// UserService handles the business logic for users
type UserService struct{}

// NewUserService creates a new UserService
func NewUserService() *UserService {
	return &UserService{}
}

// Register creates a new user
func (s *UserService) Register(req *models.UserRequest) (int64, error) {
	if err := req.Validate(); err != nil {
		return 0, err
	}

	// Check if username already exists
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE username = ?", req.Username).Scan(&count)
	if err != nil {
		return 0, err
	}
	if count > 0 {
		return 0, errors.New("username already exists")
	}

	// Check if email already exists
	err = database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", req.Email).Scan(&count)
	if err != nil {
		return 0, err
	}
	if count > 0 {
		return 0, errors.New("email already exists")
	}

	// Hash the password
	if err := req.HashPassword(); err != nil {
		return 0, err
	}

	// Insert the user
	result, err := database.DB.Exec(`
		INSERT INTO users (username, password, email, role)
		VALUES (?, ?, ?, ?)
	`, req.Username, req.Password, req.Email, models.RoleUser)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// Login authenticates a user and returns a JWT token
func (s *UserService) Login(req *models.LoginRequest) (*models.LoginResponse, error) {
	// Find the user by username
	user, err := s.GetUserByUsername(req.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid username or password")
		}
		return nil, err
	}

	// Check the password
	if err := user.ComparePassword(req.Password); err != nil {
		return nil, errors.New("invalid username or password")
	}

	// Generate a token
	token, err := middleware.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{
		Token: token,
		User:  *user,
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id int64) (*models.User, error) {
	var user models.User
	var createdAtStr string

	err := database.DB.QueryRow(`
		SELECT id, username, password, email, role, created_at
		FROM users
		WHERE id = ?
	`, id).Scan(
		&user.ID,
		&user.Username,
		&user.Password,
		&user.Email,
		&user.Role,
		&createdAtStr,
	)
	if err != nil {
		return nil, err
	}

	user.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	return &user, nil
}

// GetUserByUsername retrieves a user by username
func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	var createdAtStr string

	err := database.DB.QueryRow(`
		SELECT id, username, password, email, role, created_at
		FROM users
		WHERE username = ?
	`, username).Scan(
		&user.ID,
		&user.Username,
		&user.Password,
		&user.Email,
		&user.Role,
		&createdAtStr,
	)
	if err != nil {
		return nil, err
	}

	user.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	return &user, nil
}

// GetAllUsers retrieves all users
func (s *UserService) GetAllUsers() ([]models.User, error) {
	rows, err := database.DB.Query(`
		SELECT id, username, password, email, role, created_at
		FROM users
		ORDER BY created_at
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		var createdAtStr string

		if err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Password,
			&user.Email,
			&user.Role,
			&createdAtStr,
		); err != nil {
			return nil, err
		}

		user.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
		users = append(users, user)
	}

	return users, nil
}

// DeleteUser deletes a user by ID
func (s *UserService) DeleteUser(id int64) error {
	result, err := database.DB.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("user not found")
	}

	return nil
}

// GetUserRegistrations retrieves all registrations for a user
func (s *UserService) GetUserRegistrations(userID int64) ([]models.RegistrationResponse, error) {
	rows, err := database.DB.Query(`
		SELECT r.id, r.event_id, r.first_name, r.last_name, r.created_at,
			   e.title, e.event_date, e.event_type
		FROM registrations r
		JOIN events e ON r.event_id = e.id
		WHERE r.user_id = ?
		ORDER BY e.event_date
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var registrations []models.RegistrationResponse
	for rows.Next() {
		var reg models.RegistrationResponse
		var regCreatedAtStr, eventDateStr string

		if err := rows.Scan(
			&reg.ID,
			&reg.EventID,
			&reg.FirstName,
			&reg.LastName,
			&regCreatedAtStr,
			&reg.EventTitle,
			&eventDateStr,
			&reg.EventType,
		); err != nil {
			return nil, err
		}

		reg.CreatedAt, _ = time.Parse(time.RFC3339, regCreatedAtStr)
		reg.EventDate, _ = time.Parse(time.RFC3339, eventDateStr)
		registrations = append(registrations, reg)
	}

	return registrations, nil
}
