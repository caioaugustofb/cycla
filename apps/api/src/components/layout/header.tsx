export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border px-5 py-4">
      <h1 className="text-lg font-semibold text-dark">{title}</h1>
    </header>
  );
}
