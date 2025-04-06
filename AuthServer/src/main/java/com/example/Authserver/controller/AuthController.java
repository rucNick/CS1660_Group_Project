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
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Tag(name = "Auth Controller", description = "APIs for authentication and user management")
@Controller
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Display login page", description = "Returns the login view")
    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    @Operation(summary = "User login", description = "Authenticates a user with email and password",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Successful login",
                            content = @Content(schema = @Schema(implementation = User.class))),
                    @ApiResponse(responseCode = "401", description = "Invalid credentials", content = @Content)
            })
    @PostMapping("/login")
    @ResponseBody
    public ResponseEntity<?> login(@RequestParam String email, @RequestParam String password,
                                   HttpSession session) {
        try {
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
    @ResponseBody
    public ResponseEntity<?> register(@RequestParam String email, @RequestParam String password,
                                      @RequestParam String fullName) {
        try {
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

    @Operation(summary = "Display role selection page", description = "Shows the role selection view for users without an assigned role")
    @GetMapping("/role")
    public String roleSelectionPage(HttpSession session, Model model) {
        String userId = (String) session.getAttribute("userId");

        if (userId == null) {
            return "redirect:/api/auth/login";
        }

        model.addAttribute("userId", userId);
        return "role-selection";
    }

    @Operation(summary = "Assign role to user", description = "Assigns a role to the user and optionally sets a student ID for students",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Role assigned successfully",
                            content = @Content(schema = @Schema(implementation = User.class))),
                    @ApiResponse(responseCode = "500", description = "Error assigning role", content = @Content)
            })
    @PostMapping("/role")
    @ResponseBody
    public ResponseEntity<?> assignRole(@RequestParam String userId,
                                        @RequestParam String role,
                                        @RequestParam(required = false) String studentId) {
        try {
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
    public String logout(HttpServletRequest request, HttpServletResponse response) {
        // Invalidate session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // Logout from Spring Security
        SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();
        logoutHandler.logout(request, response, SecurityContextHolder.getContext().getAuthentication());

        return "redirect:/api/auth/login";
    }
}
