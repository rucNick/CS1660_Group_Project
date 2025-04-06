package com.example.Authserver.controller;

import com.example.Authserver.entity.User;
import com.example.Authserver.service.UserService;
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

@Controller
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

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

    @GetMapping("/role")
    public String roleSelectionPage(HttpSession session, Model model) {
        String userId = (String) session.getAttribute("userId");

        if (userId == null) {
            return "redirect:/api/auth/login";
        }

        model.addAttribute("userId", userId);
        return "role-selection";
    }

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