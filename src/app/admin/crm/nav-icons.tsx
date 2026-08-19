/** Минимальный набор значков для бокового меню — только то, что реально используется */

type IconProps = { className?: string };
const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function IconDashboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="2.5" width="6.5" height="4.5" rx="1.2" />
      <rect x="11" y="9" width="6.5" height="8.5" rx="1.2" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
    </svg>
  );
}

export function IconDeals({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <rect x="2.5" y="6.5" width="15" height="10" rx="1.5" />
      <path d="M7 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 13 5v1.5" />
      <path d="M2.5 11h15" />
    </svg>
  );
}

export function IconTasks({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M6.5 10.2l2 2 4.5-4.8" />
    </svg>
  );
}

export function IconContacts({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <circle cx="7.2" cy="6.5" r="2.7" />
      <path d="M2.3 17c.5-3 2.3-4.7 4.9-4.7s4.4 1.7 4.9 4.7" />
      <circle cx="14.5" cy="7.2" r="2.1" />
      <path d="M13.3 12.5c1.9.2 3.2 1.7 3.7 4.2" />
    </svg>
  );
}

export function IconMoney({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <circle cx="10" cy="10" r="7.3" />
      <path d="M8 6.8h2.6a2 2 0 0 1 0 4H8m0-4v6.4m0-2.4h3.6M8 8.8h3" />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <path d="M5 8a5 5 0 0 1 10 0c0 3.2 1 4.5 1.5 5H3.5C4 12.5 5 11.2 5 8Z" />
      <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" />
    </svg>
  );
}

export function IconChevron({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <path d="M7 5.5 12 10l-5 4.5" />
    </svg>
  );
}

export function IconCollapse({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common}>
      <rect x="2.5" y="3" width="15" height="14" rx="2" />
      <path d="M8 3v14" />
      <path d="M5.3 8l-1.3 2 1.3 2" />
    </svg>
  );
}
