"use client";

import React from "react";
import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "onDark";
  size?: "md" | "lg";
  className?: string;
};

export const Button = ({
  children,
  href,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
  size = "lg",
  className = "",
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-[40px] font-medium tracking-wide transition-all duration-300";

  const variantStyles = {
    primary:
      "bg-accent text-paper hover:bg-accent/90 border border-accent shadow-sm",
    secondary:
      "bg-paper text-ink border border-line hover:border-ink/30 hover:shadow-sm",
    ghost:
      "bg-transparent text-ink border border-transparent hover:bg-surface",
    onDark: "bg-paper text-ink border border-paper hover:bg-paper/90",
  };

  const sizeStyles = {
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-3.5 text-sm md:text-base",
  };

  const classes = `${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${classes} disabled:pointer-events-none disabled:opacity-50`}
    >
      {children}
    </button>
  );
};
