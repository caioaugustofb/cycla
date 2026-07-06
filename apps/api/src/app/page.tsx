import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Moon } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <section className="py-20 flex flex-col items-center gap-3">
        <div className="bg-primary/10 p-4 rounded-2xl">
          <Moon size={40} className="text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-primary font-sans">Cycla</h1>
        <p className="text-light text-lg">
          Sua rotina em harmonia com seu ciclo
        </p>
        <Button asChild>
          <Link href="/register">Começar agora!</Link>
        </Button>
      </section>
    </main>
  );
}
