# Firestore Database

---

## Overview

This assignment uses **Google Cloud Firestore** as the backend database for the
Vote Web Application. Firestore is a **key-value (K/V) document store** that provides
a scalable, serverless NoSQL database solution. It is used to manage both **GCP
Identity Platform session information** and the **vote collection** that our
**GCP Cloud Run** service will read from.

---

## **__Your jobs is to implement the following:__**

### Step 1: Create a Firestore database in your project
Create a Firestore database in your project
- make sure that your database is in the same **project** and **region**
- [getting started](https://firebase.google.com/docs/firestore/quickstart)

### Firestore Collections
Firestore stores data in collections, where each document has a unique ID and
is structured as a key-value store. The following collections are used in this
application:

1. **`votes` Collection**
   - Stores votes submitted by users.
   - Read by the **GCP Cloud Run** service to process and display results.
   - Updated by the **GCP Cloud Run** service to create vote results
   - Example document structure:
     ```json
     {
       team: "SPACES" (string)
       time_cast: "2025-02-27T00:58:46.948961" (string)
     }
     ```
---

## Firestore Behavior
- Firestore is a **serverless, horizontally scalable** NoSQL database optimized
  for real-time applications.
- It supports **strong consistency** and **automatic indexing** for fast query
  performance.
- Documents can be read individually or queried in batches using Firestore’s
  query system.
- Firestore natively integrates with **Google Identity Platform**, **Cloud
  Run**, and **other GCP services**.

---

## Cloud Run Integration
The Vote Web Application backend runs as a **Cloud Run service**, which:
- Reads from Firestore to fetch vote data.
- Ensures authenticated requests by verifying **GCP Identity Platform
  sessions**.
- Provides an API for submitting and retrieving votes.

---

## Questions & Additional Resources
If you have any questions about Firestore's behavior, please refer to the
**slides** provided in the course materials. For additional documentation,

