/**
 * The server's permission rules, restated for the interface.
 *
 * This module belongs to the AUTH layer (src/lib/auth).
 *
 * The API is the authority; nothing here can grant anything. What it does is
 * keep the buttons on screen honest: an app that shows every action to every
 * person and then answers 403 is a UI that teaches people the interface lies.
 * So each function here mirrors exactly one check in
 * Backend/teamops/app/services/common.py, and the names match, so a change on
 * either side is easy to find on the other.
 *
 * If a rule is added to the backend and not here, the worst outcome is a
 * button that should not have been shown, and the server still refuses it. If
 * it is added here and not to the backend, the worst outcome is a button that
 * never appears - which is why guessing is not allowed, and each function
 * says which check it copies.
 */

import type { ApiUserRole } from "@/types/api";

/** services/common.py -> can_admin_or_owner: owner of this workspace, or an admin. */
export function mayManageWorkspace(role: ApiUserRole | undefined): boolean {
  return role === "owner" || role === "admin";
}

/**
 * services/common.py -> can_manage_task.
 *
 * `isMine` is worked out in mappers.ts from the task's assignee and the
 * signed-in user's id, which is the same comparison the server makes against
 * the token's subject.
 */
export function mayChangeTask(role: ApiUserRole | undefined, isMine: boolean): boolean {
  if (role === "admin" || role === "owner") return true;

  return isMine;
}

/**
 * services/user.py -> update_user_service.
 *
 * Somebody's own profile, or a workspace owner or admin. A member editing a
 * teammate is refused by the server, so the menu should not offer it.
 */
export function mayChangeMember(
  role: ApiUserRole | undefined,
  isSelf: boolean,
): boolean {
  if (isSelf) return true;

  return mayManageWorkspace(role);
}

/**
 * services/user.py -> create_user_service.
 *
 * Only an owner may hand out the owner role, and a member may not invite at
 * all. Two different questions, so two different functions rather than one
 * with a flag.
 */
export function mayInvite(role: ApiUserRole | undefined): boolean {
  return mayManageWorkspace(role);
}

/** The narrower half of the same rule: who may make somebody an owner. */
export function mayGrantOwnership(role: ApiUserRole | undefined): boolean {
  return role === "owner";
}
