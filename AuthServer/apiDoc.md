# QR Attendance System - Auth Server API Documentation

This document provides details on all available API endpoints for the Auth Server component of the QR Attendance System.

## Base URL

All endpoints are relative to: `http://localhost:8080`

## Authentication Endpoints

### Check Authentication Status

Verifies if the user is currently authenticated.

- **URL**: `/api/auth/status`
- **Method**: `GET`
- **Response**:
  - `200 OK`: Authentication status returned
  ```json
  {
    "authenticated": true,
    "userId": "......",
    "email": "user@user.com",
    "fullName": "abc",
    "role": "student",
    "roleAssigned": true
  }
  ```
  - `401 Unauthorized`: Not authenticated
  ```json
  {
    "authenticated": false
  }
  ```

### Login

Authenticates a user with email and password.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  - `200 OK`: Login successful
  ```json
  {
    "userId": "e3e7e039-79e4-4611-b422-5546614d929e",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "student"
  }
  ```
  - `200 OK`: Login successful but role not assigned
  ```json
  {
    "userId": "e3e7e039-79e4-4611-b422-5546614d929e",
    "email": "user@example.com",
    "fullName": "John Doe",
    "needsRoleAssignment": true
  }
  ```
  - `401 Unauthorized`: Invalid credentials
  ```json
  {
    "error": "Invalid credentials"
  }
  ```

### Register

Registers a new user.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "password123",
    "fullName": "New User"
  }
  ```
- **Response**:
  - `201 Created`: Registration successful
  ```json
  {
    "userId": "f5e8c739-92a1-4822-c533-6657725e930f",
    "email": "newuser@example.com",
    "fullName": "New User",
    "needsRoleAssignment": true
  }
  ```
  - `409 Conflict`: Email already registered
  ```json
  {
    "error": "Email already registered"
  }
  ```

### Assign Role

Assigns a role to a user.

- **URL**: `/api/auth/role`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "userId": "e3e7e039-79e4-4611-b422-5546614d929e",
    "role": "student",
    "studentId": "12345" 
  }
  ```
- **Response**:
  - `200 OK`: Role assigned successfully
  ```json
  {
    "userId": "e3e7e039-79e4-4611-b422-5546614d929e",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "student"
  }
  ```
  - `400 Bad Request`: Missing required fields
  ```json
  {
    "error": "UserId and role are required"
  }
  ```

### Logout

Logs out the current user.

- **URL**: `/api/auth/logout`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
  - `200 OK`: Logout successful
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### OAuth2 Login with Google

Initiates OAuth2 authentication with Google.

- **URL**: `/oauth2/authorization/google`
- **Method**: `GET`
- **Response**: Redirects to Google authentication page
