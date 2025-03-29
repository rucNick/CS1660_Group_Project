# Python Web Server

---
## Overview
This document provides guidance on the Python FastAPI backend for the project. The backend serves HTML pages, processes form submissions, and interacts with Firestore to store and retrieve votes. The FastAPI server is designed to be deployed on **Google Cloud Run** and supports authentication via **Google Identity Platform**.

---

## **__Your jobs is to implement the following:__**

### Step 1: GET/POST functions in the [FastAPI backend](../cc_cloud_run/main.py) file
- The GET function should return the index.html template with request, tabs/spaces count, and recent votes.
- The POST function should handle form submissions from the client-side javascript and store votes in Firestore.

#### Firestore Database Access
Firestore is used as the datastore for the application. The FastAPI backend connects to Firestore to store and retrieve votes. The Firestore client **is already initialized** as follows:

```python
from google.cloud import firestore

db = firestore.Client()
votes_collection = db.collection("votes")
```

#### FastAPI Endpoints

`GET /` Returns the main page with the count of votes for "TABS" and "SPACES".

```python
# init firestore client
db = firestore.Client()
votes_collection = db.collection("votes")
...

# get all votes from firestore collection
votes = votes_collection.stream()
# @note: we are storing the votes in `vote_data` list because the firestore stream closes after certain period of time
vote_data = []
for v in votes:
    vote_data.append(v.to_dict())
```
Hydrate the index.html tempalte with the `request`, `tabs_count`, `spaces_count`, and `recent_votes`. `recent_votes` is a list of votes from the firestore collection.

```python
@app.get("/")
async def read_root(request: Request):
    ...    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "tabs_count": tabs_count,
        "spaces_count": spaces_count,
        "recent_votes": vote_data
    })
```

`POST /` Handles form submissions from the frontend to record votes in Firestore collection.

```python
votes_collection.add({
    "team": team,
    "time_cast": datetime.datetime.utcnow().isoformat()
})
```
Each vote is stored as a document in the `votes` collection, containing the following fields:
- `team`: Either "TABS" or "SPACES"
- `time_cast`: Timestamp in ISO format
```python
# use the datetime module to get the current time in ISO format
datetime.datetime.utcnow().isoformat()
```
---

## Running Locally
Since Firestore is being emulated locally, ensure that the FastAPI service is correctly configured to connect to the emulator. The environment variable `FIRESTORE_EMULATOR_HOST=db:8080` is set in `docker-compose.yml`.

To run the FastAPI server locally:
```sh
docker compose up --build
```

Access the application at: [http://localhost:9080](http://localhost:9080), you can disable authentication by adding `?auth=false` to the query parameters.
