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
  AddCartItemInput,
  AuthTokenResponse,
  AuthUserResponse,
  CartResponse,
  UpdateCartItemInput,
  addCartItem as addCartItemRequest,
  fetchCurrentUser,
  fetchCart,
  logout as logoutRequest,
  removeCartItem,
  updateCartItem,
} from "@/lib/api";

type ProvidersProps = {
  children: ReactNode;
};

const AUTH_TOKEN_STORAGE_KEY = "datapulse-auth-token";
const CART_TOKEN_STORAGE_KEY = "datapulse-cart-token";

type AuthContextValue = {
  token: string | null;
  user: AuthUserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  applyAuth: (response: AuthTokenResponse) => void;
  logout: () => Promise<void>;
};

type CartContextValue = {
  cart: CartResponse | null;
  cartToken: string | null;
  itemCount: number;
  isLoading: boolean;
  refreshCart: () => Promise<CartResponse>;
  addItem: (payload: AddCartItemInput) => Promise<CartResponse>;
  updateItem: (itemId: string, payload: UpdateCartItemInput) => Promise<CartResponse>;
  removeItem: (itemId: string) => Promise<CartResponse>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const CartContext = createContext<CartContextValue | null>(null);

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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartToken, setCartToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const savedCartToken = window.localStorage.getItem(CART_TOKEN_STORAGE_KEY);

      setToken(savedToken);
      setCartToken(savedCartToken);
      setIsLoading(Boolean(savedToken));
      setIsCartLoading(Boolean(savedCartToken || savedToken));
      setHasHydratedStorage(true);
    });
  }, []);

  const persistCart = useCallback((nextCart: CartResponse | null) => {
    if (nextCart?.cart_token) {
      window.localStorage.setItem(CART_TOKEN_STORAGE_KEY, nextCart.cart_token);
      setCartToken(nextCart.cart_token);
    } else {
      window.localStorage.removeItem(CART_TOKEN_STORAGE_KEY);
      setCartToken(null);
    }
    setCart(nextCart);
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    async function hydrateCart() {
      if (!hasHydratedStorage) {
        return;
      }

      const cartAccessToken = user?.customer ? token : null;

      if (!cartAccessToken && !cartToken) {
        if (!cancelled) {
          setCart((currentCart) => (currentCart?.cart_token ? currentCart : null));
          setIsCartLoading(false);
        }
        return;
      }

      try {
        const nextCart = await fetchCart({ token: cartAccessToken, cartToken });
        if (cancelled) {
          return;
        }
        persistCart(nextCart);
      } catch {
        if (cancelled) {
          return;
        }
        if (!cartAccessToken) {
          window.localStorage.removeItem(CART_TOKEN_STORAGE_KEY);
          setCartToken(null);
        }
        setCart(null);
      } finally {
        if (!cancelled) {
          setIsCartLoading(false);
        }
      }
    }

    void hydrateCart();

    return () => {
      cancelled = true;
    };
  }, [cartToken, hasHydratedStorage, persistCart, token, user?.customer]);

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
    setCart(null);
    if (!activeToken) {
      return;
    }
    try {
      await logoutRequest(activeToken);
    } catch {
      // Frontend logout still succeeds even if the stateless token endpoint cannot be reached.
    }
  }, [token]);

  const refreshCart = useCallback(async () => {
    setIsCartLoading(true);
    try {
      const cartAccessToken = user?.customer ? token : null;
      const nextCart = await fetchCart({ token: cartAccessToken, cartToken });
      persistCart(nextCart);
      return nextCart;
    } finally {
      setIsCartLoading(false);
    }
  }, [cartToken, persistCart, token, user?.customer]);

  const addItem = useCallback(
    async (payload: AddCartItemInput) => {
      setIsCartLoading(true);
      try {
        const cartAccessToken = user?.customer ? token : null;
        const nextCart = await addCartItemRequest({ token: cartAccessToken, cartToken }, payload);
        persistCart(nextCart);
        return nextCart;
      } finally {
        setIsCartLoading(false);
      }
    },
    [cartToken, persistCart, token, user?.customer],
  );

  const updateItem = useCallback(
    async (itemId: string, payload: UpdateCartItemInput) => {
      setIsCartLoading(true);
      try {
        const cartAccessToken = user?.customer ? token : null;
        const nextCart = await updateCartItem({ token: cartAccessToken, cartToken }, itemId, payload);
        persistCart(nextCart);
        return nextCart;
      } finally {
        setIsCartLoading(false);
      }
    },
    [cartToken, persistCart, token, user?.customer],
  );

  const removeItemFromCart = useCallback(
    async (itemId: string) => {
      setIsCartLoading(true);
      try {
        const cartAccessToken = user?.customer ? token : null;
        const nextCart = await removeCartItem({ token: cartAccessToken, cartToken }, itemId);
        persistCart(nextCart);
        return nextCart;
      } finally {
        setIsCartLoading(false);
      }
    },
    [cartToken, persistCart, token, user?.customer],
  );

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
  const cartValue = useMemo<CartContextValue>(
    () => ({
      cart,
      cartToken,
      itemCount: cart?.item_count ?? 0,
      isLoading: isCartLoading,
      refreshCart,
      addItem,
      updateItem,
      removeItem: removeItemFromCart,
    }),
    [addItem, cart, cartToken, isCartLoading, refreshCart, removeItemFromCart, updateItem],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
      </AuthContext.Provider>
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

export function useCart() {
  const value = useContext(CartContext);
  if (value === null) {
    throw new Error("useCart must be used inside Providers.");
  }
  return value;
}
