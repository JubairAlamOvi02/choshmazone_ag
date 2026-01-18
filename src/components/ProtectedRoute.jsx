import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="loading-spinner">Loading...</div>; // Replace with proper loading component
    }

    if (!user) {
        // Redirect to home page as requested
        return <Navigate to="/" replace />;
    }

    if (requireAdmin && role !== 'admin') {
        // User is logged in but not admin
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
