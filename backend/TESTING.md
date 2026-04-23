# Manual Testing Guide for Portfolio Backend

This guide explains how to manually test all API endpoints and functions created in the portfolio backend. You'll use `curl` commands to test the server locally.

## Prerequisites

1. **Start the server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

2. **Have a tool ready:** Use `curl` (command line) or Postman/Insomnia (GUI)

3. **Admin token:** Generate a secure token and add it to `.env`:
   ```env
   ADMIN_TOKEN=your_super_secure_token_here_at_least_32_chars_long
   ```

---

## 1. Health Check Endpoint

**Purpose:** Verify server is running and responding

**Endpoint:** `GET /health`

**Test Command:**
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

**Success:** ✅ Server is running properly

---

## 2. Get All Projects

**Purpose:** Fetch all projects from database (public endpoint)

**Endpoint:** `GET /api/projects`

**Test Command:**
```bash
curl http://localhost:5000/api/projects
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "title": "Project Title",
      "description": "Project description",
      "techStack": ["Node.js", "Express"],
      "githubLink": "https://github.com/...",
      "liveDemoLink": "https://...",
      "image": "image-url",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Success:** ✅ Projects display correctly or empty array `[]` if no projects exist

---

## 3. Get Single Project

**Purpose:** Fetch a specific project by ID

**Endpoint:** `GET /api/projects/:id`

**Test Command:**
```bash
curl http://localhost:5000/api/projects/uuid-of-project-here
```

**Expected Response (if project exists):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Project Title",
    ...
  }
}
```

**Error Response (if project doesn't exist):**
```json
{
  "success": false,
  "message": "Project not found"
}
```

**Success:** ✅ Returns project data or 404 error

---

## 4. Create Project (Protected Route)

**Purpose:** Add a new project (requires admin token)

**Endpoint:** `POST /api/projects`

**Requirements:**
- `Authorization: Bearer <ADMIN_TOKEN>` header
- JSON body with project data

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_token_here" \
  -d '{
    "title": "My Awesome Project",
    "description": "This is a test project",
    "techStack": ["React", "Node.js", "MongoDB"],
    "githubLink": "https://github.com/yourname/project",
    "liveDemoLink": "https://project.com",
    "image": "https://example.com/image.jpg"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "newly-created-uuid",
    "title": "My Awesome Project",
    ...
  }
}
```

**Error Response (No Token):**
```json
{
  "success": false,
  "message": "Unauthorized: Invalid or missing admin token"
}
```

**Error Response (Invalid Data):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Success:** ✅ Project created with ID returned, or validation error shown

### Test Variations:

**Missing admin token:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title": "Project"}'
```
Expected: `401 Unauthorized`

**Wrong admin token:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong_token" \
  -d '{"title": "Project"}'
```
Expected: `401 Unauthorized`

**Missing required fields:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_token_here" \
  -d '{"description": "No title provided"}'
```
Expected: `400 Bad Request` with validation errors

---

## 5. Update Project (Protected Route)

**Purpose:** Modify an existing project (requires admin token)

**Endpoint:** `PUT /api/projects/:id`

**Test Command:**
```bash
curl -X PUT http://localhost:5000/api/projects/uuid-of-project-here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_token_here" \
  -d '{
    "title": "Updated Project Title",
    "description": "Updated description",
    "techStack": ["Python", "Django"]
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "project-uuid",
    "title": "Updated Project Title",
    ...
  }
}
```

**Error Response (Project not found):**
```json
{
  "success": false,
  "message": "Project not found"
}
```

**Success:** ✅ Project updated or 404 if project doesn't exist

### Test Variations:

**Update only specific fields:**
```bash
curl -X PUT http://localhost:5000/api/projects/uuid-here \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_token_here" \
  -d '{"title": "New Title"}'
```

**Without admin token:**
```bash
curl -X PUT http://localhost:5000/api/projects/uuid-here \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title"}'
```
Expected: `401 Unauthorized`

---

## 6. Delete Project (Protected Route)

**Purpose:** Remove a project from database (requires admin token)

**Endpoint:** `DELETE /api/projects/:id`

**Test Command:**
```bash
curl -X DELETE http://localhost:5000/api/projects/uuid-of-project-here \
  -H "Authorization: Bearer your_admin_token_here"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Response (Project not found):**
```json
{
  "success": false,
  "message": "Project not found"
}
```

**Success:** ✅ Project deleted or 404 if doesn't exist

### Test Variations:

**Without admin token:**
```bash
curl -X DELETE http://localhost:5000/api/projects/uuid-here
```
Expected: `401 Unauthorized`

**With wrong token:**
```bash
curl -X DELETE http://localhost:5000/api/projects/uuid-here \
  -H "Authorization: Bearer wrong_token"
```
Expected: `401 Unauthorized`

---

## 7. Submit Contact Form

**Purpose:** Submit a contact message (rate limited to prevent spam)

**Endpoint:** `POST /api/contact`

**Rate Limit:** 5 requests per 15 minutes per IP address

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I would like to hire you for a project!"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "id": "contact-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I would like to hire you for a project!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (Missing fields):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

**Error Response (Rate Limited):**
```json
{
  "success": false,
  "message": "Too many contact form submissions. Please try again later."
}
```

**Success:** ✅ Contact saved to database or validation error shown

### Test Variations:

**Invalid email:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "not-an-email",
    "message": "Test"
  }'
```
Expected: `400 Bad Request` with email validation error

**Missing message:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@example.com"
  }'
```
Expected: `400 Bad Request` with message validation error

**Test rate limiting (submit 6 times in a row):**
```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"User","email":"test@example.com","message":"Test"}'
  echo "\nRequest $i"
done
```
Expected: First 5 succeed, 6th gets rate limit error

---

## 8. Error Handling Tests

**Purpose:** Verify error handling works correctly

### Invalid Route:
```bash
curl http://localhost:5000/api/invalid-route
```
Expected Response:
```json
{
  "success": false,
  "message": "Route not found"
}
```

### Server Error (intentional):
Try creating a project with invalid data types
Expected Response:
```json
{
  "success": false,
  "message": "Server error occurred"
}
```

---

## 9. Authentication Tests

**Purpose:** Verify admin token authentication works

### Missing Authorization Header:
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
```
Expected: `401 Unauthorized`

### Malformed Authorization Header:
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: InvalidFormat token" \
  -d '{"title": "Test"}'
```
Expected: `401 Unauthorized`

### Valid Token:
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_token_here" \
  -d '{"title": "Test"}'
```
Expected: `200 OK` with project created

---

## 10. Logging Test

**Purpose:** Verify logs are generated (check terminal output)

**What to look for:**
- Each request logs to console with method, URL, status, and response time
- Example: `GET /api/projects 200 5.234 ms`

**Test:**
```bash
curl http://localhost:5000/api/projects
```

**Check terminal output** for log entry showing the request was recorded

---

## Quick Test Checklist

Use this checklist to verify all functions work:

- [ ] Health check responds
- [ ] GET /api/projects returns list (empty or with data)
- [ ] GET /api/projects/:id returns single project or 404
- [ ] POST /api/projects creates project (with token)
- [ ] POST /api/projects fails without token (401)
- [ ] PUT /api/projects/:id updates project (with token)
- [ ] PUT /api/projects/:id fails without token (401)
- [ ] DELETE /api/projects/:id removes project (with token)
- [ ] DELETE /api/projects/:id fails without token (401)
- [ ] POST /api/contact submits form with validation
- [ ] POST /api/contact rate limits after 5 requests
- [ ] Invalid route returns 404
- [ ] Server logs all requests
- [ ] Admin token validation works correctly

---

## Useful curl Options

```bash
# Pretty print JSON response
curl -s http://localhost:5000/api/projects | jq

# Show response headers
curl -i http://localhost:5000/api/projects

# Show full request/response
curl -v http://localhost:5000/api/projects

# Save response to file
curl http://localhost:5000/api/projects > response.json

# Send file as body
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d @payload.json
```

---

## Troubleshooting

**Connection refused?**
- Make sure server is running: `npm run dev`
- Check port 5000 is available

**401 Unauthorized on protected routes?**
- Verify `ADMIN_TOKEN` is set in `.env`
- Check token matches exactly (including spacing)
- Ensure header format is `Authorization: Bearer token`

**Validation errors?**
- Check all required fields are provided
- Verify email format for contact form
- Ensure tech stack is an array if provided

**Rate limit error on contact?**
- Wait 15 minutes or restart server
- Rate limit is per IP address
- Test from different terminal to simulate different IP

---

## Next Steps

Once all tests pass:
1. Deploy backend to production server
2. Update frontend to use live API URLs
3. Monitor logs for any issues
4. Set up error tracking (e.g., Sentry)
5. Implement additional features based on needs
