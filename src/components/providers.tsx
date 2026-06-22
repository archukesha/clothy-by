"use client";

import { TelegramProvider } from "@/context/telegram";
import { ToastProvider } from "@/components/ui/toast";
import { TelegramLoginGate } from "@/components/telegram-login-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <ToastProvider>
        <TelegramLoginGate>{children}</TelegramLoginGate>
      </ToastProvider>
    </TelegramProvider>
  );
}
