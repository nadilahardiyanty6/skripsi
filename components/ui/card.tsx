import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "glass" | "solid";
};

export function Card({ className = "", variant = "glass", ...props }: CardProps) {
  const style =
    variant === "glass"
      ? "rounded-3xl border border-black/5 bg-white/70 backdrop-blur"
      : "rounded-3xl border border-black/5 bg-white";

  return <div className={`${style} ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pb-3 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-lg font-semibold ${className}`} {...props} />;
}

export function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-black/60 ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
}

export function CardFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
}
