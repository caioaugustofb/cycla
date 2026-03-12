"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: "" },
  { href: "/tasks", label: "Tarefas", icon: "" },
  { href: "/progress", label: "Progresso", icon: "" },
  { href: "/settings", label: "Config", icon: "" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border ">
      <div className="flex justify-around items-center max-w-md mx-auto px-4 py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-opacity ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span
                className={`text-[10px] ${isActive ? "font-bold text-dark" : "text-dark"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
