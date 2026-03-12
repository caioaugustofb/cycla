import { BottomNav } from "@/src/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <main className="pb-20 max-w-md mx-auto px-5">{children}</main>

      <BottomNav />
    </div>
  );
}
