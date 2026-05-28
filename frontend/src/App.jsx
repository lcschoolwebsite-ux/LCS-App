import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import StudentLogin from "./pages/StudentLogin";
import AdminLayout from "./layouts/AdminLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import StudentLayout from "./layouts/StudentLayout";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { useSocket } from "./context/useSocket";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast from "./components/Toast";

function AppContent() {
  const socket = useSocket();
  const [notification, setNotification] = useState(null);

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

  return (
    <>
      {notification && <Toast message={notification.message} onClose={() => setNotification(null)} />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>} />
        <Route path="/teacher/*" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>} />
        <Route path="/student/*" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>} />
      </Routes>
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
