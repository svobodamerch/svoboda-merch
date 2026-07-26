"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { LeadModal } from "@/components/ui/LeadModal";

/**
 * Окно заявки одно на весь сайт, а открывать его нужно из разных мест:
 * из шапки, из прайса, из блока магазина. Поэтому состояние вынесено
 * в контекст — иначе кнопка со страницы не смогла бы достать до модалки.
 */
const Ctx = createContext<{ open: () => void } | null>(null);

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <LeadModal open={isOpen} onClose={() => setIsOpen(false)} />
    </Ctx.Provider>
  );
}

export function useLeadModal() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLeadModal вызван вне LeadModalProvider");
  return c;
}
