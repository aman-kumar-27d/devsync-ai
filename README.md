<div align="center">

# 🚀 DevSync AI *(DevCollab AI)*

### *Real-time Developer Collaboration — Supercharged by AI*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black?logo=socket.io&logoColor=white)](https://socket.io)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A full-stack developer chat platform featuring real-time messaging, workspace management, and a powerful built-in AI assistant powered by **Google Gemini** — purpose-built for engineering teams.

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **Real-time Chat** | Instant messaging in workspace channels with Socket.io |
| 📨 **Direct Messages** | One-on-one private DMs between team members |
| 🤖 **AI Assistant** | 6 AI modes powered by Google Gemini (Flash & Pro) |
| 🧩 **Code Snippets** | Save, share, and get AI explanations for code blocks |
| 👨‍💻 **Monaco Editor** | Full-featured VS Code-style code editor in-browser |
| 📁 **File Uploads** | Share files directly within conversations |
| 🔔 **Notifications** | Real-time in-app notifications for mentions & activity |
| 🔍 **Search** | Full-text search across messages and channels |
| 💡 **Message Threading** | Reply in threads to keep conversations organized |
| 😄 **Emoji Reactions** | React to messages with emoji responses |
| 🌙 **Dark / Light Theme** | Seamless theme switching with `next-themes` |
| 🔐 **JWT Auth** | Secure cookie-based JWT authentication with bcrypt |
| 🏢 **Workspaces** | Create or join multiple team workspaces via invite tokens |

---

## 🤖 AI Modes

The built-in AI panel supports **6 specialized modes** — all powered by Gemini:

| Mode | Icon | What it does |
|------|------|-------------|
| **Chat** | 💬 | General developer Q&A and technical guidance |
| **Code Generation** | ⚡ | Generate production-ready code from a description |
| **Bug Fix** | 🐛 | Paste buggy code and get a root-cause analysis + fix |
| **Explain** | 📖 | Plain-language explanation of any code snippet |
| **Docs** | 📝 | Auto-generate JSDoc / docstring documentation |
| **Refactor** | 🔧 | Refactor for readability, DRY, and best practices |

> Switch between **Gemini Flash** (fast) and **Gemini Pro** (more powerful) directly in the UI.

---

## 🛠️ Tech Stack

- **Framework** — [Next.js 14](https://nextjs.org) (App Router)
- **Language** — [TypeScript 5](https://www.typescriptlang.org)
- **Database** — [MongoDB](https://mongodb.com) via [Mongoose 9](https://mongoosejs.com)
- **Real-time** — [Socket.io 4](https://socket.io) on a custom Node.js HTTP server
- **AI** — [Google Gemini AI](https://ai.google.dev) (`gemini-2.5-flash` + `gemini-1.5-pro`)
- **Code Editor** — [Monaco Editor](https://microsoft.github.io/monaco-editor/) (`@monaco-editor/react`)
- **Styling** — [Tailwind CSS 3](https://tailwindcss.com)
- **Auth** — [JWT](https://jwt.io) + [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Theming** — [next-themes](https://github.com/pacocoursey/next-themes)
- **Notifications** — [react-hot-toast](https://react-hot-toast.com)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** `>= 18.x` — [Download](https://nodejs.org)
- **npm** `>= 9.x` (ships with Node.js)
- **MongoDB** — [Atlas (cloud)](https://www.mongodb.com/atlas) or [local install](https://www.mongodb.com/try/download/community)
- **Google Gemini API Key** — [Get one free](https://aistudio.google.com/apikey)

---

## ⚡ Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/aman-kumar-27d/devsync-ai.git
cd devsync-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and add the following:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devsync-ai
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=a_long_random_secret_string_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | — | MongoDB connection string (Atlas or local) |
| `GEMINI_API_KEY` | ✅ Yes | — | Google Gemini AI API key |
| `JWT_SECRET` | ✅ Yes | — | Secret used to sign JWT tokens — **must be set explicitly, never use a weak or default value in production** |
| `NEXT_PUBLIC_APP_URL` | ⬜ No | `http://localhost:3000` | Public URL of the app (used for CORS on Socket.io) |
| `PORT` | ⬜ No | `3000` | Port for the custom Node.js server |

> ⚠️ **Never commit `.env.local` to version control.** It is already listed in `.gitignore`.

---

## 📜 Available Scripts

```bash
# Start development server (Next.js + Socket.io)
npm run dev

# Build the app for production
npm run build

# Start the production server
npm start

# Run ESLint
npm run lint

# Run API regression tests (PowerShell)
npm run qa:api-regression
```

---

## 📁 Project Structure

```
devsync-ai/
├── app/                        # Next.js App Router
│   ├── api/                    # API route handlers
│   │   ├── ai/chat/            # Gemini AI chat endpoint (streaming)
│   │   ├── auth/               # login / register / logout / me
│   │   ├── channels/           # Channel message routes
│   │   ├── dm/                 # Direct message routes
│   │   ├── files/              # File upload handler
│   │   ├── messages/           # Message CRUD + reactions
│   │   ├── notifications/      # User notifications
│   │   ├── search/             # Full-text search
│   │   ├── snippets/           # Code snippet save + AI explain
│   │   └── workspaces/         # Workspace CRUD + invite join
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── workspace/[id]/         # Workspace shell
│   │   ├── channel/[channelId] # Channel chat view
│   │   └── dm/[userId]         # Direct message view
│   ├── layout.tsx              # Root layout (providers, theming)
│   └── page.tsx                # Entry redirect
├── components/
│   ├── ai/                     # AI panel + mode selector
│   ├── chat/                   # Message list, composer, threads
│   ├── code/                   # Monaco code composer + snippet card
│   ├── files/                  # File viewer components
│   ├── layout/                 # Sidebar, header, nav
│   ├── notifications/          # Notification bell + list
│   └── search/                 # Search modal
├── contexts/                   # React contexts (Auth, Socket)
├── hooks/                      # Custom React hooks
├── lib/                        # Shared utilities
│   ├── auth.ts                 # JWT helpers + requireAuthUser guard
│   ├── gemini.ts               # Gemini model factory (Flash / Pro)
│   ├── guards.ts               # Workspace membership guards
│   ├── mongodb.ts              # Mongoose connection with module cache
│   ├── promptEngine.ts         # AI mode system prompts
│   └── socket.ts               # Socket.io client helper
├── models/                     # Mongoose models
│   ├── AiSession.ts            # Persisted AI chat history per user/mode
│   ├── Channel.ts
│   ├── File.ts
│   ├── Message.ts
│   ├── Notification.ts
│   ├── Snippet.ts
│   ├── User.ts
│   └── Workspace.ts
├── public/uploads/             # Uploaded file storage
├── scripts/qa/                 # QA / regression test scripts
├── server.js                   # Custom Node.js server (Next.js + Socket.io)
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## 🌐 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Log in and receive a JWT cookie |
| `POST` | `/api/auth/logout` | Clear the auth cookie |
| `GET` | `/api/auth/me` | Get the current authenticated user |

### Workspaces

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workspaces` | List workspaces for the current user |
| `POST` | `/api/workspaces` | Create a new workspace |
| `GET` | `/api/workspaces/:id` | Get workspace details |
| `POST` | `/api/workspaces/join` | Join a workspace via invite token |
| `GET` | `/api/workspaces/:id/channels` | List channels in a workspace |
| `POST` | `/api/workspaces/:id/channels` | Create a channel |

### Messages & DMs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/channels/:id/messages` | Paginated channel messages |
| `POST` | `/api/channels/:id/messages` | Send a channel message |
| `PATCH` | `/api/messages/:id` | Edit a message |
| `DELETE` | `/api/messages/:id` | Soft-delete a message |
| `POST` | `/api/messages/:id/react` | Add / toggle emoji reaction |
| `GET` | `/api/dm/:peerId/messages` | Paginated DM history |
| `POST` | `/api/dm/:peerId/messages` | Send a direct message |

### AI, Snippets & More

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Stream AI response (Gemini Flash/Pro) |
| `DELETE` | `/api/ai/chat?mode=<mode>` | Clear AI session history |
| `POST` | `/api/snippets` | Save a code snippet (+ optional AI explanation) |
| `GET` | `/api/snippets` | List snippets for a workspace |
| `POST` | `/api/files/upload` | Upload a file |
| `GET` | `/api/search?q=<query>` | Search messages and channels |
| `GET` | `/api/notifications` | Get notifications for current user |

---

## 🔌 Real-time Socket Events

The app uses a custom Node.js server that mounts **Socket.io** alongside Next.js.
Authentication is handled via the `authToken` cookie on the WebSocket handshake.

| Event (client → server) | Description |
|--------------------------|-------------|
| `channel:join` | Subscribe to a channel room |
| `channel:leave` | Unsubscribe from a channel room |
| `dm:join` | Subscribe to a DM room |
| `user:join` | Subscribe to personal notification room |
| `message:send` | Broadcast a channel message |
| `dm:send` | Broadcast a direct message |
| `message:edit` | Broadcast a message edit |
| `message:delete` | Broadcast a soft-delete |
| `message:react` | Broadcast an emoji reaction |
| `thread:reply` | Broadcast a thread reply |

| Event (server → client) | Description |
|--------------------------|-------------|
| `message:new` | New message received |
| `message:edited` | Message was edited |
| `message:deleted` | Message was deleted |
| `message:reacted` | Reaction was added / removed |
| `thread:new` | New thread reply |

---

## 🚢 Production Deployment

### Build & start

```bash
npm run build
npm start
```

### Environment checklist for production

- [ ] Set a strong, unique `JWT_SECRET` (32+ random characters)
- [ ] Use a MongoDB Atlas cluster with network access rules
- [ ] Set `NEXT_PUBLIC_APP_URL` to your actual domain
- [ ] Serve behind a reverse proxy (e.g. Nginx) with HTTPS

### Deploy to Vercel *(without Socket.io)*

> ⚠️ Socket.io requires a persistent Node.js server, which is **not** compatible with Vercel's serverless functions. For Vercel deployments, you would need to replace Socket.io with a compatible real-time provider (e.g. Pusher or Ably).

For full real-time support, deploy to a platform that runs long-lived Node processes such as:

- [Railway](https://railway.app)
- [Render](https://render.com)
- [Fly.io](https://fly.io)
- A VPS / Docker container

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feat/your-feature-name`
5. Open a Pull Request

Please make sure your code passes linting before submitting:

```bash
npm run lint
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Built with ❤️ by [aman-kumar-27d](https://github.com/aman-kumar-27d)

</div>
