# CampusReady — Online Internship & Placement Preparation Portal

**Course:** UE24CS341A — Software Engineering, Level 3 Mini-Project
**Team 12**

## Team

| Name | USN | Module Owned |
|---|---|---|
| Sejal Siddapuram | PES1UG24CS426 | Account & Profile Management |
| Sampath D Naik | PES1UG24CS416 | Listings & Applications |
| Sagar A Walikar | PES1UG24CS396 | Recruiter Portal |
| Saiesh Shankar | PES1UG24CS401 | Admin & Preparation |

## About

CampusReady is a web portal that brings internship/placement discovery, application tracking, recruiter management, and placement preparation into one place, replacing the current mix of noticeboards, generic job portals, and word-of-mouth.

## Tech Stack

MongoDB, Express.js, React.js, Node.js (MERN)

## Documents

- `Team12_Synopsis.pdf` — Synopsis / project proposal
- `Team12_SRS.pdf` — Software Requirements Specification
- `Team12_SRS_SAD_TestPlan.pdf` — SRS, Software Architecture & Design, and Software Test Plan

---

## Running the project locally

**Requirements:** [Node.js](https://nodejs.org) 18 or newer (LTS recommended). Nothing else needs to be installed —
if no MongoDB address is configured, the server starts a local MongoDB automatically and keeps its data in `server/.data`.

```bash
# 1. Install everything (first time only - the first run also downloads MongoDB, which can take a few minutes)
npm run setup

# 2. Start the API (http://localhost:5000) and the website (http://localhost:5173) together
npm run dev
```

Then open **http://localhost:5173** in the browser.

**Default TPO/Admin login** (created automatically on first start):
`admin@campusready.edu` / `Admin@1234`

To use MongoDB Atlas or another database instead, copy `server/.env.example` to `server/.env` and set `MONGO_URI`.

## Project structure

The structure follows the layered MVC design in the SAD (Section 3.5 and 4.1).

```
server/src/
  config/        environment settings and database connection
  middleware/    auth (JWT), RBAC, validation, rate limiting, error handler
  models/        Mongoose schemas (SRS Section 14)
  services/      business rules - one service per module
  controllers/   HTTP request/response handling
  routes/        REST API endpoints (SAD Section 4.3)
  utils/         shared helpers
client/src/
  pages/         one page per screen, grouped by module
  components/    shared UI components (navbar, form fields, badges, alerts)
  services/      API calls - one file per module
  context/       logged-in user state
  config/        navigation links
  styles/        shared stylesheet (one design language)
```

## API conventions

- Base path `/api`, JSON request and response bodies
- Protected routes need the header `Authorization: Bearer <token>`
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code", "message", "details" } }`
- Health check: `GET /api/health`
