import { CASE_FILTERS, type CaseStudyFilter } from "@/lib/cases";

type CasesFilterProps = {
  active: CaseStudyFilter;
  onChange: (filter: CaseStudyFilter) => void;
  counts: Record<CaseStudyFilter, number>;
};

export function CasesFilter({ active, onChange, counts }: CasesFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Фильтр кейсов по типу"
    >
      {CASE_FILTERS.map((filter) => {
        const isActive = active === filter.value;
        const count = counts[filter.value];

        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.value)}
            className={`inline-flex items-center gap-2 rounded-[40px] px-5 py-2.5 text-sm transition-all duration-300 ${
              isActive
                ? "bg-ink text-paper"
                : "border border-line bg-paper text-muted hover:border-ink/30 hover:text-ink"
            }`}
          >
            {filter.label}
            <span
              className={`text-xs tabular-nums ${
                isActive ? "text-paper/60" : "text-muted/80"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
