# Screener Frontend - Async AI Video Interviewing Client

This directory holds the React + TypeScript frontend codebase, scaffolded using Vite and styled with Tailwind CSS to offer a premium dark mode layout.

---

## 🛠️ Tech Stack & Directory Mapping

- **Core Framework**: React 18 (TypeScript)
- **Scaffold/Bundler**: Vite
- **Styling**: Tailwind CSS v3 & PostCSS (Custom glassmorphic card classes, blinking capture overlays, and responsive flex/grids)
- **Icons**: Lucide React
- **Router**: React Router DOM (v6)

### Folder Hierarchy
```text
frontend/
├── src/
│   ├── components/
│   │   ├── shared/         # Navigation bars & Paddle Checkout mocks
│   │   └── ui/             # Video Recorders, Candidate Forms, Kanban Boards, & Metric Cards
│   ├── context/            # AuthContext.tsx handling token verification states and role types
│   ├── pages/              # Login, AdminDashboard, RecruiterDashboard, & CandidateInterview screens
│   ├── App.tsx             # Route setups and protection wrappers
│   ├── index.css           # Global CSS variables, custom scrollbars, and keyframe animations
│   └── main.tsx            # Bootstrap mounting
├── index.html              # Shell mounting with Outfit & Inter font assets
├── tailwind.config.js      # Custom theme color extending
└── package.json            # Script definitions and dependency pools
```

---

## 🚀 Local Quickstart Guide

### 1. Installation
Navigate to this directory and install required dependencies:
```bash
npm install
```

### 2. Development Execution
Launch the local Vite server:
```bash
npm run dev
```
The application will launch on port `3000` (`http://localhost:3000`).

### 3. Build & Preview
Validate type soundness and build a production-optimized package:
```bash
npm run build
```

---

## 🔒 Configuration & Environment Variables

All sensitive values are configured using environment references. In production, configure variables in your `.env` file. If undefined, the code defaults to the standard safety placeholder: `#reqd key`.

### Required Environment Properties
- `VITE_API_URL` (Defaults to `#reqd key` if absent): Base URL pointing to the FastAPI backend API router.
- `PADDLE_VENDOR_KEY` (Defaults to `#reqd key` if absent): Used by the billing overlay mockup to establish a secure handshake.
