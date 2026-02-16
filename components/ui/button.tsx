"use client";

import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition " +
  "focus:outline-none focus:ring-2 focus:ring-[#FF85A2]/40 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-[#FF85A2] text-white hover:opacity-95 shadow-sm",
  secondary: "bg-[#FFF5F7] text-[#4A0E1C] hover:bg-black/5 border border-black/5",
  ghost: "bg-transparent text-[#4A0E1C] hover:bg-black/5",
  outline: "bg-white text-[#4A0E1C] border border-black/10 hover:bg-black/5",
  danger: "bg-[#B42318] text-white hover:opacity-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white"
      aria-hidden="true"
    />
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", size = "md", fullWidth, isLoading, children, disabled, ...props },
  ref
) {
  const w = fullWidth ? "w-full" : "";
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${w} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
});
