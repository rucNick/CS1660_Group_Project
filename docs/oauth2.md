# Setting Up OAuth2 with GCP Identity Platform

---

## Overview
This guide outlines how to set up **Google Cloud Identity Platform** in conjunction with **Firebase/OAuth2** to authenticate users in your application. You will enable the Identity Platform API, configure your project, create OAuth credentials, and integrate the Identity Platform with Google as a provider.

The **Vote App** leverages **Google Cloud Identity Platform** for user authentication, enabling **login** and **logout** functionalities. Users can sign in using their Google accounts, and authentication is managed via OAuth2. The app ensures secure authentication and session management while maintaining a seamless user experience.

---

## Prerequisites
Before starting, ensure that you have:
- A **Google Cloud Platform (GCP)** account
- Access to the **Google Cloud Console**
- The **gcloud CLI** installed and authenticated

---

## Step 1: Enable Identity Platform API
The Identity Platform requires manual setup in the **Google Cloud Console**.

1. In the Google Cloud Console, enable the **Identity Platform API**:
   
   [Enable the API](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com)

## Step 2: Configure Your Project
1. Open the **Google Auth Platform** overview page:
   
   [Go to Overview](https://console.cloud.google.com/security/identity)
   
2. Click **Get Started** and follow the project configuration setup.
3. In the **App Information** dialog:
   - Enter your **application name**.
   - Select a **user support email** from the provided options.
4. In the **Audience** dialog, select **External**.
5. In the **Contact Information** dialog, enter a **contact email**.
6. Agree to the **User Data Policy**, then click **Create**.

## Step 3: Create OAuth Credentials
To enable OAuth authentication, create a **Client ID and Secret**:

1. In the **Google Cloud Console**, go to **APIs & Services > Credentials**:
   
   [Go to Credentials](https://console.cloud.google.com/apis/credentials)
   
2. Click **Create Credentials** and select **OAuth Client ID**.
3. Under **Application Type**, select **Web Application** and enter a name.
4. Click **Create**.
5. Copy the **client_id** and **client_secret** values for later use.

## Step 4: Configure Google as an Identity Provider
To allow authentication via Google, configure it as a provider:

1. In the **Google Cloud Console**, go to the **Identity Providers** page:
   
   [Go to Identity Providers](https://console.cloud.google.com/customer-identity/providers)
   
2. Click **Add A Provider**.
3. Select **Google** from the list.
4. In the **Web SDK Configuration** settings, enter the **client_id** and **client_secret** from the previous step.
5. Under **Configure your application**, click **Setup Details**.

## Step 5: Copy Configuration to Your Application
1. Copy the **apiKey** and **authDomain** values.
2. Paste these values into your application's `static/config.js` to initialize the **Identity Platform Client SDK**.
```typescript
const config = {
  apiKey: 'AIzaSyDhwsk8Ak...',
  authDomain: '[PROJECT].firebaseapp.com',
};
```
