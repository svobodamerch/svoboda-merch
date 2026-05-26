import { trustStrip } from "@/lib/home-data";
import { Container } from "@/components/ui/Container";

export function TrustStrip() {
  return (
    <section className="border-y border-line bg-paper py-10 md:py-12">
      <Container>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {trustStrip.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-snug md:text-base">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
                aria-hidden
              >
                ✓
              </span>
              <span className="text-ink-soft">{item}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
