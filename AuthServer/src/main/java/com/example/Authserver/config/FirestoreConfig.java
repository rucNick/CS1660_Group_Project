package com.example.Authserver.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirestoreConfig {

    @Autowired
    private Environment env;

    @Bean
    public Firestore firestore() throws IOException {
        GoogleCredentials credentials;

        try {
            // First try to use the mounted credential
            File credentialsFile = new File("/app/credentials.json");
            if (credentialsFile.exists()) {
                try (FileInputStream serviceAccountStream = new FileInputStream(credentialsFile)) {
                    credentials = GoogleCredentials.fromStream(serviceAccountStream);
                }
            } else {
                // Fall back to classpath resource for local development
                Resource classPathResource = new ClassPathResource("qr-attendance-455219-6314e586df68.json");
                if (classPathResource.exists()) {
                    credentials = GoogleCredentials.fromStream(classPathResource.getInputStream());
                } else {
                    // Last resort - application default credentials
                    credentials = GoogleCredentials.getApplicationDefault();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Fallback to application default credentials
            credentials = GoogleCredentials.getApplicationDefault();
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setProjectId("qr-attendance-455219")
                .build();

        // Initialize Firebase app if not already initialized
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }

        return FirestoreClient.getFirestore();
    }
}