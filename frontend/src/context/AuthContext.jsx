import { createContext, useState, useEffect } from "react";
import api, { clearAuthToken, setAuthToken } from "../api/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    api.get("/auth/me")
      .then(r => setUser(r.data))
      .catch(() => {
        clearAuthToken();
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
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const updateUser = nextUser => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
