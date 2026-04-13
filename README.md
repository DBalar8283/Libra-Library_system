# 📚 Libra — Advanced Library Management System

Libra is a sophisticated, full-stack digital library ecosystem engineered for a seamless experience between **Librarians** and **Students**. It combines traditional library management (circulation, inventory, fines) with modern AI capabilities like behavioral student profiling and automated book analysis, all wrapped in a high-performance, responsive interface.

---

## 🌟 Comprehensive Feature Set

### 👨‍🏫 Librarian Administration Portal
*   **Insightful Dashboard**: Real-time visualization of library health, including total circulation, active members, aggregate pending fines, and inventory status.
*   **Inventory Control Center**: Manage the complete catalog with granular control over book metadata, stock levels (total vs. available), and removal protocols.
*   **Intelligent Circulation**: Simplified "Issue & Return" workflow with real-time validation (e.g., duplicate loan prevention) and automated fine calculation back-dated to the due hour.
*   **Student Insights & Profiling**: A dedicated section for understanding member behavior. Utilizing Gemini AI to generate professional summaries of a student's reading habits, overdue trends, and reliability.
*   **Financial Oversight**: Track and manage pending fines. Support for recording manual cash collections at the physical counter with instant digital receipt logging.
*   **Global Audit Log**: A comprehensive transaction history that ensures every book movement is recorded with student name, date, and issuer identity.

### 🎓 Student Experience Portal
*   **Personal Dashboard**: Track active loans with dynamic "Days Remaining" counters and overdue alerts. Features a visual reading goal tracker based on current year achievements.
*   **Smart Catalog & Live Search**: Explore the library through a rich, image-driven catalog. Search by title or author with instantaneous results filtering.
*   **Rich Media Cards**: Integrated via the Open Library API to provide real-world cover art for every book, maintaining a professional portrait (2:3) aspect ratio.
*   **AI-Enhanced Wishlist**: A private shelf for tracking future reads. Includes a "Hero" modal feature where the Gemini AI provides a tailored summary and premise of the book on demand.
*   **Financial Transparency**: Clear overview of any pending fines with a history of past payments. Includes a simulated checkout flow for online payments (UPI, Card, NetBanking).
*   **Personal History**: A chronological log of personal reading history and returning behavior.

---

## 🛠️ Technical Architecture

### Core Tech Stack
| Layer | Specification |
|---|---|
| **Frontend** | React 19 (Vite), React Router v7, Context API for State Management |
| **Backend** | Node.js (Express 5), JWT-based Authentication |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Authentication** | Dual-flow: Firebase Google Auth (Students) + Secure Email/Password (Librarian) |
| **AI Integration** | Google Gemini (Pro/Flash) with resilient network handlers |
| **Cover Assets** | Open Library API (ISBN-based CDN) |
| **Styling** | Vanilla CSS3 (Custom Variables & Modern Layouts) |

### AI Resilience Layer
The backend implements a highly resilient AI processing pattern:
*   **Automatic Retries**: Implements exponential back-off (2s, 4s, 6s) to handle transient API issues or rate limits.
*   **Model Fallback**: Automatically switches from `gemini-2.5-flash` to `gemini-2.0-flash` if repeated failures occur, ensuring high availability of AI features.
*   **Context-Aware Prompting**: Prompts are dynamically built using real database records (borrow frequency, return speed, fine history) to ensure AI summaries are grounded in fact.

---

## 📁 Detailed Directory Structure

```
Libra-Library_system/
├── backend/
│   ├── server.js               # Core API server (Routes, Middleware, Logic)
│   ├── .env                    # Environment secrets (Port, DB URI, API Keys)
│   ├── package.json            # Node.js dependencies & scripts
│   └── seed_comprehensive.js   # Advanced script to populate test scenarios
│
├── client/
│   ├── vite.config.js          # Build config & /api proxy to backend
│   └── src/
│       ├── components/
│       │   ├── Header.jsx      # Navigation & Search Logic
│       │   ├── Sidebar.jsx     # Role-based Navigation mapping
│       │   └── BookCover.jsx   # Smart CDN image loader with fallback UI
│       ├── context/
│       │   └── AuthContext.jsx # Global User/Token management
│       ├── services/
│       │   └── api.js          # Centralized Axios instance with JWT Interceptors
│       ├── utils/
│       │   └── bookCovers.js   # Title-to-ISBN mapping for covers
│       └── pages/              # View-level components (Dashboard, Wishlist, etc.)
```

---

## 🚀 Installation & Local Development

### 1. Prerequisite Accounts
- **Google AI Studio**: Obtain a Gemini API Key.
- **Firebase Console**: Configure a project for Google Authentication.
- **MongoDB Atlas**: Set up a cluster and get your connection string.

### 2. Environment Configuration
Create a `.env` file in the `/backend` folder:
```env
PORT=3000
SECRET_KEY=any_random_secure_string
MONGODB_URI=your_mongodb_connection_uri
GOOGLE_API=your_gemini_studio_api_key
```

### 3. Execution
**Run the Backend Server:**
```bash
cd backend
npm install
npm start
```

**Run the Frontend Application:**
```bash
cd client
npm install
npm run dev
```

---

## 🧪 Business Rules & Logic
*   **Loan Constraints**: Standard 14-day loan period. Duplicate borrows of the same book are strictly prevented.
*   **Fine Calculation**: Fines accrue at ₹1.00 per day once the due date is passed. Calculation is triggered instantly upon book return.
*   **Reading Goals**: Calculated based on completed (returned) books within the current calendar year.
*   **Image Presentation**: Books are maintained in a 2:3 aspect ratio to prevent distortion of cover art across all viewports.
*   **Role-Based Access**: Students can only access their specific dashboard and wishlist; Librarian routes are strictly guarded by middleware.

---

*Developed for high-efficiency modern library management.*
