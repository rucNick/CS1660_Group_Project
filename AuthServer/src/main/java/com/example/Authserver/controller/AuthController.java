package com.example.Authserver.controller;

import com.example.Authserver.entity.User;
import com.example.Authserver.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Tag(name = "Auth Controller", description = "APIs for authentication and user management")
@RestController // Changed to RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*") // Added CORS config
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get login info", description = "Returns information for the login page")
    @GetMapping("/login")
    public ResponseEntity<?> loginPage() {
        // Return an empty success response when frontend requests login page info
        return ResponseEntity.ok(Map.of("message", "Login endpoint ready"));
    }

    @Operation(summary = "User login", description = "Authenticates a user with email and password",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Successful login",
                            content = @Content(schema = @Schema(implementation = User.class))),
                    @ApiResponse(responseCode = "401", description = "Invalid credentials", content = @Content)
            })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials,
                                   HttpSession session) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");

            if (email == null || password == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email and password are required"));
            }

            Optional<User> userOpt = userService.findByEmail(email);

            if (userOpt.isEmpty() || !userService.verifyPassword(userOpt.get(), password)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }

            User user = userOpt.get();

            // Store user ID in session
            session.setAttribute("userId", user.getId());

            // If role is not assigned, return indication to redirect to role selection
            if (!user.isRoleAssigned()) {
                return ResponseEntity.ok(Map.of(
                        "userId", user.getId(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "needsRoleAssignment", true
                ));
            }

            // Normal successful login
            return ResponseEntity.ok(Map.of(
                    "userId", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "role", user.getRole()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error during authentication: " + e.getMessage()));
        }
    }

    @Operation(summary = "User registration", description = "Registers a new user with email, password, and full name",
            responses = {
                    @ApiResponse(responseCode = "201", description = "User created successfully",
                            content = @Content(schema = @Schema(implementation = User.class))),
                    @ApiResponse(responseCode = "409", description = "Email already registered", content = @Content)
            })
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> userData) {
        try {
            String email = userData.get("email");
            String password = userData.get("password");
            String fullName = userData.get("fullName");

            if (email == null || password == null || fullName == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email, password and fullName are required"));
            }

            Optional<User> existingUser = userService.findByEmail(email);

            if (existingUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Email already registered"));
            }

            User user = userService.registerUser(email, password, fullName);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "userId", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "needsRoleAssignment", true
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error during registration: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get role selection info", description = "Returns information for role selection")
    @GetMapping("/role")
    public ResponseEntity<?> roleSelectionPage(HttpSession session) {
        String userId = (String) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated", "redirect", "/api/auth/login"));
        }

        return ResponseEntity.ok(Map.of("userId", userId));
    }

    @Operation(summary = "Assign role to user", description = "Assigns a role to the user and optionally sets a student ID for students",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Role assigned successfully",
                            content = @Content(schema = @Schema(implementation = User.class))),
                    @ApiResponse(responseCode = "500", description = "Error assigning role", content = @Content)
            })
    @PostMapping("/role")
    public ResponseEntity<?> assignRole(@RequestBody Map<String, String> roleData) {
        try {
            String userId = roleData.get("userId");
            String role = roleData.get("role");
            String studentId = roleData.get("studentId");

            if (userId == null || role == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "UserId and role are required"));
            }

            User user = userService.assignRole(userId, role, studentId);

            return ResponseEntity.ok(Map.of(
                    "userId", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "role", user.getRole()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error assigning role: " + e.getMessage()));
        }
    }

    @Operation(summary = "User logout", description = "Logs out the current user and invalidates the session")
    @GetMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // Invalidate session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // Logout from Spring Security
        SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();
        logoutHandler.logout(request, response, SecurityContextHolder.getContext().getAuthentication());

        return ResponseEntity.ok(Map.of("message", "Successfully logged out"));
    }

    @Operation(summary = "Check authentication status", description = "Checks if the user is currently authenticated")
    @GetMapping("/status")
    public ResponseEntity<?> authStatus(HttpSession session) {
        String userId = (String) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("authenticated", false));
        }

        try {
            Optional<User> userOpt = userService.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return ResponseEntity.ok(Map.of(
                        "authenticated", true,
                        "userId", user.getId(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "role", user.getRole(),
                        "roleAssigned", user.isRoleAssigned()
                ));
            } else {
                // Invalid user ID in session
                session.invalidate();
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("authenticated", false, "error", "Invalid user session"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error checking authentication status: " + e.getMessage()));
        }
    }
}