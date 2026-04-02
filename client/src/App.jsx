import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MyBooksPage from './pages/MyBooksPage';
import HistoryPage from './pages/HistoryPage';
import FinesPage from './pages/FinesPage';
import WishlistPage from './pages/WishlistPage';
import ManageBooksPage from './pages/ManageBooksPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ReturnBooksPage from './pages/ReturnBooksPage';

const AppLayout = ({ children }) => {
    return (
        <div className="dashboard">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="content-wrapper">
                    {children}
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Any authenticated user */}
            <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
            
            {/* Student only routes (using standard ProtectedRoute, checking role happens in UI or backend usually, but we could add reqStudent) */}
            <Route path="/my-books" element={<ProtectedRoute><AppLayout><MyBooksPage /></AppLayout></ProtectedRoute>} />
            <Route path="/fines" element={<ProtectedRoute><AppLayout><FinesPage /></AppLayout></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><AppLayout><WishlistPage /></AppLayout></ProtectedRoute>} />

            {/* Librarian only routes */}
            <Route path="/manage-books" element={<ProtectedRoute reqLibrarian><AppLayout><ManageBooksPage /></AppLayout></ProtectedRoute>} />
            <Route path="/manage-users" element={<ProtectedRoute reqLibrarian><AppLayout><ManageUsersPage /></AppLayout></ProtectedRoute>} />
            <Route path="/return-books" element={<ProtectedRoute reqLibrarian><AppLayout><ReturnBooksPage /></AppLayout></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
