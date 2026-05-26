import { Button } from "@/components/ui/Button";

type CasesEmptyStateProps = {
  onReset: () => void;
};

export function CasesEmptyState({ onReset }: CasesEmptyStateProps) {
  return (
    <div
      className="col-span-12 flex flex-col items-center rounded-3xl border border-line bg-surface px-6 py-20 text-center md:py-28"
      role="status"
    >
      <span className="font-heading text-5xl font-medium text-line" aria-hidden>
        ∅
      </span>
      <h2 className="mt-6 font-heading text-2xl font-medium tracking-tight text-ink">
        Нет кейсов в этой категории
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Попробуйте другой фильтр или посмотрите все проекты — возможно, скоро
        здесь появится новый кейс.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={onReset}
        className="mt-8"
      >
        Показать все кейсы
      </Button>
    </div>
  );
}
