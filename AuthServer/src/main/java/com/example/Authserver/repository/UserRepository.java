package com.example.Authserver.repository;

import com.example.Authserver.entity.User;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class UserRepository {

    private final CollectionReference usersCollection;

    @Autowired
    public UserRepository(Firestore firestore) {
        this.usersCollection = firestore.collection("users");
    }

    public User save(User user) {
        usersCollection.document(user.getId()).set(user);
        return user;
    }

    public Optional<User> findById(String id) throws ExecutionException, InterruptedException {
        var doc = usersCollection.document(id).get().get();
        return doc.exists() ? Optional.of(doc.toObject(User.class)) : Optional.empty();
    }

    public Optional<User> findByEmail(String email) throws ExecutionException, InterruptedException {
        Query query = usersCollection.whereEqualTo("email", email);
        ApiFuture<QuerySnapshot> future = query.get();
        var docs = future.get().getDocuments();

        return docs.isEmpty() ?
                Optional.empty() :
                Optional.of(docs.get(0).toObject(User.class));
    }

    public Optional<User> findByGoogleId(String googleId) throws ExecutionException, InterruptedException {
        Query query = usersCollection.whereEqualTo("googleId", googleId);
        ApiFuture<QuerySnapshot> future = query.get();
        var docs = future.get().getDocuments();

        return docs.isEmpty() ?
                Optional.empty() :
                Optional.of(docs.get(0).toObject(User.class));
    }

    public boolean existsByEmail(String email) throws ExecutionException, InterruptedException {
        Query query = usersCollection.whereEqualTo("email", email);
        ApiFuture<QuerySnapshot> future = query.get();
        return !future.get().isEmpty();
    }
}