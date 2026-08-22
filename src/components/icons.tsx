export function IconChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
      {dir === "left" ? (
        <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2.2" />
      ) : (
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" />
      )}
    </svg>
  );
}

export function IconKick() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export function IconShop() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 20V12h6v8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconReload() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.2-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconGun() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <rect x="3" y="10" width="14" height="5" rx="1" fill="currentColor" />
      <rect x="16" y="11" width="5" height="3" fill="currentColor" />
      <rect x="6" y="15" width="3" height="5" fill="currentColor" />
    </svg>
  );
}

export function IconPatch() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <rect x="4" y="10" width="16" height="4" fill="currentColor" />
      <rect x="10" y="4" width="4" height="16" fill="currentColor" />
    </svg>
  );
}
