interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline";
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl px-5 py-3 font-semibold transition-colors disabled:opacity-40 ${variant === "primary" ? "bg-primary text-white hover:bg-primary-dark" : "bg-transparent border border-border text-dark"} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
