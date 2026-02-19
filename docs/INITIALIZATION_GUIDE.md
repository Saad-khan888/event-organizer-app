# 🚀 Initialization Guide (Supabase + React/Vite)

This guide explains how to set up the backend (Supabase) and run the frontend locally.

## 1) Supabase Setup

### A) Create a Supabase project

1. Create a new project at https://supabase.com
2. Wait for the database to finish provisioning.

### B) Apply schema

In Supabase Dashboard:

1. Go to **SQL Editor**
2. Run the schema from this repo:
   - `supabsesql.sql`

### C) Create Storage buckets

Create these buckets in **Storage**:

- `avatars`
- `event-images` (optional / future)
- `report-images`
- `payment-proofs`

## 2) Frontend Setup

### A) Environment variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### B) Install & run

```bash
npm install
npm run dev
```

## 3) Mobile / Network access (optional)

The dev server is configured to be accessible on your local network.

1. Run `ipconfig` and note your IPv4 address.
2. Open on phone (same Wi‑Fi):
   - `http://<your-ip>:5173`

## Troubleshooting

- If other devices can’t connect, check Windows Firewall rules for port `5173`.
