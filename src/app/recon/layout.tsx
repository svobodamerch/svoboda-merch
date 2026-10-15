import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Сверка взаиморасчётов",
  robots: { index: false, follow: false },
};

export default function ReconLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-10">{children}</div>;
}
