"use client";

import { useTelegram } from "@/context/telegram";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

function DebugBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] break-all bg-black/90 p-2 text-[10px] text-lime-400">
      {text}
    </div>
  );
}

export function TelegramLoginGate({ children }: { children: React.ReactNode }) {
  const { isLoading, needsTelegramLogin, loginStatus, startTelegramLogin, debugInfo } = useTelegram();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        <DebugBar text={debugInfo} />
      </div>
    );
  }

  if (!needsTelegramLogin) {
    return (
      <>
        {children}
        <DebugBar text={debugInfo} />
      </>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-black">
        <Send className="h-7 w-7 text-white" />
      </div>
      <h1 className="mb-2 text-xl font-bold">Вход через Telegram</h1>
      <p className="mb-6 max-w-xs text-sm text-neutral-500">
        Clothy.by использует Telegram для входа. Нажмите кнопку — откроется бот, подтвердите вход одним
        нажатием и вернитесь сюда.
      </p>

      <Button onClick={startTelegramLogin} disabled={loginStatus === "waiting"} size="lg">
        {loginStatus === "waiting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Ждём подтверждения...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Войти через Telegram
          </>
        )}
      </Button>

      {loginStatus === "expired" && (
        <p className="mt-4 text-sm text-red-500">Время вышло. Попробуйте ещё раз.</p>
      )}
      {loginStatus === "error" && (
        <p className="mt-4 text-sm text-red-500">Не удалось создать сессию входа. Проверьте интернет.</p>
      )}
      {loginStatus === "waiting" && (
        <p className="mt-4 text-xs text-neutral-400">
          Если бот не открылся автоматически, откройте Telegram и нажмите Start вручную.
        </p>
      )}
    </div>
  );
}
