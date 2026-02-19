# System Architecture

## 🏗️ High-Level Overview

This application follows a **two-tier architecture**:

1. **Frontend (Client)**: React (Vite) Single Page Application.
2. **Backend (BaaS)**: Supabase (PostgreSQL + Auth + Storage + RPC).

## Frontend

### Routing

Routing is handled with **React Router**.

Key routes (see `src/App.jsx`):

- `/` (Home)
- `/login`, `/signup`
- `/events`, `/events/:id`
- `/dashboard`, `/feed`, `/search`, `/settings`, `/profile/:id`
- Ticketing:
  - `/my-tickets`
  - `/verify-payments` (organizer)
  - `/scan-tickets/:eventId` (QR scan)

### State & Data Layers (Contexts)

Global state is managed via React Context:

- `AuthContext`
  - Auth session + profile loading.
- `DataContext`
  - Loads and caches:
    - `events`
    - `reports`
    - `users`
  - Realtime subscriptions are intentionally **disabled**; the app refreshes local state after mutations.
- `TicketingContext`
  - Loads and caches:
    - `ticket_types`
    - `payment_methods`
    - `orders`
    - `tickets`
  - Provides RPC wrappers for creating orders and verifying/validating tickets.
- `ThemeContext`
  - Light/dark mode.

### Participation Rule (Important Invariant)

**Users do not “join” events directly.** Participation is ticket-driven:

- Direct event join is disabled.
- The UI reflects participation from ticketing data:
  - `pending_payment`
  - `pending_verification`
  - `paid` (treated as joined)
  - active tickets also imply joined

## Backend (Supabase)

### Core Tables

- `users`, `events`, `reports`
- Ticketing:
  - `ticket_types`
  - `payment_methods`
  - `orders`
  - `tickets`
  - `ticket_validations`

### RPC / Stored Procedures (conceptual)

- Create ticket order (atomic reservation)
- Approve/reject payment
- Validate scanned ticket

### Storage Buckets

- `avatars`
- `event-images` (optional / future)
- `report-images`
- `payment-proofs`

### Security

- Row Level Security (RLS) enabled on public tables.
- Auth via Supabase Auth (email/password).
