# Features & Workflows

This document describes the current user flows and the app’s main features.

## ✅ Core Invariants

- **Participation is ticket-based only**.
  - There is no direct “Join Event”.
  - To participate, a user must create an order by purchasing tickets.
- **Organizers cannot purchase tickets**.
- **Athletes/Reporters are restricted by category**.
  - They can only purchase tickets for events matching their `category`.
- **If tickets/payment methods are not configured**, the app shows that tickets are not available.

## 🛠️ User Workflows

### 1) Authentication & Profile

- Sign up with Email/Password.
- Choose a role:
  - Organizer
  - Athlete
  - Reporter
  - Viewer
- Fill role-specific fields (e.g. category).

### 2) Organizer Workflow

Organizers manage the full event + ticketing lifecycle:

1. Create/update/delete events.
2. Create ticket types for an event.
3. Configure payment methods for an event.
4. Verify user payments:
   - Users submit payment proof.
   - Organizer approves/rejects.
5. Ticket validation (QR scanning route available).

### 3) Athlete Workflow

Athletes can participate only in events of their category:

1. Browse events.
2. Open event details.
3. Purchase tickets (if eligible and tickets are available).
4. If order is `pending_payment`, submit payment proof from **My Tickets**.
5. Status progression:
   - `pending_payment` → `pending_verification` → `paid`

### 4) Reporter Workflow

Reporters can participate in events (ticket-based) and also publish reports:

1. Browse events and purchase tickets (category restrictions apply).
2. Create reports with images.
3. Reports appear in the feed.

### 5) Viewer Workflow

Viewers can purchase tickets for any category and browse content.

## 🌟 Key Features

### Event Management

- Create/edit/delete events (organizer)
- Public event browsing and filtering
- Event details view + ticket purchase entry point

### Ticketing & Payments

- Ticket types per event
- Payment methods per event
- Order creation via RPC (atomic reservation)
- Payment proof upload
- Organizer verification dashboard
- Participation UI shows:
  - Pending payment
  - Pending verification
  - Joined (after `paid` / active ticket)

### Media & Reports

- Reporter report creation
- Image uploads (Supabase Storage)
- Feed and report details

## ⚙️ Tech Stack

- Frontend: React + Vite + React Router
- Backend: Supabase (PostgreSQL + Auth + Storage + RPC)

## Realtime Note

Supabase Realtime is intentionally **disabled** in the current frontend; the app refreshes local state after writes.
