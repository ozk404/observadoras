import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { HeaderAccount } from "@/components/header-account";
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
      <HeaderAccount username={user.username} fullName={user.full_name} />
      {(user.role === "reviewer" || user.can_manage_users) && (
        <TeamNavigation
          reviewer={user.role === "reviewer"}
          canManageUsers={user.can_manage_users}
        />
      )}
      {children}
    </div>
  );
}
