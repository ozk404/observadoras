"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Logout } from "./private-forms";

export function HeaderAccount({
  username,
  fullName,
}: {
  username: string;
  fullName?: string | null;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById("header-account-slot"));
  }, []);
  if (!target) return null;
  return createPortal(
    <span className="header-account">
      <Link
        href="/equipo"
        aria-label={`Cuenta: ${username}${fullName ? ` · ${fullName}` : ""}`}
        title={fullName || username}
      >
        {fullName || username}
      </Link>
      <Logout />
    </span>,
    target,
  );
}
