type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  const maxWidth = align === "center" ? "max-w-2xl" : "max-w-xl";

  return (
    <div className={`${alignClass} ${maxWidth}`}>
      {eyebrow && (
        <p
          className={`mb-3 text-xs font-medium uppercase tracking-[0.2em] ${
            dark ? "text-paper/60" : "text-muted"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-heading text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-[2.75rem] ${
          dark ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed md:text-lg ${
            dark ? "text-paper/75" : "text-muted"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
