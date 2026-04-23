import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/auth";
import {
  listPortalUsers,
  getUnlinkedTeamMembers,
} from "@/lib/actions/users";
import AccessClient from "./access-client";

export default async function AccessPage() {
  const session = await getPortalSession();
  if (!session.isAdmin) redirect("/dashboard");

  const [users, unlinkedTeamMembers] = await Promise.all([
    listPortalUsers(),
    getUnlinkedTeamMembers(),
  ]);

  return (
    <AccessClient
      currentUserId={session.user.id}
      isSuperAdmin={session.isSuperAdmin}
      users={users}
      unlinkedTeamMembers={unlinkedTeamMembers}
    />
  );
}
