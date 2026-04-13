# 📚 Libra — Library Management System

A modern, full-stack digital library ecosystem built for both **Librarians** and **Students**. Features automated fine calculation, AI-powered book descriptions, student behavioral profiling, persistent wishlists, real-time search, and a role-based dual portal experience.

---

## 🌟 Features

### 👨‍🏫 Librarian Portal
- **Dashboard**: Admin stats — total books, active loans, student count, pending fines.
- **Inventory Manager** (`/manage-books`): Add/delete books; issue any book to a student via email.
- **Process Returns** (`/return-books`): Mark books as returned with automatic overdue fine calculation (₹1/day).
- **User Management** (`/manage-users`): View all accounts, fine balances; collect cash fines or remove users.
- **Student Insights** (`/student-insights`): AI-powered behavioral profiling. Generate summaries of any student's reading habits, reliability, and history using Gemini AI.
- **Transaction Log** (`/history`): Global log of every borrow/return across all students.

### 🎓 Student Portal
- **Dashboard** (`/`): Active loans with days-left countdown, overdue alerts, reading goal progress, AI-based book recommendations.
- **My Books** (`/my-books`): Currently borrowed books with due date tracking.
- **Reading History** (`/history`): Personal chronological borrow/return log.
- **Fines & Payments** (`/fines`): Detailed fine breakdown + simulated online payments (UPI / Card / Netbanking).
- **AI-Enhanced Wishlist** (`/wishlist`): Save books; click **✨ AI Explain** for a Gemini-powered description of any book.
- **Live Search**: Header search bar filters catalog in real-time by title or author.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, React Router v7, CSS Variables |
| **Backend** | Node.js, Express 5, JWT Authentication, bcryptjs |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | Firebase (Google Sign-In for students), Email/Password (Librarian) |
| **AI** | Google Gemini (2.5 Flash & 2.0 Fallback) (`@google/generative-ai`) |
| **HTTP Client** | Axios (with JWT interceptor) |

---

## 📁 Project Structure

```
Libra-Library_system/
├── backend/
│   ├── server.js             ← All routes, schemas, middleware, AI with retry logic
│   ├── .env                  ← Secrets (never committed)
│   ├── package.json
│   └── seed_comprehensive.js ← Test data seeder script
│
├── client/
│   ├── index.html            ← Root HTML + FontAwesome CDN
│   ├── vite.config.js        ← Dev server + API proxy (/api → port 3000)
│   └── src/
│       ├── main.jsx           ← App entry point
│       ├── App.jsx            ← Routes + AppLayout wrapper
│       ├── index.css          ← All styles and CSS variables
│       ├── firebase.js        ← Firebase + Google Sign-In setup
│       ├── context/
│       │   └── AuthContext.jsx ← Global auth state (user, token, isLibrarian)
│       ├── services/
│       │   └── api.js          ← Axios instance + all API methods + JWT injection
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   └── ProtectedRoute.jsx
│       └── pages/             ← One file per route
│
├── .gitignore
├── README.md
└── requirements.txt
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB Atlas** account
- **Firebase** project (for Google Auth)
- **Google AI Studio** API key (for Gemini)

### 1. Environment Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
SECRET_KEY=your_jwt_secret_key
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/libraryDB
GOOGLE_API=your_gemini_api_key
```

> Firebase config is in `client/src/firebase.js`. Update it with your own Firebase project settings.

### 2. Install & Run

**Backend** (Terminal 1):
```bash
cd backend
npm install
npm start
# → Server running at http://localhost:3000
```

**Frontend** (Terminal 2):
```bash
cd client
npm install
npm run dev
# → App running at http://localhost:5173
```

### 3. Seed Test Data (Optional but Recommended)

To populate the DB with realistic borrow histories, overdue fines, and payment logs:
```bash
cd backend
node seed_comprehensive.js
```

This creates scenarios across all users:
- 📕 Overdue books (30 days past due → pending fines)
- ⏰ Books due soon (due tomorrow)
- 📗 Freshly borrowed books
- 📚 Returned books (on-time and late, for history/goal tracking)
- 💳 Simulated past payments

---

## 🔐 Authentication Flow

### Student (Google)
1. Clicks "Sign in with Google" → Firebase popup
2. Firebase returns Google profile
3. Backend (`POST /api/auth/sync`) finds or creates user, returns JWT
4. JWT stored in `localStorage['libra_token']`

### Librarian (Email/Password)
1. Submits email + password form
2. Backend (`POST /api/login`) validates with bcrypt, returns JWT
3. JWT stored in `localStorage['libra_token']`

All subsequent API requests automatically attach the JWT via an Axios interceptor in `api.js`.

---

## 🔌 API Endpoints (23 Routes)

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/login` | None | Librarian email/password login |
| POST | `/api/auth/sync` | None | Student Google auth sync |

### Books
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/books` | Token | Get full catalog |
| GET | `/api/books/search?q=` | Token | Search by title/author |
| POST | `/api/books/add` | Librarian | Add new book |
| DELETE | `/api/books/:id` | Librarian | Delete book |
| POST | `/api/books/issue` | Librarian | Issue book to student (14-day loan) |
| POST | `/api/books/return` | Librarian | Return book + auto-calculate fine |
| GET | `/api/books/:bookId/ai-description` | Token | Gemini AI book summary |

### Student
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/student/dashboard` | Token | Active loans, fines, reading stats |
| GET | `/api/my-books` | Token | Currently borrowed books |
| GET | `/api/student/history` | Token | Personal borrow/return history |
| GET | `/api/student/reading-goal` | Token | Reading goal + progress |
| PUT | `/api/student/reading-goal` | Token | Update reading goal |
| GET | `/api/student/fines` | Token | Fine balance + payment history |
| POST | `/api/student/fines/pay-online` | Token | Simulated online payment |
| GET | `/api/student/wishlist` | Token | Get wishlist |
| POST | `/api/student/wishlist/add` | Token | Add book to wishlist |
| DELETE | `/api/student/wishlist/:bookId` | Token | Remove from wishlist |

### Librarian
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stats` | Librarian | Aggregated library stats |
| GET | `/api/borrows` | Librarian | All active loans |
| GET | `/api/history` | Librarian | Global transaction log |
| GET | `/api/users` | Librarian | All users + fine balances |
| GET | `/api/admin/student-summary/:email` | Librarian | AI Student Profiling Summary |
| DELETE | `/api/users/:id` | Librarian | Remove student |
| POST | `/api/fines/collect` | Librarian | Collect cash fine |

---

## 💡 Business Logic

| Rule | Detail |
|---|---|
| **Loan Period** | 14 days from issue date |
| **Fine Rate** | ₹1.00 per day overdue |
| **Fine Trigger** | Auto-calculated when librarian processes return |
| **Self-Borrow** | Disabled — librarians must issue books |
| **Duplicate Loan** | Blocked — student can't have same book twice |
| **Wishlist** | Persisted in MongoDB per account |
| **Reading Goal** | Based on books returned in current calendar year |
| **Search** | Case-insensitive substring match on title + author |

---

## 🗄️ MongoDB Collections

| Collection | Key Fields |
|---|---|
| `users` | `email`, `role`, `pendingFines`, `readingGoal` |
| `books` | `title`, `author`, `totalCopies`, `available` |
| `borrows` | `bookId`, `userEmail`, `dueDate`, `returned`, `returnDate` |
| `paymentlogs` | `userEmail`, `amount`, `method`, `status` |
| `wishlists` | `userEmail`, `bookId` |

---

## ✨ AI Integration (Robust Logic)

The backend now features a **resilient AI processing layer** using Google Gemini.

### Features:
1. **Automatic Retry Logic**: If the Gemini API experiences a temporary outage (503 Service Unavailable) or rate limit (429), the backend automatically retries up to 3 times with exponential back-off (2s, 4s, 6s).
2. **Model Fallback**: If `gemini-2.5-flash` fails after retries, the system automatically falls back to `gemini-2.0-flash` to ensure continuity.
3. **Student Profiling**: Analyzes a student's entire history (returned books, active loans, fines) to generate a concise behavioral overview for librarians.
4. **Book Summaries**: Generates engaging catalog descriptions for students in the wishlist.

### Technical Detail:
- **Service**: Google Generative AI (`@google/generative-ai`)
- **Error Handling**: Network-level and API-level error recovery.
- **Security**: Endpoint access gated by JWT and role-based permissions (Student/Librarian).

---

## 🧪 Test Credentials

| Role | Email | Password |
|---|---|---|
| Librarian | `admin@library.com` | `password123` |
| Student | Any Google Account | — (Google Sign-In) |

---

*Made with ❤️ for modern library management.*
