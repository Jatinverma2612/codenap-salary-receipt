import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-codenap-canvas">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-codenap-borderStrong bg-white px-8 py-6 shadow-flat">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-codenap-tintStrong border-t-codenap-navy" />
          <p className="text-sm font-medium text-codenap-navy">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
