import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-neutral-100 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Страница не найдена</h1>
        <p className="text-neutral-500 mb-8">
          Возможно, она была удалена или вы перешли по неверной ссылке
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4" /> На главную
            </Button>
          </Link>
          <Link href="/search">
            <Button>
              <Search className="w-4 h-4" /> К объявлениям
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
