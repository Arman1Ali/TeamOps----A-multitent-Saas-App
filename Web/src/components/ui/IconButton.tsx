import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "default" | "quiet";
};

export function IconButton({
  children,
  className = "",
  variant = "default",
  ...props
}: IconButtonProps) {
  const variantClasses = variant === "quiet"
    ? "border-transparent bg-transparent hover:bg-slate-100"
    : "border-slate-200 bg-white hover:border-indigo-200";

  return (
    <button
      type="button"
      className={`inline-grid size-[34px] flex-none place-items-center rounded-[9px] border text-slate-500 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
