import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
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
