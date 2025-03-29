# Deploying a Python Web Server on GCP Cloud Run

## Overview
In this assignment, you will deploy your Python web server on **Google Cloud Run**, a serverless platform that allows you to run containerized applications. You will containerize your application, push it to **Google Artifact Registry**, create a **service account**, and deploy it to **Cloud Run**.

## Docs
- [gcloud builds submit](https://cloud.google.com/sdk/gcloud/reference/builds/submit)
- [gcloud run deploy](https://cloud.google.com/sdk/gcloud/reference/run/deploy)

## Prerequisites
Before you begin, ensure that you have:
- A **Google Cloud Platform (GCP)** account
- The **gcloud CLI** installed and configured
- A **Google Artifact Registry** repository set up in the `us-central1` region

## **__Your jobs is to implement the following:__**

### Step 1: Build and Push Your Docker Image
You need to build your Docker image and push it to **Google Artifact Registry**. Run the following command:

```bash
 gcloud builds submit --region [REGION] --tag [REGION]-docker.pkg.dev/[PROJECT NAME]/tabs-vs-spaces/app:v1
```

#### Explanation:
- `gcloud builds submit` - Submits your source code for building an image.
- `--region [REGION]` - Specifies the region where the build takes place.
- `--tag` - Defines the destination for the built image in **Artifact Registry**.

### Step 2: Create a Service Account
Cloud Run services should use a **service account** for authentication. Create one with the following command:

```bash
gcloud iam service-accounts create tabs-vs-spaces \
  --display-name "tabs-vs-spaces"
```

you can list the service accounts with the following command:

```bash
 gcloud iam service-accounts list
```

### Step 3: Grant Permissions
We are deploying a service that needs to access **Google Firestore**. To allow the Cloud Run service access we need to attach the **roles/datastore.owner** role to the service account:

```bash
gcloud projects add-iam-policy-binding [PROJECT ID] \
  --member=serviceAccount:tabs-vs-spaces@[PROJECT ID].iam.gserviceaccount.com \
  --role=roles/datastore.owner
```

#### Explanation:
- `gcloud projects add-iam-policy-binding` - Modifies IAM permissions for the project.
- `--member` - Specifies the service account.
- `--role` - Assigns the **Datastore Owner** role, allowing access to Google Datastore.

### Step 4: Deploy Your Cloud Run Service
Now, deploy your container to Cloud Run:

```bash
gcloud run deploy tabs-vs-spaces \
  --allow-unauthenticated \
  --image [REGION]-docker.pkg.dev/[PROJECT ID]/tabs-vs-spaces/[app name]:[tag] \
  --service-account tabs-vs-spaces@[PROJECT ID].iam.gserviceaccount.com \
  --region [REGION] \
  --port 8000
```

#### Explanation:
- `gcloud run deploy tabs-vs-spaces` - Deploys the Cloud Run service named **tabs-vs-spaces**.
- `--allow-unauthenticated` - Makes the service publicly accessible.
- `--image` - Specifies the container image to deploy from **Artifact Registry**.
- `--service-account` - Associates the **Cloud Run service** with the previously created **service account**.
- `--region us-central1` - Deploys the service in the **us-central1** region.
- `--port 8000` - Exposes the application on port **8000**.

### Additional Tasks
- Monitor your deployment via **Cloud Run Dashboard** in GCP.
- Check logs using:
  ```bash
  gcloud run services logs read tabs-vs-spaces --region [REGION]
  ```