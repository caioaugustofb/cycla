interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variants = {
  default: "bg-bg-pink text-primary",
  success: "bg-accent-light text-accent",
  warning: "bg-yellow-200 text-warning",
  danger: "bg-primary text-white",
};

export function Badge({
  children,
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${variants[variant]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
