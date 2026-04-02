import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, reqLibrarian }) {
    const { token, isLibrarian, loading } = useAuth();
    const location = useLocation();

    if (loading) return null; // or a spinner

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (reqLibrarian && !isLibrarian) {
        return <Navigate to="/" replace />;
    }

    return children;
}
