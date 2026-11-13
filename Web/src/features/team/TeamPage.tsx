/**
 * The Team screen: everybody in this workspace, and what may be done about them.
 *
 * This module belongs to the TEAM feature (src/features/team).
 *
 * The Vite version of this file drew a hardcoded "8 teammates online" banner,
 * fake "Online" dots, and a project name taken from whether the row index was
 * even. None of that exists in the API, so all of it is gone. What replaces it
 * is counted from the rows already loaded by useWorkspace():
 *
 *   * whose name is on how many open tasks - from the task list;
 *   * which projects they appear in - from the same tasks' projects;
 *   * who may invite, change a role or remove somebody - from the signed-in
 *     person's role, through the mirrors of the server's checks in
 *     lib/auth/permissions.ts.
 *
 * There is no presence or "online" data in the backend, so there is no presence
 * indicator here. Showing a green dot that means nothing is how a dashboard
 * teaches people to ignore it.
 */

"use client";

import { BriefcaseBusiness, CircleUser, Ellipsis, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignedOutRedirect } from "@/app/SignedOutRedirect";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { mayInvite, mayManageWorkspace } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/http";
import type { ApiUserRole } from "@/types/api";
import type { TeamMember } from "@/types/ui";
import { InviteTeammateDialog } from "./InviteTeammateDialog";

/** The label a role switcher shows for each of the API's three roles. */
const ROLE_LABELS: Record<ApiUserRole, string> = {
  member: "Member",
  admin: "Admin",
  owner: "Owner",
};

export function TeamPage() {
  const { status, user } = useAuth();
  const { members, tasks, apiUsers, isLoading, error, reload, changeRole, dropMember } = useWorkspace();
  const { notify } = useUi();

  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  // Two facts per person, worked out from the task list the provider already
  // holds. Doing this in one pass over `tasks` rather than inside each tile
  // keeps it one loop for the whole team instead of one per member.
  const work = useMemo(() => {
    const open = new Map<number, number>();
    const projects = new Map<number, Set<string>>();

    for (const task of tasks) {
      const who = task.assigneeId;
      if (who === null) continue;

      if (!task.completed) open.set(who, (open.get(who) ?? 0) + 1);

      const names = projects.get(who) ?? new Set<string>();
      names.add(task.project);
      projects.set(who, names);
    }

    return { open, projects };
  }, [tasks]);

  if (status === "signed-out") return <SignedOutRedirect />;
  if (isLoading) return <LoadingState rows={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const canInvite = mayInvite(user?.role);
  const canManage = mayManageWorkspace(user?.role);

  // Only the roles this person is allowed to hand out. The server refuses an
  // admin who makes somebody an owner, so the option is not offered at all.
  const grantableRoles: ApiUserRole[] = user?.role === "owner"
    ? ["member", "admin", "owner"]
    : ["member", "admin"];

  const unclaimed = tasks.filter((task) => task.assigneeId === null && !task.completed).length;

  async function handleRole(member: TeamMember, role: ApiUserRole) {
    try {
      await changeRole(member.id, role);
      notify(`${member.name} is now ${ROLE_LABELS[role].toLowerCase()}.`, "success");
    } catch (cause) {
      // The server's own sentence, which is usually more useful than "failed":
      // "Only the workspace owner can…" tells the reader what to do next.
      notify(
        cause instanceof ApiError
          ? cause.detail
          : "Could not reach the server. Check that the API is running.",
        "error",
      );
    }
  }

  return (
    <>
      <SectionHeading
        eyebrow={user?.company?.name?.toUpperCase() ?? "YOUR WORKSPACE"}
        title="Team"
        description={
          canInvite
            ? `${members.length} in this workspace.`
            : `${members.length} in this workspace. Only an owner or admin can invite or remove people.`
        }
        action={canInvite ? "Invite teammate" : undefined}
        onAction={canInvite ? () => setInviting(true) : undefined}
      />

      <div className="my-5 flex flex-wrap items-center gap-2.5 rounded-[13px] border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-3.5">
        <span className="grid size-9 flex-none place-items-center rounded-xl bg-indigo-100 text-brand sm:size-[42px]">
          <BriefcaseBusiness size={21} />
        </span>
        <div className="min-w-0">
          <strong className="text-[10px] sm:text-xs">
            {apiUsers.filter((person) => person.role === "owner" || person.role === "admin").length} of{" "}
            {members.length} can manage the workspace
          </strong>
          <p className="m-0 mt-1 text-[9px] text-slate-500 sm:text-[10px]">
            {unclaimed === 0
              ? "Every open task has somebody's name on it."
              : `${unclaimed} open task${unclaimed === 1 ? "" : "s"} still have nobody assigned.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => {
          const apiUser = apiUsers.find((person) => person.id === member.id);
          const held = work.open.get(member.id) ?? 0;
          const inProjects = [...(work.projects.get(member.id) ?? [])];

          return (
            <article
              key={member.id}
              className="relative flex min-h-[185px] flex-col items-center rounded-[13px] border border-slate-200 bg-white px-3 py-5 text-center shadow-card"
            >
              {/* The menu only appears when there is something in it to do, so
                  a member looking at a teammate sees a tile rather than a
                  button that would answer 403. */}
              {canManage && !member.isSelf && (
                <Menu label={`More options for ${member.name}`} icon={<Ellipsis size={19} />}>
                  <MenuItem
                    icon={<CircleUser size={14} />}
                    label={`See their tasks (${held})`}
                    href={`/tasks?assignee=${member.id}`}
                  />
                  {grantableRoles
                    .filter((role) => role !== apiUser?.role)
                    .map((role) => (
                      <MenuItem
                        key={role}
                        icon={<ShieldCheck size={14} />}
                        label={`Make ${role}`}
                        onClick={() => void handleRole(member, role)}
                      />
                    ))}
                  <MenuItem
                    icon={<Trash2 size={14} />}
                    label="Remove from workspace"
                    tone="danger"
                    onClick={() => setRemoving(member)}
                  />
                </Menu>
              )}

              <Avatar initials={member.initials} className={member.avatar} size="large" />

              <h3 className="mb-0 mt-2.5 max-w-full truncate text-[11px] font-bold">{member.name}</h3>
              <p className="m-0 mt-1 max-w-full truncate text-[9px] text-slate-500">{member.email}</p>

              <div className="mt-3.5 inline-flex items-center gap-1 text-[9px] text-slate-500">
                <BriefcaseBusiness size={14} />
                {inProjects.length === 0
                  ? "No tasks yet"
                  : inProjects.length === 1
                    ? inProjects[0]
                    : `${inProjects[0]} +${inProjects.length - 1}`}
              </div>

              <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                {member.roleLabel}
                {member.isSelf && <span className="text-slate-400">· you</span>}
              </span>

              <p className="m-0 mt-2 text-[9px] text-slate-500">
                {held === 0 ? "Nothing open" : `${held} open task${held === 1 ? "" : "s"}`}
              </p>
            </article>
          );
        })}

        {canInvite && (
          <button
            type="button"
            className="flex min-h-[185px] flex-col items-center justify-center gap-2 rounded-[13px] border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-brand"
            onClick={() => setInviting(true)}
          >
            <span className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white">
              <UserPlus size={20} />
            </span>
            <strong className="text-[10px]">Invite a teammate</strong>
            <small className="text-[9px] text-slate-400">They join this workspace</small>
          </button>
        )}

        {members.length === 0 && (
          <EmptyState
            message="This workspace has nobody in it but you."
            action={canInvite ? "Invite a teammate" : undefined}
            onAction={canInvite ? () => setInviting(true) : undefined}
          />
        )}
      </div>

      {inviting && <InviteTeammateDialog onClose={() => setInviting(false)} />}

      {removing && (
        <ConfirmDialog
          titleId="remove-member-title"
          heading={`Remove ${removing.name} from the workspace?`}
          consequence={`Their ${work.open.get(removing.id) ?? 0} open task(s) are not deleted - the API puts them back in the unassigned pile, and their sign-in stops working. This cannot be undone.`}
          confirmLabel="Remove teammate"
          // The same reason ProjectsPage says so after a delete: the tile
          // vanishing proves the click worked, and the sentence that follows
          // says what the server did to their work, which is not visible here.
          onConfirm={async () => {
            const held = work.open.get(removing.id) ?? 0;
            await dropMember(removing.id);
            notify(
              `${removing.name} removed${held ? `. ${held} task(s) are now unassigned.` : "."}`,
              "success",
            );
          }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </>
  );
}
