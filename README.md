# Multi-Agent AI Customer Support System

Multi-agent suport system built with monorepo architecture.

---

# Tech Stack
- **Frontend**: Vite + React
- **Backend**: Hono + Nodejs
- **Database**: PostgreSQL (Neon), Prisma
- **AI**: Vercel AI SDK (Groq)

## AI Agents
- Agent‑based routing:
  - **Order agent**
  - **Billing agent**
  - **Support agent**

---

# Features

## Chat‑Based Support

Users can ask natural language questions such as:

* “Where is my order?”
* “Show my invoices.”
* “Do I have refunds pending?”

System flow:

1. Frontend sends message to `/api/chat`.
2. Backend determines **conversation + agent type**.
3. Correct **agent** is selected.
4. Recent **conversation history** is injected for context.
5. AI response is **streamed in real time** to the UI.
6. Messages are **persisted in the database**.

---

# Getting Started

## 1. Install dependencies

```bash
pnpm install
```

## 2. Configure environment variables

Create `.env` in `apps/api`:

```env
DATABASE_URL=postgres_connection_string
GROQ_API_KEY=groq_api_key
```

---

## 3. Run database setup

```bash
pnpm --filter @repo/db migrate
pnpm --filter @repo/db seed
```

---

## 4. Start development servers

### Backend

```bash
pnpm --filter api dev
```

### Frontend

```bash
pnpm --filter web dev
```

Frontend:

```
http://localhost:5173
```

Backend:

```
http://localhost:3000
```

---

# Production Usage

### Build

```bash
pnpm --filter api build
```

### Start production server

```bash
pnpm --filter api start
```