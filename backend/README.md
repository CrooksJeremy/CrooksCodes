# Portfolio Backend

A Node.js/Express.js backend for a personal coding portfolio website with Supabase integration.

## Features

- MVC architecture (Routes, Controllers, Services)
- Supabase database integration
- Projects CRUD API
- Contact form API with validation, rate limiting, and email notifications via Resend
- Admin authentication for protected routes
- Error handling and logging
- Env-driven CORS whitelist (open in dev, locked in production)
- `trust proxy` enabled for correct client IPs behind Render / Vercel / Cloudflare

## Setup

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the values.
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard (Settings → API).
   - `ADMIN_TOKEN` — random opaque token for admin routes. Generate with:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
     Do **not** reuse the Supabase service role key here — use a fresh random string so a leaked admin token doesn't compromise the database.
   - `RESEND_API_KEY` — create at [resend.com](https://resend.com) with **Sending access** scope. Used for contact form notifications.
   - `CONTACT_EMAIL_TO` — inbox that receives contact form submissions.
   - `CONTACT_EMAIL_FROM` — display name + sender address. With Resend's test domain use `Your Name <onboarding@resend.dev>`; with a verified domain use `contact@yourdomain.ca`.
   - `CORS_ORIGIN` — leave unset in local dev. In production, set to a comma-separated list of allowed origins (e.g. `https://jeremycrooks.ca,https://www.jeremycrooks.ca`).

4. Set up Supabase tables:
   - Create a `projects` table with the following schema:
     ```sql
     CREATE TABLE projects (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       title TEXT NOT NULL,
       description TEXT,
       techStack TEXT[],
       githubLink TEXT,
       liveDemoLink TEXT,
       image TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```
   - Create a `contacts` table:
     ```sql
     CREATE TABLE contacts (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       name TEXT NOT NULL,
       email TEXT NOT NULL,
       message TEXT NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```

## Running the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will run on `http://localhost:5000` (or the port specified in `.env`)

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project (requires admin token)
- `PUT /api/projects/:id` - Update project (requires admin token)
- `DELETE /api/projects/:id` - Delete project (requires admin token)

### Contact
- `POST /api/contact` - Submit contact form (rate limited)

### Health Check
- `GET /health` - Server health check

## Authentication

Protected routes (POST, PUT, DELETE on projects) require an `Authorization` header with your admin token:

**Header format:**
```
Authorization: Bearer your_admin_token_here
```

**Example using curl:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_token_here" \
  -d '{"title": "My Project", "description": "Project description"}'
```

**Example using JavaScript/fetch:**
```javascript
fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_admin_token_here'
  },
  body: JSON.stringify({ title: 'My Project', description: 'Description' })
});
```

## Security Notes

- Use the service role key only for write operations (POST, PUT, DELETE)
- Keep the service role key secure and never expose it to the frontend
- The anon key is used for read operations
- Rate limiting is applied to the contact endpoint to prevent abuse

## Technologies Used

- Node.js
- Express.js
- Supabase (Postgres)
- Resend (transactional email)
- CORS (env-driven whitelist)
- Morgan (logging)
- Express Rate Limit
- Express Validator