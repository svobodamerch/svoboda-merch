"use client";

import { useLeadModal } from "@/components/ui/LeadModalProvider";

/**
 * Кнопка, открывающая окно заявки. Нужна отдельным клиентским
 * компонентом: страница серверная и обработчик клика в ней жить не может.
 */
export function LeadButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = useLeadModal();

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
