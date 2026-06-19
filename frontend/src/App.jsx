import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { useSocket } from "./context/useSocket";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast from "./components/Toast";
import UpdateAvailableModal from "./components/UpdateAvailableModal";
import {
  bootstrapNativeShell,
  checkRemoteVersion,
  isNativeAndroidApp,
  registerNativePushForUser,
  subscribeToNetworkChanges
} from "./services/nativeBridge";
import { useAuth } from "./context/useAuth";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const PortalHome = lazy(() => import("./pages/PortalHome"));
const StudentLogin = lazy(() => import("./pages/StudentLogin"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const TeacherLayout = lazy(() => import("./layouts/TeacherLayout"));
const StudentLayout = lazy(() => import("./layouts/StudentLayout"));

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--light-bg)',
    color: 'var(--navy)',
    fontSize: '1.2rem',
    fontWeight: '700'
  }}>
    <i className="fa-solid fa-circle-notch fa-spin" style={{marginRight: '12px'}}></i>
    Loading...
  </div>
);

function AppContent() {
  const { user } = useAuth();
  const socket = useSocket();
  const [notification, setNotification] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on("new-announcement", (data) => {
        setNotification({ message: `New Announcement: ${data.title}` });
      });
      socket.on("fee-paid", (data) => {
        setNotification({ message: `Fee Paid: ₹${data.amount} by ${data.student}` });
      });
      return () => {
        socket.off("new-announcement");
        socket.off("fee-paid");
      };
    }
  }, [socket]);

  useEffect(() => {
    let cleanup = () => {};
    let mounted = true;

    const bootstrap = async () => {
      const { online } = await bootstrapNativeShell();
      if (mounted) setIsOnline(online);

      cleanup = await subscribeToNetworkChanges((nextOnline) => {
        if (mounted) setIsOnline(nextOnline);
      });

      try {
        const update = await checkRemoteVersion();
        if (mounted) setUpdateInfo(update);
      } catch (error) {
        console.warn("Version check failed:", error.message);
      }
    };

    if (isNativeAndroidApp()) {
      bootstrap();
    }

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    registerNativePushForUser(user).catch((error) => {
      console.warn("Push registration skipped:", error.message);
    });
  }, [user]);

  return (
    <>
      {isNativeAndroidApp() && !isOnline && (
        <div style={s.offlineBar}>
          You are offline. Some data may not be up to date.
        </div>
      )}
      {notification && <Toast message={notification.message} onClose={() => setNotification(null)} />}
      <UpdateAvailableModal update={updateInfo} onClose={() => setUpdateInfo(null)} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PortalHome />} />
          <Route path="/head" element={<Login />} />
          <Route path="/login" element={<Navigate to="/head" replace />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>} />
          <Route path="/teacher/*" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>} />
          <Route path="/student/*" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppContent />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const s = {
  offlineBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10030,
    background: "#111827",
    color: "#fff",
    textAlign: "center",
    padding: "10px 14px",
    fontSize: "0.82rem",
    fontWeight: "700"
  }
};
