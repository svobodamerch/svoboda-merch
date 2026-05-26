"use client";

import { useMemo, useState } from "react";
import {
  allCaseStudies,
  CASE_FILTERS,
  filterCaseStudies,
  type CaseStudyFilter,
} from "@/lib/cases";
import { CaseStudyCard } from "@/components/cases/CaseStudyCard";
import { CasesEmptyState } from "@/components/cases/CasesEmptyState";
import { CasesFilter } from "@/components/cases/CasesFilter";
import { Container } from "@/components/ui/Container";

export function CasesPageContent() {
  const [activeFilter, setActiveFilter] = useState<CaseStudyFilter>("all");

  const counts = useMemo(() => {
    const result = {} as Record<CaseStudyFilter, number>;
    for (const filter of CASE_FILTERS) {
      result[filter.value] = filterCaseStudies(allCaseStudies, filter.value).length;
    }
    return result;
  }, []);

  const filteredStudies = useMemo(
    () => filterCaseStudies(allCaseStudies, activeFilter),
    [activeFilter],
  );

  return (
    <Container className="pb-24 md:pb-32">
      <CasesFilter
        active={activeFilter}
        onChange={setActiveFilter}
        counts={counts}
      />

      <div
        className="mt-10 grid grid-cols-12 gap-4 md:mt-14 md:gap-6"
        role="tabpanel"
        aria-live="polite"
        aria-label="Список кейсов"
      >
        {filteredStudies.length === 0 ? (
          <CasesEmptyState onReset={() => setActiveFilter("all")} />
        ) : (
          filteredStudies.map((study) => (
            <CaseStudyCard key={study.id} study={study} />
          ))
        )}
      </div>
    </Container>
  );
}
