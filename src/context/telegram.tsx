"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

export interface TwaUser {
  id: string;
  name: string;
  avatar: string | null;
  telegramId: string | null;
}

type LoginStatus = "idle" | "waiting" | "expired" | "error";

interface TelegramContextType {
  user: TwaUser | null;
  token: string | null;
  isLoading: boolean;
  needsTelegramLogin: boolean;
  loginStatus: LoginStatus;
  startTelegramLogin: () => Promise<void>;
  setUser: (user: TwaUser | null) => void;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  token: null,
  isLoading: true,
  needsTelegramLogin: false,
  loginStatus: "idle",
  startTelegramLogin: async () => {},
  setUser: () => {},
});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TwaUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsTelegramLogin, setNeedsTelegramLogin] = useState(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const blockImageContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", blockImageContextMenu);
    return () => {
      document.removeEventListener("contextmenu", blockImageContextMenu);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = localStorage.getItem("twa_token");
        if (storedToken) {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setToken(storedToken);
            setIsLoading(false);
            return;
          }
          localStorage.removeItem("twa_token");
        }

        const isNativeApp = Capacitor.isNativePlatform();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tg = (window as any).Telegram?.WebApp;
        if (!tg) {
          if (isNativeApp) setNeedsTelegramLogin(true);
          setIsLoading(false);
          return;
        }

        tg.ready();
        tg.expand();
        tg.setBackgroundColor?.("#ffffff");
        tg.setHeaderColor?.("#ffffff");

        const startParam: string | undefined = tg.initDataUnsafe?.start_param;
        if (startParam?.startsWith("listing_")) {
          router.replace(`/listings/${startParam.slice("listing_".length)}`);
        } else if (startParam?.startsWith("seller_")) {
          router.replace(`/sellers/${startParam.slice("seller_".length)}`);
        }

        const initData = tg.initData;
        if (!initData) {
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("twa_token", data.token);
          setUser(data.user);
          setToken(data.token);
        }
      } catch (err) {
        console.error("Telegram auth error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const startTelegramLogin = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setLoginStatus("waiting");

    try {
      const createRes = await fetch("/api/auth/login-session", { method: "POST" });
      if (!createRes.ok) {
        setLoginStatus("error");
        return;
      }
      const { sessionId, deepLink } = await createRes.json();

      window.open(deepLink, "_blank");

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/auth/login-session/${sessionId}`);
          const data = await pollRes.json();

          if (data.status === "confirmed") {
            clearInterval(pollRef.current!);
            localStorage.setItem("twa_token", data.token);
            setUser(data.user);
            setToken(data.token);
            setNeedsTelegramLogin(false);
            setLoginStatus("idle");
          } else if (data.status === "expired" || data.status === "not_found") {
            clearInterval(pollRef.current!);
            setLoginStatus("expired");
          }
        } catch {
          // keep polling, transient network errors are fine
        }
      }, 2000);
    } catch (err) {
      console.error("Telegram login session error:", err);
      setLoginStatus("error");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <TelegramContext.Provider
      value={{ user, token, isLoading, needsTelegramLogin, loginStatus, startTelegramLogin, setUser }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export const useTelegram = () => useContext(TelegramContext);
