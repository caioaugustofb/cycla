import { Button } from "@/src/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <section className="py-20 flex flex-col items-center gap-3">
        <span className="text-6xl">🌸</span>
        <h1 className="text-4xl font-bold text-primary font-sans">Cycla</h1>
        <p className="text-light text-lg">
          Sua rotina em harmonia com seu ciclo
        </p>
        <Button>Começar agora!</Button>
      </section>
      
    </main>
  );
}
