package com.example.Authserver.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {
    @Id
    private String id;
    private String email;
    private String fullName;
    private String role; // "student" or "professor"
    private String googleId; // Used for Google OAuth users
    private String password; // Only for local auth
    private String studentId; // Only for students
    private boolean roleAssigned; // Whether the user has selected a role
    private boolean disabled;

    // Default constructor
    public User() {
    }

    // All-args constructor
    public User(String id, String email, String fullName, String role, String googleId,
                String password, String studentId, boolean roleAssigned, boolean disabled) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.googleId = googleId;
        this.password = password;
        this.studentId = studentId;
        this.roleAssigned = roleAssigned;
        this.disabled = disabled;
    }

    // Static method to get a builder
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    // Builder class
    public static class UserBuilder {
        private String id;
        private String email;
        private String fullName;
        private String role;
        private String googleId;
        private String password;
        private String studentId;
        private boolean roleAssigned;
        private boolean disabled;

        public UserBuilder id(String id) {
            this.id = id;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public UserBuilder role(String role) {
            this.role = role;
            return this;
        }

        public UserBuilder googleId(String googleId) {
            this.googleId = googleId;
            return this;
        }

        public UserBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }

        public UserBuilder roleAssigned(boolean roleAssigned) {
            this.roleAssigned = roleAssigned;
            return this;
        }

        public UserBuilder disabled(boolean disabled) {
            this.disabled = disabled;
            return this;
        }

        public User build() {
            return new User(id, email, fullName, role, googleId, password, studentId, roleAssigned, disabled);
        }
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public boolean isRoleAssigned() { return roleAssigned; }
    public void setRoleAssigned(boolean roleAssigned) { this.roleAssigned = roleAssigned; }

    public boolean isDisabled() { return disabled; }
    public void setDisabled(boolean disabled) { this.disabled = disabled; }
}