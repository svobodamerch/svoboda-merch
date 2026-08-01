import { MOCKUP_VIEWBOX } from "@/lib/constructor-products";

type Props = {
  fill?: string;
  className?: string;
};

/**
 * Плейсхолдер-макет: плоский силуэт футболки (перед), не фото.
 * Заменить на реальное предметное фото, когда оно будет — координаты
 * printZone в constructor-products.ts придётся подогнать под него заново.
 */
export function TshirtMockupSvg({ fill = "#ffffff", className }: Props) {
  return (
    <svg
      viewBox={`0 0 ${MOCKUP_VIEWBOX.width} ${MOCKUP_VIEWBOX.height}`}
      className={className}
      role="img"
      aria-label="Макет футболки"
    >
      <path
        d="M230,60 L150,60 L40,130 L95,235 L150,200 L130,580 L390,580 L370,200 L425,235 L480,130 L370,60 L290,60 Q260,90 230,60 Z"
        fill={fill}
        stroke="var(--color-line)"
        strokeWidth={3}
      />
      <path
        d="M230,60 Q260,90 290,60"
        fill="none"
        stroke="var(--color-line)"
        strokeWidth="3"
      />
    </svg>
  );
}
