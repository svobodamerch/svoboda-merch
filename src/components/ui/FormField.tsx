import { type ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-accent" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type FieldControlProps = {
  hasError?: boolean;
  className?: string;
};

export const fieldControlClass = ({
  hasError = false,
  className = "",
}: FieldControlProps = {}) =>
  `w-full rounded-2xl border bg-paper px-4 py-3.5 text-sm text-ink outline-none transition-colors duration-200 placeholder:text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent/30 ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-line hover:border-ink/20"
  } ${className}`;
