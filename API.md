# JawabAI API Documentation

Base URL: `http://localhost:3120`

---

## Table of Contents
1. [Health Check](#1-health-check)
2. [Authentication](#2-authentication)
   - [Signup](#21-signup)
   - [Login](#22-login)
   - [Logout](#23-logout)
   - [Get Profile](#24-get-profile)
   - [Check Email](#25-check-email)
3. [WhatsApp OAuth](#3-whatsapp-oauth)
   - [Get Auth URL](#31-get-oauth-url)
   - [Exchange Token](#32-exchange-token)
   - [List Accounts](#33-list-accounts)
   - [Disconnect Account](#34-disconnect-account)
4. [Webhook](#4-webhook)
   - [Verify Challenge](#41-verify-challenge)
   - [Receive Events](#42-receive-events)
5. [Knowledge Base](#5-knowledge-base)
   - [Upload Document](#51-upload-document)
   - [List Documents](#52-list-documents)
   - [Get Document](#53-get-document)
   - [Delete Document](#54-delete-document)

---

## 1. Health Check

Check if the server is running.

### Request

```
GET /health-check
```

### Response

```json
{
  "message": "Welcome to the whatsapp automation tool!",
  "success": true
}
```

---

## 2. Authentication

### 2.1 Signup

Register a new user account.

#### Request

```
POST /auth/signup
Content-Type: application/json
```

#### Body

```json
{
  "email": "user@example.com",
  "password": "Test@1234",
  "confirmPassword": "Test@1234",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "acceptTerms": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Min 8 chars, uppercase, lowercase, number, special char |
| `confirmPassword` | string | Yes | Must match password |
| `firstName` | string | Yes | Letters, hyphens, apostrophes only |
| `lastName` | string | Yes | Letters, hyphens, apostrophes only |
| `phone` | string | No | With country code (e.g. +1234567890) |
| `acceptTerms` | boolean | Yes | Must be `true` |

#### Response (201)

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatarUrl": null,
    "isActive": true,
    "role": "user",
    "createdAt": "2026-05-23T04:00:00.000Z",
    "updatedAt": "2026-05-23T04:00:00.000Z",
    "lastLoginAt": null,
    "loginCount": 0,
    "deletedAt": null
  }
}
```

#### Response (409 — Email exists)

```json
{
  "success": false,
  "error": "email_exists",
  "message": "A user with this email address is already registered"
}
```

---

### 2.2 Login

Login with email and password. Creates a session.

#### Request

```
POST /auth/login
Content-Type: application/json
```

#### Body

```json
{
  "email": "user@example.com",
  "password": "Test@1234"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email |
| `password` | string | Yes | Account password |

#### Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatarUrl": null,
    "isActive": true,
    "role": "user",
    "createdAt": "2026-05-23T04:00:00.000Z",
    "updatedAt": "2026-05-23T04:00:00.000Z",
    "lastLoginAt": "2026-05-23T05:00:00.000Z",
    "loginCount": 5,
    "deletedAt": null
  }
}
```

> The session cookie `whatsapp.sid` is set automatically. All subsequent authenticated requests include it.

---

### 2.3 Logout

Destroy the current session.

#### Request

```
POST /auth/logout
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2.4 Get Profile

Get the currently authenticated user's profile.

#### Request

```
GET /auth/profile
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatarUrl": null,
    "isActive": true,
    "role": "user",
    "createdAt": "2026-05-23T04:00:00.000Z",
    "updatedAt": "2026-05-23T04:00:00.000Z",
    "lastLoginAt": "2026-05-23T05:00:00.000Z",
    "loginCount": 5,
    "deletedAt": null
  }
}
```

#### Response (401 — Not authenticated)

```json
{
  "success": false,
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

### 2.5 Check Email

Check if an email is already registered. No auth required.

#### Request

```
GET /auth/check-email/user@example.com
```

#### Response (200)

```json
{
  "success": true,
  "message": "Email check completed",
  "email": "user@example.com",
  "exists": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `exists` | boolean | `true` if email is already registered |

---

## 3. WhatsApp OAuth

All endpoints require authentication.

### 3.1 Get OAuth URL

Generate the Meta OAuth URL for WhatsApp Business integration.

#### Request

```
GET /meta/auth-url
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "url": "https://www.facebook.com/v21.0/dialog/oauth?client_id=979664218339142&redirect_uri=https://jawab-ai.buymazing.in%3Fchannel%3Dwhatsapp&state=550e8400-e29b-41d4-a716-446655440000&scope=whatsapp_business_messaging,whatsapp_business_management,business_management",
  "state": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Redirect user here to authorize with Meta |
| `state` | string | UUID — must be sent back with the code in exchange-token |

**Flow:**
1. Frontend calls this endpoint
2. Redirect user to the returned `url`
3. User authorizes on Meta's site
4. Meta redirects to `WHATSAPP_CALLBACK_URL?code=X&state=Y`
5. Frontend captures `code` and `state` from the URL query params
6. Send them to `/meta/exchange-token`

---

### 3.2 Exchange Token

Exchange the authorization code for a long-lived access token.

#### Request

```
POST /meta/exchange-token
Content-Type: application/json
Cookie: whatsapp.sid=<session-id>
```

#### Body

```json
{
  "code": "AQABC123def456GHI789jklMNO012pqrSTU345vwx",
  "state": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | The code from Meta's redirect |
| `state` | string | No | Must match the state from `/meta/auth-url` if provided |

#### Response (200)

```json
{
  "success": true,
  "account": {
    "id": 1,
    "wabaId": "123456789012345",
    "businessId": "987654321098765",
    "phoneNumberId": "112233445566778",
    "isActive": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Internal account ID |
| `wabaId` | string | WhatsApp Business Account ID |
| `businessId` | string | Meta Business ID |
| `phoneNumberId` | string | WhatsApp Phone Number ID (used for sending messages) |
| `isActive` | boolean | Whether the account is active |

> The access token is encrypted (AES-256-GCM) and stored in the database. Webhook subscription is also set up automatically.

#### Response (400 — State mismatch)

```json
{
  "success": false,
  "error": "invalid_state",
  "message": "OAuth state mismatch. Please try again."
}
```

---

### 3.3 List Accounts

List all connected WhatsApp Business accounts.

#### Request

```
GET /meta/accounts
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "waba_id": "123456789012345",
      "business_id": "987654321098765",
      "phone_number_id": "112233445566778",
      "webhook_id": "wabc123def",
      "is_active": true,
      "token_expires_at": "2026-08-21T04:00:00.000Z",
      "created_at": "2026-05-23T04:00:00.000Z"
    }
  ]
}
```

> Note: `token_expires_at` and `created_at` are in snake_case (raw database fields).

---

### 3.4 Disconnect Account

Disconnect a WhatsApp Business account (soft-deactivate).

#### Request

```
DELETE /meta/accounts/1
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "message": "Account disconnected successfully"
}
```

---

## 4. Webhook

### 4.1 Verify Challenge

Meta sends a GET request to verify the webhook endpoint.

#### Request

```
GET /meta/webhook?hub.mode=subscribe&hub.challenge=123456789&hub.verify_token=jawab_ai_webhook_verify_2024
```

| Query Param | Description |
|-------------|-------------|
| `hub.mode` | Must be `subscribe` |
| `hub.challenge` | Random string Meta expects back |
| `hub.verify_token` | Must match `WEBHOOK_VERIFY_TOKEN` in `.env` |

#### Response (200)

```
123456789
```

> Returns the `hub.challenge` value as plain text. Meta will show "Verified" in the dashboard.

#### Response (403 — Invalid token)

```json
{
  "success": false,
  "error": "verification_failed",
  "message": "Webhook verification failed"
}
```

---

### 4.2 Receive Events

Meta sends POST requests for incoming messages and other events.

#### Request

```
POST /meta/webhook
Content-Type: application/json
x-hub-signature-256: sha256=<hmac-signature>
```

#### Body (Example — Incoming text message)

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789012345",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "112233445566778"
            },
            "contacts": [
              {
                "profile": {
                  "name": "John Doe"
                },
                "wa_id": "15559876543"
              }
            ],
            "messages": [
              {
                "from": "15559876543",
                "id": "wamid.ABC123DEF456=",
                "timestamp": "1716444000",
                "text": {
                  "body": "Hello! What are your business hours?"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

#### Response (200)

```json
{
  "success": true
}
```

> The server immediately returns 200, then processes the message asynchronously via BullMQ:
> 1. Generates embedding for the message text
> 2. Searches similar chunks in the knowledge base
> 3. Builds a prompt with context
> 4. Calls Grok API to generate a reply
> 5. Sends reply via WhatsApp API

---

## 5. Knowledge Base

All endpoints require authentication.

### 5.1 Upload Document

Upload a document (PDF, DOCX, TXT) to be processed into the knowledge base.

#### Request

```
POST /knowledge-base/upload
Content-Type: multipart/form-data
Cookie: whatsapp.sid=<session-id>
```

#### Form Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | PDF, DOCX, TXT, CSV, JSON, or Markdown (max 50MB) |
| `waAccountId` | number | No | Associate document with a specific WhatsApp account ID |

#### cURL Example

```bash
curl -X POST http://localhost:3120/knowledge-base/upload \
  -H "Cookie: whatsapp.sid=<session-id>" \
  -F "file=@/path/to/business-info.pdf" \
  -F "waAccountId=1"
```

#### Response (201)

```json
{
  "success": true,
  "document": {
    "id": 1,
    "originalName": "business-info.pdf",
    "status": "pending",
    "fileSize": 245760,
    "createdAt": "2026-05-23T04:00:00.000Z"
  }
}
```

> The document is processed in the background (BullMQ). Poll `GET /knowledge-base/documents/1` to see when `status` changes to `"ready"`.

| Status | Description |
|--------|-------------|
| `pending` | Waiting in queue |
| `processing` | Text extraction & embedding in progress |
| `ready` | Fully processed, searchable |
| `failed` | Processing error (check `error_message`) |

---

### 5.2 List Documents

List all uploaded documents for the authenticated user.

#### Request

```
GET /knowledge-base/documents
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "original_name": "business-info.pdf",
      "mime_type": "application/pdf",
      "file_size": 245760,
      "status": "ready",
      "chunk_count": 42,
      "error_message": null,
      "created_at": "2026-05-23T04:00:00.000Z",
      "updated_at": "2026-05-23T04:05:00.000Z"
    },
    {
      "id": 2,
      "original_name": "faq.docx",
      "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "file_size": 51200,
      "status": "pending",
      "chunk_count": 0,
      "error_message": null,
      "created_at": "2026-05-23T04:10:00.000Z",
      "updated_at": "2026-05-23T04:10:00.000Z"
    }
  ]
}
```

---

### 5.3 Get Document

Get details about a specific document.

#### Request

```
GET /knowledge-base/documents/1
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "document": {
    "id": 1,
    "original_name": "business-info.pdf",
    "mime_type": "application/pdf",
    "file_size": 245760,
    "status": "ready",
    "chunk_count": 42,
    "error_message": null,
    "created_at": "2026-05-23T04:00:00.000Z",
    "updated_at": "2026-05-23T04:05:00.000Z"
  }
}
```

---

### 5.4 Delete Document

Delete a document and all its chunks from the knowledge base.

#### Request

```
DELETE /knowledge-base/documents/1
Cookie: whatsapp.sid=<session-id>
```

#### Response (200)

```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `validation_error` | Invalid input data |
| 400 | `invalid_state` | OAuth state mismatch |
| 401 | `unauthorized` | Authentication required |
| 401 | `invalid_credentials` | Invalid email or password |
| 401 | `session_expired` | Session expired |
| 401 | `account_disabled` | Account disabled |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `user_not_found` | User not found |
| 404 | `resource_not_found` | Resource not found |
| 409 | `email_exists` | Email already registered |
| 500 | `internal_error` | Internal server error |

Validation errors include an `errors` array with field-level details:

```json
{
  "success": false,
  "error": "validation_error",
  "message": "\"email\" must be a valid email\n",
  "errors": [
    {
      "location": "body",
      "messages": ["\"email\" must be a valid email"],
      "field": "email"
    }
  ]
}
```

---

## Quick Test Script

```bash
# 1. Health check
curl http://localhost:3120/health-check

# 2. Signup
curl -X POST http://localhost:3120/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","confirmPassword":"Test@1234","firstName":"Test","lastName":"User","acceptTerms":true}' \
  -c cookies.txt

# 3. Login
curl -X POST http://localhost:3120/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}' \
  -c cookies.txt -b cookies.txt

# 4. Get profile
curl http://localhost:3120/auth/profile -b cookies.txt

# 5. Get OAuth URL
curl http://localhost:3120/meta/auth-url -b cookies.txt

# 6. List WhatsApp accounts
curl http://localhost:3120/meta/accounts -b cookies.txt

# 7. Upload document
curl -X POST http://localhost:3120/knowledge-base/upload \
  -b cookies.txt \
  -F "file=@/path/to/document.pdf"

# 8. List documents
curl http://localhost:3120/knowledge-base/documents -b cookies.txt

# 9. Webhook verification (open in browser or curl)
curl "http://localhost:3120/meta/webhook?hub.mode=subscribe&hub.challenge=123456&hub.verify_token=jawab_ai_webhook_verify_2024"
```
