import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "[СВОБОДА]* — кабинет",
  robots: { index: false, follow: false },
};

/**
 * Тот же читаемый стиль, что у публичной сверки: Inter, обычный регистр,
 * крупнее для телефона. Шапку и подвал сайта прячем стилем, а не по
 * pathname: на crm.svoboda.site/<slug> адрес переписан middleware, и
 * usePathname в шапке видит /<slug>, а не /portal/<slug>.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="crm crm-public min-h-screen bg-bg">
      <style>{`.site-chrome{display:none!important}`}</style>
      {children}
    </div>
  );
}
