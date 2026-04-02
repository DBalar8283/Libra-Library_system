# 📚 Libra-Library Management System

A modern, full-stack library ecosystem designed for both **Librarians** and **Students**. Move beyond simple spreadsheets with automated fine collection, reading goals, and a persistent wishlist.

---

## 🌟 Key Features

### 👨‍🏫 Librarian Portal
- **Manage Books**: Full CRUD for the library catalog with real-time availability tracking.
- **Issuing Engine**: Quickly issue books to students with an automatic 14-day due date.
- **Smart Returns**: Returning books automatically calculates overdue penalties (₹1 per day) and increments the student's fine balance.
- **User Management**: Track student debt, membership levels, and account statuses from a centralized dashboard.
- **Admin Stats**: High-level visibility into total books, active loans, and total pending fines.

### 🎓 Student Portal
- **Personal Dashboard**: Real-time stats on your active loans, upcoming deadlines, and annual reading progress.
- **Functional Catalog**: Search and filter the library's collection by title or author instantly.
- **Persistent Wishlist**: Save books you want to read next. Sycned to your account across all devices.
- **Reading Goals**: Set and track annual targets. Progress is automatically calculated as you return books.
- **Fine Management**: Detailed breakdown of overdue fees with simulated online payment (UPI/Card/Netbanking).
- **History**: A complete, chronological log of every book you've ever borrowed.

---

## 🛠️ Technology Stack
- **Frontend**: React.js (Vite), CSS Grid, Context API (Auth), FontAwesome.
- **Backend**: Node.js, Express.js, JWT (Authentication).
- **Database**: MongoDB Atlas (Mongoose).
- **Auth**: Firebase Google Auth (Student) & Email/Password (Librarian).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (for MONGODB_URI)
- Firebase Project (for Google Auth Client ID)

### 2. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
SECRET_KEY=libra_secret_app_key
PORT=3000
```

### 3. Installation & Run
**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```
Accessible at: `http://localhost:5173`

---

## 🧪 Testing the System
To see the system in a "busy library" state without manual entries, run the comprehensive seed script:
```bash
cd backend
node seed_comprehensive.js
```
This will populate the database with several overdue books, history logs, and payment records for all existing users.

---

## 🔐 Default Credentials (Local Test)
- **Librarian**: `admin@library.com` / `password123`
- **Student**: Any Google Account login or `bhargavbhojak@gmail.com`

---

## 📐 Logic Standards
- **Loan Period**: 14 Days.
- **Fine Rate**: ₹1.00 per day overdue.
- **Goal Calculation**: Based on returns within the current calendar year.
- **Search**: Case-insensitive substring match on Title and Author.

*Made with ❤️ for modern library management.*
