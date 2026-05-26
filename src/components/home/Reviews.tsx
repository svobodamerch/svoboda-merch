import { reviewCount, reviews } from "@/lib/home-data";
import { Container } from "@/components/ui/Container";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} из 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rating ? "text-accent" : "text-line"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function Reviews() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Отзывы
            </p>
            <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight md:text-4xl">
              Нам доверяют{" "}
              <span className="text-accent">{reviewCount}+</span> клиентов
            </h2>
          </div>
          <p className="text-sm text-muted">Средняя оценка — 4.9 из 5</p>
        </div>

        <div className="scrollbar-hide -mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:-mx-10 md:mt-14 md:gap-6 md:px-10">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="w-[min(85vw,340px)] shrink-0 snap-start rounded-3xl border border-line bg-cream p-6 md:w-[360px] md:p-8"
            >
              <Stars rating={review.rating} />
              <p className="mt-4 text-sm leading-relaxed text-ink-soft md:text-base">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-medium text-ink">{review.author}</p>
                <p className="mt-0.5 text-xs text-muted">{review.role}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
