# Design Principles & UI Notes

## Goals

- Clear role-based experience (Organizer / Athlete / Reporter / Viewer)
- Fast, responsive layout (mobile-first)
- Consistent status messaging for ticketing and participation

## Visual Style

- Glass/blur panels and soft borders (`glass-panel`, `glass-border`)
- Iconography via **Lucide React**
- Theme support via CSS variables + `ThemeContext` (`data-theme`)

## Key UI Patterns

### Navigation

- The app uses a persistent `Layout` with a top navbar.
- Menu items adapt based on auth state.
- Organizer-only actions (like payment verification) are visible only to organizers.

### Event Discovery

- Events list supports filtering/search.
- Event cards show:
  - category badge
  - date/location
  - organizer identity
  - ticketing participation status (if logged in)

### Ticket-Driven Participation Messaging

Participation is never “manual join”; it’s always based on ticketing state:

- `Pending payment`
  - order exists but proof not submitted
- `Pending verification`
  - proof submitted; waiting for organizer
- `You have joined this event`
  - order is `paid` or an active ticket exists

### Ticket Purchase Flow

- Multi-step flow (select ticket type → select payment method → confirm)
- If user is **not eligible** (wrong category/role/own event), the purchase UI is hidden and replaced with a clear disclaimer.

### Forms & Uploads

- File selection uses `ImageUpload` with local previews.
- Payment proof is submitted from `MyTickets` for `pending_payment` orders.

## CSS Variables (Example)

```css
:root {
  --primary: #3b82f6;
  --accent: #f59e0b;
  --radius-md: 0.5rem;
  --glass-border: rgba(255, 255, 255, 0.1);
}
```
