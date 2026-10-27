"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Logout } from "./private-forms";

export function HeaderAccount({ username }: { username: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById("header-account-slot"));
  }, []);
  if (!target) return null;
  return createPortal(
    <span className="header-account">
      <Link href="/equipo" aria-label={`Cuenta: ${username}`}>
        {username}
      </Link>
      <Logout />
    </span>,
    target,
  );
}
