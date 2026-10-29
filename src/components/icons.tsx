export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      style={back ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}
export function Shield() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

export function ObservationIcon({ kind }: { kind: "violence" | "information" | "barrier" }) {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {kind === "violence" ? <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="M12 8v5m0 3h.01" />
      </> : kind === "information" ? <>
        <path d="M20 11V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11l4-3h3M8 8h8" />
        <path d="m17 12 5 9H12l5-9Zm0 4v1m0 2h.01" />
      </> : <>
        <path d="M4 9h16v6H4zM6 15v6m12-6v6M8 9l4 6m2-6 4 6M12 3v3m-6-2 2 2m10-2-2 2" />
      </>}
    </svg>
  );
}
