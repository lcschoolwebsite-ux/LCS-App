import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";

export const SocketContext = createContext(null);

const socketURL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      const newSocket = io(socketURL, {
        auth: { token }
      });
      setSocket(newSocket);
      return () => newSocket.close();
    } else {
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
