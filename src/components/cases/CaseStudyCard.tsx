import Image from "next/image";
import Link from "next/link";
import { layoutGridClass, type CaseStudy } from "@/lib/cases";

type CaseStudyCardProps = {
  study: CaseStudy;
};

export function CaseStudyCard({ study }: CaseStudyCardProps) {
  return (
    <article
      tabIndex={0}
      className={`group relative overflow-hidden rounded-3xl bg-ink outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${layoutGridClass[study.layout]}`}
    >
      <Image
        src={study.image}
        alt=""
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
      />

      {/* Default info strip — visible until hover on desktop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10 md:transition-opacity md:duration-500 md:group-hover:opacity-0" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:transition-opacity md:duration-500 md:group-hover:opacity-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block border border-paper/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-paper/80">
              {study.type}
            </span>
            <p className="mt-3 font-heading text-lg font-medium text-paper md:text-xl">
              {study.client}
            </p>
          </div>
          <span className="shrink-0 font-heading text-sm font-medium text-accent">
            {study.metric}
          </span>
        </div>
        <Link
          href={`/cases#${study.slug}`}
          className="mt-4 inline-flex items-center gap-2 text-sm text-paper/80 transition-colors hover:text-paper md:hidden"
        >
          Смотреть кейс
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Hover / focus reveal — desktop */}
      <div className="absolute inset-0 hidden flex-col justify-end bg-ink/92 p-6 md:flex md:translate-y-4 md:opacity-0 md:transition-all md:duration-500 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
        <span className="inline-block w-fit border border-paper/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-paper/70">
          {study.type}
        </span>
        <p className="mt-4 font-heading text-xl font-medium text-paper md:text-2xl">
          {study.client}
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/65">
          {study.task}
        </p>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-paper/10 pt-6">
          <span className="font-heading text-sm font-medium text-accent">
            {study.metric}
          </span>
          <Link
            href={`/cases#${study.slug}`}
            className="inline-flex items-center gap-2 border border-paper/30 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink"
          >
            Смотреть кейс
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
