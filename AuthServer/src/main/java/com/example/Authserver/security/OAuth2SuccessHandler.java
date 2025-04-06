package com.example.Authserver.security;

import com.example.Authserver.entity.User;
import com.example.Authserver.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;

    @Autowired
    public OAuth2SuccessHandler(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();

        Map<String, Object> attributes = oAuth2User.getAttributes();

        // Extract Google user information
        String googleId = attributes.get("sub").toString();
        String email = attributes.get("email").toString();
        String name = attributes.get("name").toString();

        // Find or create user in our system
        User user;
        try {
            user = userService.findOrCreateGoogleUser(googleId, email, name);
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        // Store user ID in session
        HttpSession session = request.getSession();
        session.setAttribute("userId", user.getId());

        // Redirect based on whether role is assigned
        if (!user.isRoleAssigned()) {
            // Redirect to role selection page if role not assigned
            response.sendRedirect("/api/auth/role");
        } else {
            // Redirect to dashboard if role is already assigned
            response.sendRedirect("/dashboard");
        }
    }
}