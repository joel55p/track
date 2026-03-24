import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import client, { setAuthToken } from "@/api/client";
import type { UserPublic } from "@/api/types";

const STORAGE_KEY = "tp_track_token";

interface AuthState {
  token: string | null;
  user: UserPublic | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(!!token);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setAuthToken(token);
    const { data } = await client.get<UserPublic>("/api/auth/me");
    setUser(data);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      refreshMe().catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
        setAuthToken(null);
        setLoading(false);
      });
    } else {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
    }
  }, [token, refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await client.post<{
      access_token: string;
      user: UserPublic;
    }>("/api/auth/login", { email, password });
    localStorage.setItem(STORAGE_KEY, data.access_token);
    setToken(data.access_token);
    setAuthToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, login, logout, refreshMe }),
    [token, user, loading, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
