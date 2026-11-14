# WedEase – Wedding Planning & Management Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-rose.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_+_Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75C4?logo=google&logoColor=white)](https://ai.google.dev/)

**WedEase** is a modern, full-stack wedding planning and management platform designed to help couples, wedding planners, and coordinators organize every detail of their dream wedding seamlessly. From real-time budget tracking and vendor contracts to interactive day-of timelines and AI-powered planning advisors, WedEase keeps all wedding logistics under one cohesive, elegant roof.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Folder Structure](#folder-structure)
- [Getting Started & Installation](#getting-started--installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Deployment Guide](#deployment-guide)
  - [Frontend on Vercel](#frontend-deployment-vercel)
  - [Backend on Render](#backend-deployment-render)
  - [Database on MongoDB Atlas](#database-setup-mongodb-atlas)
- [Screenshots & Visual Tour](#screenshots--visual-tour)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Overview

Planning a wedding requires balancing complex vendor bookings, dynamic guest RSVPs, strict budgets, and precise day-of timing. WedEase eliminates spreadsheets and fragmented tools by offering an integrated digital dashboard that centralizes data, protects financial integrity against double counting, and provides intelligent, personalized AI recommendations based on your actual wedding information.

---

## Key Features

- **Couple & Wedding Profile**: Manage official couple names, ceremony and reception venue, wedding date, target guest count, and overall wedding budget.
- **Real-Time Interactive Dashboard**: Live countdown timer, financial health indicators, task completion percentages, RSVP breakdown, upcoming day-of milestones, and quick-action shortcuts.
- **Checklist & Task Management**: 10 pre-loaded wedding milestone tasks with priority tiers (`Low`, `Medium`, `High`), status toggling (`Pending`, `In Progress`, `Completed`), due dates, and custom task creation.
- **Budget & Expense Tracking**: Direct expense ledger categorizing spending (Venue, Catering, Photography, Attire, Decor, etc.) with estimated vs. actual cost comparisons and over-budget alerts.
- **Vendor Bookings & Contracts**: Directory of contracted vendors, service categories, contact persons, phone numbers, agreed total amounts, advance deposits, and outstanding balance tracking.
- **Payment History & Ledger**: Multi-installment payment recording (Advance, Partial, Final) with overpayment protection, automated balance adjustments, and audit history.
- **Guest List & RSVP Tracking**: Guest directory categorized by Family, Friends, Relatives, Colleagues, and Others. Tracks invitation status (Sent/Not Sent), RSVP response (Accepted/Declined/Pending), dietary requirements, and confirmed attendee counts.
- **Day-of Wedding Timeline Run-Sheet**: Chronological minute-by-minute schedule with 12h/24h time parser, start/end time validation, category tags, responsible party assignment, and print-ready run-sheet view.
- **AI Wedding Planning Assistant**: Live chat concierge answering planning dilemmas, venue selection considerations, and timeline organization based on actual wedding data.
- **AI Budget Advisor**: Automated financial intelligence calculating spending velocity, flagging over-spending categories, and generating cost-saving allocation strategies.
- **JWT Authentication & Data Isolation**: Secure bcrypt password hashing, token expiration, and strict user-level data segregation (`user: req.user._id`).

---

## Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + Custom Cormorant Garamond serif headings
- **Routing**: React Router DOM v7 (SPA routing with route guards)
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT Bearer token request interceptors and 401 handling
- **Linting**: Oxlint

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5
- **Database ODM**: Mongoose 9
- **Authentication**: JSON Web Token (JWT) + bcryptjs (10 salt rounds)
- **CORS**: Configurable domain whitelist with environment variable support
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`) with rule-based fallback

### Database & Hosting
- **Database**: MongoDB Atlas (Cloud Database)
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render

---

## System Architecture

```mermaid
flowchart TD
    User([Couple / Wedding Planner]) -->|HTTPS| Frontend[React + Vite Frontend\nHosted on Vercel]
    Frontend -->|Axios REST API + JWT Bearer| Backend[Node.js + Express Backend\nHosted on Render]
    Backend -->|Mongoose Driver| DB[(MongoDB Atlas\nCloud Database)]
    Backend -->|Native Fetch + API Key| Gemini[Google Gemini AI Engine]

    subgraph Security Layer
        JWT[JWT Auth Middleware]
        Bcrypt[bcryptjs Password Hashing]
        CORS[Configurable CORS Whitelist]
    end

    Backend --- Security Layer
```

---

## Folder Structure

```text
WedEase/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB Atlas connection & auto-retry
│   │   ├── controllers/
│   │   │   ├── aiController.js        # AI Planning & Budget Advisor handlers
│   │   │   ├── authController.js      # User registration & login
│   │   │   ├── bookingController.js   # Vendor booking CRUD & contract totals
│   │   │   ├── expenseController.js   # Direct expense ledger & budget calculations
│   │   │   ├── guestController.js     # Guest list & RSVP analytics
│   │   │   ├── healthController.js    # Health check endpoint
│   │   │   ├── paymentController.js   # Installment payments & balance restoration
│   │   │   ├── taskController.js      # Checklist CRUD & default milestones
│   │   │   ├── timelineController.js  # Day-of schedule & chronological sorting
│   │   │   └── weddingController.js   # Wedding profile management
│   │   ├── middleware/
│   │   │   └── authMiddleware.js      # JWT verification & req.user injection
│   │   ├── models/
│   │   │   ├── Booking.js             # Vendor contract Mongoose model
│   │   │   ├── Expense.js             # Direct expense item model
│   │   │   ├── Guest.js               # Guest attendee & RSVP model
│   │   │   ├── Payment.js             # Payment transaction record model
│   │   │   ├── Task.js                # Checklist task model
│   │   │   ├── Timeline.js            # Day-of timeline event model
│   │   │   ├── User.js                # User account authentication model
│   │   │   └── Wedding.js             # Wedding profile model
│   │   ├── routes/
│   │   │   ├── aiRoutes.js            # /api/ai endpoints
│   │   │   ├── authRoutes.js          # /api/auth endpoints
│   │   │   ├── bookingRoutes.js       # /api/bookings endpoints
│   │   │   ├── expenseRoutes.js       # /api/expenses endpoints
│   │   │   ├── guestRoutes.js         # /api/guests endpoints
│   │   │   ├── healthRoutes.js        # /api/health endpoint
│   │   │   ├── paymentRoutes.js       # /api/payments endpoints
│   │   │   ├── taskRoutes.js          # /api/tasks endpoints
│   │   │   ├── timelineRoutes.js      # /api/timelines endpoints
│   │   │   └── weddingRoutes.js       # /api/weddings endpoints
│   │   ├── services/
│   │   │   └── aiService.js           # Gemini API integration & context aggregator
│   │   └── server.js                  # Express application entrypoint
│   ├── .env.example                   # Backend environment template
│   ├── .gitignore                     # Backend gitignore
│   └── package.json                   # Backend dependencies and scripts
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js               # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx     # Route guard requiring valid JWT
│   │   │   └── PublicRoute.jsx        # Redirects authenticated users to dashboard
│   │   ├── context/
│   │   │   ├── AuthContext.js         # React auth context
│   │   │   ├── AuthProvider.jsx       # Auth state provider
│   │   │   └── useAuth.js             # Auth consumer hook
│   │   ├── pages/
│   │   │   ├── AiAssistant.jsx        # Conversational AI wedding assistant
│   │   │   ├── AiBudgetAdvisor.jsx    # Strategic budget advisor & charts
│   │   │   ├── Bookings.jsx           # Vendor booking management
│   │   │   ├── Budget.jsx             # Expense tracker & budget breakdown
│   │   │   ├── Checklist.jsx          # Wedding task checklist
│   │   │   ├── Dashboard.jsx          # Main executive analytics portal
│   │   │   ├── Guests.jsx             # Guest list & RSVP management
│   │   │   ├── Login.jsx              # User sign-in page
│   │   │   ├── Register.jsx           # User registration page
│   │   │   ├── Timeline.jsx           # Day-of timeline run-sheet
│   │   │   └── WeddingProfile.jsx     # Wedding details form
│   │   ├── services/
│   │   │   ├── aiService.js           # Frontend AI API client
│   │   │   ├── authService.js         # Frontend authentication API client
│   │   │   ├── bookingService.js      # Frontend vendor bookings API client
│   │   │   ├── budgetService.js       # Frontend budget API client
│   │   │   ├── guestService.js        # Frontend guest API client
│   │   │   ├── taskService.js         # Frontend task API client
│   │   │   ├── timelineService.js     # Frontend timeline API client
│   │   │   └── weddingService.js      # Frontend wedding profile API client
│   │   ├── App.jsx                    # Root router configuration
│   │   ├── index.css                  # Tailwind CSS import & typography
│   │   └── main.jsx                   # React DOM entry point
│   ├── .env.example                   # Frontend environment template
│   ├── .gitignore                     # Frontend gitignore
│   ├── package.json                   # Frontend dependencies and scripts
│   ├── vercel.json                    # Vercel SPA routing rewrite config
│   └── vite.config.js                 # Vite build & Tailwind configuration
├── .gitignore                         # Root gitignore
└── README.md                          # Master documentation
```

---

## Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB Atlas Account**: (or a local MongoDB instance)

### 1. Clone the Repository
```bash
git clone https://github.com/CTMJayasooriya/WedEase.git
cd WedEase
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file inside the `backend/` directory based on `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/wedease?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `FRONTEND_URL` | Allowed CORS frontend origin | `http://localhost:5173` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | Any secure 32+ char string |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for live AI generation | `AIzaSy...` |

### Frontend (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory based on `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the WedEase Backend API | `http://localhost:5000/api` |

---

## Running the Application

### Development Mode

Open two separate terminal windows:

#### Terminal 1: Backend API Server
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000 with nodemon auto-restart
```

#### Terminal 2: Frontend Client
```bash
cd frontend
npm run dev
# Vite development server will open on http://localhost:5173
```

---

## API Overview

All routes except `/api/auth/*`, `/api/health`, and `/` require a valid JWT passed in the HTTP Authorization header:  
`Authorization: Bearer <token>`

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Root server status check | No |
| `GET` | `/api/health` | Service health status | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | No |
| `POST` | `/api/weddings` | Create wedding profile | Yes |
| `GET` | `/api/weddings/my-wedding` | Retrieve authenticated user's wedding details | Yes |
| `PUT` | `/api/weddings/my-wedding` | Update wedding profile | Yes |
| `GET` | `/api/tasks` | Get tasks with optional filters | Yes |
| `POST` | `/api/tasks` | Add new task | Yes |
| `PUT` | `/api/tasks/:id` | Update task details or status | Yes |
| `DELETE`| `/api/tasks/:id` | Delete task | Yes |
| `POST` | `/api/tasks/default-checklist` | Generate 10 default wedding milestones | Yes |
| `GET` | `/api/expenses` | Get expenses & financial summary | Yes |
| `POST` | `/api/expenses` | Add direct expense item | Yes |
| `PUT` | `/api/expenses/:id` | Update expense item | Yes |
| `DELETE`| `/api/expenses/:id` | Delete expense item | Yes |
| `GET` | `/api/bookings` | Get vendor bookings & totals | Yes |
| `POST` | `/api/bookings` | Create vendor booking & log initial deposit | Yes |
| `PUT` | `/api/bookings/:id` | Update booking contract details | Yes |
| `DELETE`| `/api/bookings/:id` | Delete booking & cascade delete payments | Yes |
| `POST` | `/api/payments` | Record payment against a booking | Yes |
| `GET` | `/api/payments` | Full payment ledger history | Yes |
| `DELETE`| `/api/payments/:id` | Delete payment & restore booking balance | Yes |
| `GET` | `/api/guests` | Get guest list with filters | Yes |
| `POST` | `/api/guests` | Add guest | Yes |
| `PUT` | `/api/guests/:id` | Update guest & RSVP status | Yes |
| `DELETE`| `/api/guests/:id` | Delete guest | Yes |
| `GET` | `/api/guests/statistics` | RSVP response & attendee metrics | Yes |
| `GET` | `/api/timelines` | Get chronological day-of timeline | Yes |
| `POST` | `/api/timelines` | Add timeline event with time validation | Yes |
| `PUT` | `/api/timelines/:id` | Update timeline event | Yes |
| `DELETE`| `/api/timelines/:id` | Delete timeline event | Yes |
| `POST` | `/api/ai/wedding-assistant` | Conversational AI Q&A with live wedding context | Yes |
| `POST` | `/api/ai/budget-advisor` | Comprehensive financial audit & AI recommendations | Yes |

---

## Deployment Guide

### Frontend Deployment (Vercel)

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import the `WedEase` repository.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://your-wedease-backend.onrender.com/api
   ```
6. Click **Deploy**. Vercel will build the frontend using the bundled `vercel.json` SPA routing rewrite file.

### Backend Deployment (Render)

1. Sign in to [Render](https://render.com/) and create a **"New Web Service"**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, configure:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/wedease?retryWrites=true&w=majority
   JWT_SECRET=your_production_secret_key
   FRONTEND_URL=https://your-wedease-app.vercel.app
   GEMINI_API_KEY=your_gemini_api_key
   ```
5. Click **Create Web Service**. Once deployed, copy your Render URL and update `VITE_API_BASE_URL` on Vercel.

### Database Setup (MongoDB Atlas)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a cluster (M0 Free Tier or higher).
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render's cloud servers.
5. In **Clusters > Connect > Drivers**, copy the connection string and paste it into `MONGO_URI`.

---

## Screenshots & Visual Tour

*(Screenshots can be placed in `docs/screenshots/` and linked below)*

| View | Description |
| :--- | :--- |
| **Executive Dashboard** | Real-time countdown timer, budget utilization bar, task status, guest RSVP summary, and AI shortcuts. |
| **Wedding Checklist** | 10 pre-loaded milestones, filterable priority tags, and completion checkmarks. |
| **Budget & Ledger** | Estimated vs. actual expense cards, payment status badges, and category breakdown. |
| **Vendor Directory** | Vendor categories, agreed contract amounts, advance payments, and remaining balances. |
| **Day-of Run-Sheet** | Chronological event cards, time parser, responsible person tags, and printer-friendly view. |
| **AI Assistant & Budget Advisor** | Live chat concierge with prompt chips and automated financial advice reports. |

---

## Future Enhancements

- [ ] Automated SMS / Email RSVP invitations with unique guest tokens.
- [ ] Drag-and-drop seating chart arrangement tool.
- [ ] Multi-user collaboration with customized planner/couple permission roles.
- [ ] Exportable budget reports in Excel / PDF formats.
- [ ] Integration with Stripe for direct vendor payment processing.

---

## License

This project is licensed under the [ISC License](LICENSE).
