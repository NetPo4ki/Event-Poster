package models

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Role represents user roles in the application
type Role string

const (
	// RoleUser represents a regular user
	RoleUser Role = "user"
)

// User represents a user in the system
type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"` // Don't return password in JSON
	Email     string    `json:"email"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// UserRequest represents the request body for creating or updating a user
type UserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required"`
}

// LoginRequest represents the request body for logging in
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the response for a successful login
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// Validate performs validation on the user request
func (r *UserRequest) Validate() error {
	if r.Username == "" {
		return errors.New("username is required")
	}
	if r.Password == "" {
		return errors.New("password is required")
	}
	if r.Email == "" {
		return errors.New("email is required")
	}
	return nil
}

// HashPassword hashes the password
func (r *UserRequest) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(r.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	r.Password = string(hashedPassword)
	return nil
}

// ComparePassword compares a password with the hashed password
func (u *User) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// ToUser converts a UserRequest to a User
func (r *UserRequest) ToUser() *User {
	return &User{
		Username: r.Username,
		Password: r.Password,
		Email:    r.Email,
		Role:     RoleUser,
	}
}
