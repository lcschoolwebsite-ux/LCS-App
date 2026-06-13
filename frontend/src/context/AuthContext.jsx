import { createContext, useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import api, { clearAuthToken, setAuthToken } from "../api/axios";
import {
  clearStudentSessionMarker,
  getActiveStudentProfile
} from "../services/studentSessions";

export const AuthContext = createContext(null);

const applyAuthSession = ({ token, user }) => {
  if (token) {
    setAuthToken(token);
    localStorage.setItem("token", token);
  }

  return user || null;
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      const restoreNativeStudentSession = async () => {
        if (Capacitor.getPlatform() !== "android" || !Capacitor.isNativePlatform()) {
          setLoading(false);
          return;
        }

        try {
          const activeProfile = await getActiveStudentProfile();
          if (!activeProfile?.token || !activeProfile?.user) {
            setLoading(false);
            return;
          }

          setUser(applyAuthSession({ token: activeProfile.token, user: activeProfile.user }));
        } catch (_) {
          // If the quick-login cache is unavailable, fall back to the login screen.
        } finally {
          setLoading(false);
        }
      };

      restoreNativeStudentSession();
      return;
    }
    setAuthToken(token);
    api.get("/auth/me")
      .then(r => setUser(r.data))
      .catch(() => {
        clearAuthToken();
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (role, username, password) => {
    const { data } = await api.post("/auth/login", { 
      role, 
      username, 
      password 
    });
    setUser(applyAuthSession(data));
    return data;
  };

  const restoreSession = async ({ token, user: nextUser }) => {
    setUser(applyAuthSession({ token, user: nextUser }));
    return nextUser || null;
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem("token");
    Preferences.remove({ key: "lcs.student.session" }).catch(() => {});
    clearStudentSessionMarker().catch(() => {});
    setUser(null);
  };

  const updateUser = nextUser => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}
