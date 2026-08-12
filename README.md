# AI Ticketing Desk - Enterprise Operations & Support Platform

An intelligent, full-stack ticketing and IT operations management platform powered by Google Gemini AI. This system optimizes triage, automates user responses, and accelerates workforce allocation through AI-driven insights.

## System Architecture

```text
+-----------------------+         +----------------------------+
|     Client (React)    |         |        Node.js Server      |
|-----------------------|         |----------------------------|
| - User Dashboard      | <=====> | - Express REST API         |
| - Agent Workspace     |   JSON  | - In-Memory State/Storage  |
| - Admin Insights      |         | - Auth Middleware          |
| - Recharts Analytics  |         +-------------+--------------+
+-----------------------+                       |
                                                | HTTP Requests
                                                v
                                  +----------------------------+
                                  |      External Services     |
                                  |----------------------------|
                                  | - Google Gemini API        |
                                  | - Groq/OpenAI Fallbacks    |
                                  | - Nodemailer (SMTP Email)  |
                                  +----------------------------+
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion (Animations), Recharts (Analytics), Lucide-React (Icons)
- **Backend:** Node.js, Express, TypeScript, Vite Middleware (Dev)
- **AI/LLM Integration:** `@google/genai` (Gemini API), OpenAI SDK (fallback for Groq/OpenAI)
- **Build System:** Vite & esbuild (bundling backend to `dist/server.cjs`)

## Setup & Local Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   **Required Keys:**
   - `GEMINI_API_KEY`: Required for core AI features (categorization, draft generation, analytics).
   
   **Optional Keys:**
   - `SMTP_*`: Configure for real email notifications.
   - `GROQ_API_KEY` / `OPENAI_API_KEY`: Used as fallbacks.

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The server will run on port `3000` (or `PORT` environment variable). Open `http://localhost:3000` in your browser.*

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

## API Reference

All requests expect and return JSON payloads. Protected routes require a valid Bearer token in the `Authorization` header (`Authorization: Bearer <token>`).

### Auth
- **POST `/api/auth/register`**: Register a new user (`name`, `email`, `password`, `role`).
- **POST `/api/auth/login`**: Authenticate (`email`, `password`) and receive a JWT token.

### Tickets
- **GET `/api/tickets`**: Fetch all tickets. (Users see their own; Agents/Admins see all).
- **POST `/api/tickets`**: Create a new ticket (`title`, `description`). Automatically generates an AI draft response and assigns a category/urgency.
- **PUT `/api/tickets/:id`**: Update ticket details, routing metadata, or push new chat messages.
- **POST `/api/generate-response`**: Generate a drafted response based on tone and ticket content.
- **POST `/api/generate-insights`**: (Admin) Generate weekly performance analytics and automated strategic reports.

## AI & Prompt Engineering Pipeline

1. **Ticket Triage (Classification):** 
   When a user submits a ticket, the description is piped to the LLM (Gemini 2.5 Flash) requesting a structured JSON schema response containing the `category`, `urgency`, `confidence`, and `tags`.
2. **Draft Auto-Responder:**
   The backend auto-generates a first-pass response based on the categorized data. It explicitly pulls the user's name and ticket ID, instructing the AI not to ask for a phone number or use placeholders.
3. **Agent Conversational Assist:**
   Inside the Agent Workspace, operators can generate responses with a specific tone (Formal, Friendly, Urgent). The prompt passes the conversation history and enforces constraints.
4. **Insights Dashboard:**
   A high-level business intelligence prompt evaluates raw JSON analytics data and outputs a markdown-formatted executive summary for management.
