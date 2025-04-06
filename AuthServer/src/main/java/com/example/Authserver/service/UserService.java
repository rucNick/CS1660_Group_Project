package com.example.Authserver.service;

import com.example.Authserver.entity.User;
import com.example.Authserver.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(String email, String password, String fullName) throws ExecutionException, InterruptedException {
        // Check if email is already registered
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .email(email)
                .fullName(fullName)
                .password(passwordEncoder.encode(password))
                .roleAssigned(false)
                .disabled(false)
                .build();

        return userRepository.save(user);
    }

    public User findOrCreateGoogleUser(String googleId, String email, String fullName) throws ExecutionException, InterruptedException {
        // Try to find by Google ID
        Optional<User> existingUserByGoogleId = userRepository.findByGoogleId(googleId);
        if (existingUserByGoogleId.isPresent()) {
            return existingUserByGoogleId.get();
        }

        // Try to find by email
        Optional<User> existingUserByEmail = userRepository.findByEmail(email);
        if (existingUserByEmail.isPresent()) {
            User user = existingUserByEmail.get();
            // Update Google ID if needed
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                return userRepository.save(user);
            }
            return user;
        }

        // Create new user with Google info
        User newUser = User.builder()
                .id(UUID.randomUUID().toString())
                .email(email)
                .fullName(fullName)
                .googleId(googleId)
                .roleAssigned(false)
                .disabled(false)
                .build();

        return userRepository.save(newUser);
    }

    public User assignRole(String userId, String role, String studentId) throws ExecutionException, InterruptedException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(role);
        user.setRoleAssigned(true);

        if ("student".equals(role) && studentId != null) {
            user.setStudentId(studentId);
        }

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) throws ExecutionException, InterruptedException {
        return userRepository.findByEmail(email);
    }

    public boolean verifyPassword(User user, String password) {
        return passwordEncoder.matches(password, user.getPassword());
    }
}