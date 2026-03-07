# n8n Automation Workflows

## Overview

This guide details the 3 core automation workflows implemented for ComexIA. These workflows run on n8n and are triggered by backend webhooks.

## 📁 Workflow Files

| Workflow | File | Trigger | Action |
|----------|------|---------|--------|
| **1. New Opportunity Notification** | `n8n-workflows/1-new-post-notification.json` | Post Created | Email interested users |
| **2. User Onboarding** | `n8n-workflows/2-user-onboarding.json` | User Registered | Welcome Email + Follow-up (24h) |
| **3. Critical Alerts** | `n8n-workflows/3-critical-error-alert.json` | System Error | Admin Email Notification |

## 🚀 How to Import Workflows

1. **Open n8n UI**: http://localhost:5678
2. **Go to Workflows** page.
3. Click **Add Workflow** (top right) → **Import from File**.
4. Select the JSON files from `c:\KoraApp\ComexIA-Trae-main\n8n-workflows\`.
5. **Activate** the workflow (toggle top right switch to Green).

---

## 🛠️ Workflow Details

### 1. New Post Notification

**Goal**: Notify users when a new marketplace post matches their interested HS Codes.

**Flow**:
1. **Webhook**: Receives data from `POST /api/webhooks/marketplace-post-created`
2. **MongoDB Get**: Finds users where `interestedHSCodes` contains the new post's HS Code.
3. **IF Node**: Checks if any users were found.
4. **Email Node**: Sends notification to each found user.

**Testing**:
1. Create a User with interested HS Code "1001" (Wheat).
2. Create a Marketplace Post with HS Code "1001".
3. Check User's email inbox.

### 2. User Onboarding Sequence

**Goal**: Welcome new users and guide them through the platform.

**Flow**:
1. **Webhook**: Receives data from `POST /api/webhooks/user-registered`
2. **Wait**: Delays 5 minutes.
3. **Email 1**: Sends "Welcome to ComexIA" email.
4. **Wait**: Delays 24 hours.
5. **Email 2**: Sends "How is it going?" follow-up.

**Testing**:
1. Register a new user in Frontend.
2. Wait 5 minutes.
3. Verify Welcome email received.

### 3. Critical Error Alert

**Goal**: Alert admins immediately when a severe error occurs.

**Flow**:
1. **Webhook**: Receives data from `POST /api/webhooks/critical-error`
2. **Function**: Formats timestamp and error details.
3. **Email**: Sends high-priority email to admin.

**Testing**:
1. Trigger a test error (dev only).
2. Verify Admin email received.

---

## ⚙️ Configuration Required

Before activating, you must configure **Credentials** in n8n for:

1. **MongoDB**:
   - Connection String: Use your Atlas URI (same as `.env`)
   - Database: `test` (or your DB name)

2. **Email (SMTP)**:
   - Host: `smtp.gmail.com`
   - Port: `465` (SSL) or `587` (TLS)
   - User: `your-email@gmail.com`
   - Password: `your-app-password`

---

## ✅ Status

- [x] Workflow JSONs created
- [x] Backend Webhooks active
- [x] `N8N_ENABLED=true` in `.env`
- [ ] User to Import & Activate
