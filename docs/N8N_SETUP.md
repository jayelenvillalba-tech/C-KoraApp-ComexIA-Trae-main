# n8n Setup Guide

## Overview

n8n is a workflow automation tool that enables ComexIA to send notifications, automate onboarding, and handle alerts without modifying core backend logic.

## Installation

### Option 1: Docker (Recommended)

1. **Start n8n**:
```bash
docker-compose -f docker-compose.n8n.yml up -d
```

2. **Access UI**:
```
http://localhost:5678
```

3. **Login**:
- Username: `admin`
- Password: Set in `.env` as `N8N_PASSWORD`

### Option 2: npm Global Install

```bash
npm install -g n8n
n8n start
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# n8n Configuration
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_PASSWORD=your-secure-password
N8N_ENCRYPTION_KEY=your-encryption-key

# Email Configuration (choose one)
# Option A: Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Option B: SendGrid
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@comexia.com

# WhatsApp/SMS (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Gmail App Password Setup

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate password for "Mail"
5. Copy password to `.env` as `GMAIL_APP_PASSWORD`

### SendGrid Setup

1. Sign up at https://sendgrid.com
2. Create API Key (Settings → API Keys)
3. Copy to `.env` as `SENDGRID_API_KEY`
4. Verify sender email

## Backend Integration

### 1. Mount Webhook Routes

In `backend/server.ts`, add:

```typescript
import webhookRouter from './routes/webhooks';

// Webhooks (for n8n automation)
if (process.env.N8N_ENABLED === 'true') {
  app.use('/api/webhooks', webhookRouter);
}
```

### 2. Trigger Webhooks

Example in marketplace route:

```typescript
// After creating post
const newPost = await MarketplacePost.create(postData);

// Trigger n8n webhook (optional)
if (process.env.N8N_ENABLED === 'true') {
  try {
    await fetch(`${process.env.N8N_WEBHOOK_URL}/marketplace-post-created`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: newPost._id })
    });
  } catch (err) {
    console.warn('n8n webhook failed:', err);
  }
}
```

## Creating Workflows

### 1. Access n8n UI

Open http://localhost:5678

### 2. Create New Workflow

Click "New Workflow"

### 3. Add Nodes

**Example: New Post Notification**

1. **Webhook Trigger**
   - Method: POST
   - Path: `marketplace-post-created`

2. **HTTP Request** (to backend webhook)
   - Method: POST
   - URL: `http://localhost:3001/api/webhooks/marketplace-post-created`
   - Body: `{{ $json }}`

3. **MongoDB** (find interested users)
   - Operation: Find
   - Collection: `users`
   - Query: `{ "interestedHSCodes": { "$in": ["{{ $json.post.hsCode }}"] } }`

4. **IF** (check if users found)
   - Condition: `{{ $json.length > 0 }}`

5. **Gmail** (send notification)
   - To: `{{ $json.email }}`
   - Subject: `Nueva oportunidad: {{ $json.post.productName }}`
   - Body: Template with post details

### 4. Activate Workflow

Click "Active" toggle in top right

## Testing

### Test Webhook Endpoint

```bash
curl -X POST http://localhost:3001/api/webhooks/marketplace-post-created \
  -H "Content-Type: application/json" \
  -d '{"postId": "test-id"}'
```

### Test n8n Workflow

1. Go to workflow in n8n UI
2. Click "Execute Workflow"
3. Check execution log
4. Verify email received

## Troubleshooting

### n8n Not Starting

```bash
# Check Docker logs
docker logs comexia-n8n

# Restart n8n
docker-compose -f docker-compose.n8n.yml restart
```

### Webhooks Not Triggering

1. Check `N8N_ENABLED=true` in `.env`
2. Verify backend server restarted after adding routes
3. Check n8n workflow is active
4. Check network connectivity (localhost:5678)

### Emails Not Sending

1. Verify Gmail App Password or SendGrid API key
2. Check email credentials in n8n node
3. Test email node independently
4. Check spam folder

## Workflow Examples

See `n8n-workflows/` directory for:
- `new-post-notification.json`
- `user-onboarding.json`
- `critical-error-alert.json`

Import these in n8n UI: Settings → Import from File

## Security

- Change default password in `.env`
- Use HTTPS in production
- Restrict n8n access to internal network
- Use environment variables for credentials
- Enable n8n authentication

## Monitoring

### Check n8n Health

```bash
curl http://localhost:5678/healthz
```

### View Workflow Executions

n8n UI → Executions tab

### Check Logs

```bash
docker logs -f comexia-n8n
```

## Backup

### Export Workflows

n8n UI → Settings → Export

### Backup Data

```bash
# Backup n8n data directory
tar -czf n8n-backup.tar.gz n8n-data/
```

## Disable n8n

If you need to disable n8n:

1. Set `N8N_ENABLED=false` in `.env`
2. Restart backend
3. Stop n8n: `docker-compose -f docker-compose.n8n.yml down`

System will work normally without n8n.
