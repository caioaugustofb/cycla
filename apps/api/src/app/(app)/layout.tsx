import { BottomNav } from "@/src/components/layout/bottom-nav";
import { AppSidebar } from "@/src/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/src/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* Sidebar — visível apenas no desktop */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Conteúdo principal */}
      <SidebarInset>
        <main className="min-h-screen pb-20 md:pb-8 px-5 md:px-12 max-w-2xl mx-auto md:max-w-none md:mx-0">
          {children}
        </main>
      </SidebarInset>

      {/* Bottom nav — visível apenas no mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
