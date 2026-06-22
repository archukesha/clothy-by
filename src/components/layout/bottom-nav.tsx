"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, PlusCircle, User, MessageCircle } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Главная" },
  { href: "/favorites", icon: Heart, label: "Избранное" },
  { href: "/listings/new", icon: PlusCircle, label: "Продать" },
  { href: "/messages", icon: MessageCircle, label: "Сообщения" },
  { href: "/profile", icon: User, label: "Профиль" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-neutral-200 bg-white"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
    >
      <div className="flex bg-white">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors active:scale-90 ${
                active ? "text-black" : "text-neutral-400"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
