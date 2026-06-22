"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-neutral-100 mb-4">Ошибка</div>
        <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
        <p className="text-neutral-500 mb-8">Попробуйте обновить страницу.</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4" /> Попробовать снова
          </Button>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4" /> На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
