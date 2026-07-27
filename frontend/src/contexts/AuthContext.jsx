/* eslint-disable */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

// Guest user shown by default
const GUEST = {
  user_id: "guest",
  name: "Guest",
  user_tag: null,
  picture: null,
  is_guest: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = real, missing = guest
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(null); // null | "signin" | "signup"
  const [suspended, setSuspended] = useState(null); // null | { until, reason }

  const refresh = useCallback(async () => {
    try {
      const r = await api.get("/auth/status");
      if (r.data?.suspended) {
        setSuspended(r.data);
        setUser(null);
        return;
      }
      if (r.data?.user) {
        setUser(r.data.user);
        setSuspended(null);
      } else {
        setUser(null);
        setSuspended(null);
      }
    } catch {
      setUser(null);
      setSuspended(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_e) {}
    setUser(null);
    setSuspended(null);
  };

  const loginWithGoogle = () => {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const loginEmail = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    setUser(r.data.user);
    setSuspended(null);
    return r.data.user;
  };

  const registerEmail = async (email, password, name) => {
    const r = await api.post("/auth/register", { email, password, name });
    setUser(r.data.user);
    setSuspended(null);
    return r.data.user;
  };

  const openAuth = (mode = "signin") => setAuthModal(mode);
  const closeAuth = () => setAuthModal(null);

  const guestOrUser = user || GUEST;

  return (
    <AuthContext.Provider
      value={{
        user, // null if guest
        guestOrUser, // always defined
        setUser,
        loading,
        suspended,
        refresh,
        loginWithGoogle,
        loginEmail,
        registerEmail,
        logout,
        authModal,
        openAuth,
        closeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
