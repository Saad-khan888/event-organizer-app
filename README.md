# The Sports Ecosystem App

A modern, centralized web platform digitizing the local sports lifecycle. Connecting Event Organizers, Athletes, and Sports Reporters in real-time.

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [Supabase Account](https://supabase.com/) (free tier available)

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com)
2. Run the SQL schema from `supabsesql.sql` in your Supabase SQL Editor
3. Create three storage buckets in Supabase Storage:
   - `avatars` (public)
   - `event-images` (public)
   - `report-images` (public)
4. Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Frontend Setup (React/Vite)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at the Local URL provided (usually `http://localhost:5173`)

---

## 🛠️ Technology Stack

-   **Frontend**: React.js (Vite Build Tool)
    -   *Styling*: CSS Modules / Global CSS
    -   *Routing*: React Router DOM
    -   *Icons*: Lucide React
-   **Backend**: Supabase (BaaS)
    -   *Database*: PostgreSQL (Cloud-hosted)
    -   *Auth*: Supabase Auth with Email/Password
    -   *File Storage*: Supabase Storage (S3-compatible)
    -   *Realtime*: PostgreSQL Realtime subscriptions

---

## 🌟 Key Features

### 1. Role-Based Ecosystem
-   **Organizers**: Create and manage sports events
-   **Athletes**: Discover events, build profiles, and join competitions
-   **Reporters**: Cover events, write news articles, and publish to the global feed
-   **Viewers**: Browse and explore content, stay informed about local sports

### 2. Real-Time Interactions
-   **Live Updates**: Event lists and news feeds update automatically without refreshing
-   **Dynamic Join Buttons**: Immediate feedback on event participation status
-   **Realtime Subscriptions**: PostgreSQL-powered realtime data sync

### 3. Media Rich
-   **Image Uploads**: Profile pictures, Event banners (future), and Report photos fully supported
-   **Cloud Storage**: Scalable file storage with Supabase Storage
-   **Responsive Galleries**: Beautiful image grids for news reports

---

## 📂 Project Structure

-   `/src`: Source code
    -   `/components`: Reusable UI components (Navbar, Cards, ImageUpload)
    -   `/context`: Global state management (Auth, Data, Theme)
    -   `/pages`: Main application views (Home, Dashboard, Events, Profile, Feed)
    -   `/lib`: Utility functions (Supabase client configuration)
-   `/docs`: Detailed documentation on Architecture, Design, and Workflows
-   `supabsesql.sql`: Database schema for Supabase setup

---

## 📝 Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**Never commit `.env.local` to version control!**

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your hosting provider
3. Set environment variables in your hosting dashboard

### Backend (Supabase)
- Already hosted and managed by Supabase
- No additional deployment needed
- Scale automatically with usage

---

## 🔐 Security

- Row Level Security (RLS) policies enabled on all tables
- Public storage buckets for images (avatars, event images, reports)
- Authentication required for all write operations
- Role-based access control (RBAC) for content management

---

## 📚 Additional Documentation

See the `/docs` folder for:
- Architecture overview
- Design system documentation
- Development workflows
- API documentation

---

---

## 📄 License

This project is licensed under the MIT License.
