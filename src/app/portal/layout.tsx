import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "[СВОБОДА]* — кабинет",
  robots: { index: false, follow: false },
};

/** Тот же читаемый стиль, что у публичной сверки: Inter, обычный регистр, крупнее для телефона */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <div className="crm crm-public min-h-screen bg-bg">{children}</div>;
}
