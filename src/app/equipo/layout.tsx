import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { Logout } from "@/components/private-forms";
import { TeamNavigation } from "@/components/team-navigation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Área privada",
  robots: { index: false, follow: false },
};
export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/ingreso");
  return (
    <div className="wrap page-space">
      <div className="private-bar">
        <Link href="/equipo">
          Área privada /{" "}
          {user.role === "reviewer" ? "Revisión" : "Mis registros"}
        </Link>
        <div>
          <span>{user.username}</span>
          <Logout />
        </div>
      </div>
      {user.role === "reviewer" && <TeamNavigation />}
      {children}
    </div>
  );
}
