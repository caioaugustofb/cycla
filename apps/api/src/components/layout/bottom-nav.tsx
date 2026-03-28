"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, BarChart2, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/tasks", label: "Tarefas", icon: CheckSquare },
  { href: "/progress", label: "Progresso", icon: BarChart2 },
  { href: "/settings", label: "Config", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-border">
      <div className="flex justify-around items-center max-w-md mx-auto px-4 py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
