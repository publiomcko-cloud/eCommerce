"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  AuthTokenResponse,
  AuthUserResponse,
  fetchCurrentUser,
  logout as logoutRequest,
} from "@/lib/api";

type ProvidersProps = {
  children: ReactNode;
};

const AUTH_TOKEN_STORAGE_KEY = "datapulse-auth-token";

type AuthContextValue = {
  token: string | null;
  user: AuthUserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  applyAuth: (response: AuthTokenResponse) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return Boolean(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
  });

  useEffect(() => {
    if (!token) {
      return;
    }
    const activeToken = token;

    let cancelled = false;

    async function hydrateAuth() {
      try {
        const currentUser = await fetchCurrentUser(activeToken);
        if (cancelled) {
          return;
        }
        setUser(currentUser);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateAuth();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const applyAuth = useCallback((response: AuthTokenResponse) => {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    const activeToken = token;
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
    if (!activeToken) {
      return;
    }
    try {
      await logoutRequest(activeToken);
    } catch {
      // Frontend logout still succeeds even if the stateless token endpoint cannot be reached.
    }
  }, [token]);

  const authValue = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      applyAuth,
      logout,
    }),
    [token, user, isLoading, applyAuth, logout],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth must be used inside Providers.");
  }
  return value;
}
