/**
 * Bringing a new person into the workspace.
 *
 * This module belongs to the TEAM feature (src/features/team).
 *
 * POST /users is owner-or-admin only, so this form is only ever rendered by
 * somebody who can use it (see TeamPage). Two rules the backend enforces are
 * reflected in the choices offered rather than left to a 403:
 *
 *   * the newcomer lands in the caller's own workspace - there is no
 *     company_id field to get wrong;
 *   * only an owner may hand out the owner role, so an admin is not offered
 *     it. An admin inviting somebody as an admin is allowed.
 *
 * The password is set here rather than emailed, because this API has no mail
 * service: the invitee is given the password out of band, and can change it on
 * their own profile. That is a development shortcut, not a production design.
 */

"use client";

import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  Dialog,
  Field,
  dialogCancelButtonClasses,
  dialogPrimaryButtonClasses,
  fieldInputClasses,
} from "@/components/ui/Dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ApiError } from "@/lib/api/http";
import type { ApiUserRole } from "@/types/api";

export function InviteTeammateDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { invite } = useWorkspace();
  const { notify } = useUi();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ApiUserRole>("member");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The one role this form is not allowed to offer, decided by the server and
  // spelled out here so the choice is not there to be clicked.
  const isOwner = user?.role === "owner";
  const roles: Array<{ value: ApiUserRole; label: string }> = [
    { value: "member", label: "Member" },
    { value: "admin", label: "Admin - can change anything in the workspace" },
    ...(isOwner ? [{ value: "owner" as ApiUserRole, label: "Owner - hands over the workspace" }] : []),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Checked before sending rather than leaving to Pydantic, because the
    // message below is a shorter walk than a 422 list of field errors.
    if (password.length < 8) {
      setProblem("The password needs at least 8 characters.");

      return;
    }

    setProblem(null);
    setSaving(true);

    try {
      const person = await invite({ name: name.trim(), email: email.trim(), password, role });
      notify(`${person.name} joined the workspace.`, "success");
      onClose();
    } catch (cause) {
      setSaving(false);
      setProblem(
        cause instanceof ApiError
          ? cause.detail
          : "Could not reach the server. Check that the API is running.",
      );
    }
  }

  return (
    <Dialog
      titleId="invite-title"
      heading="Invite a teammate"
      introduction="They sign in with this email and password, in this workspace."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <Field id="invite-name" label="Full name">
          <input
            id="invite-name"
            autoFocus
            maxLength={50}
            className={fieldInputClasses}
            placeholder="e.g. Priya Sharma"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>

        <Field id="invite-email" label="Email" hint="Has to be an address nobody has registered yet.">
          <input
            id="invite-email"
            type="email"
            maxLength={100}
            className={fieldInputClasses}
            placeholder="they@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field id="invite-password" label="Starting password" hint="At least 8 characters. Share it some way other than this app.">
          <input
            id="invite-password"
            type="password"
            maxLength={128}
            autoComplete="new-password"
            className={fieldInputClasses}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        <Field id="invite-role" label="Role">
          <select
            id="invite-role"
            className={fieldInputClasses}
            value={role}
            onChange={(event) => setRole(event.target.value as ApiUserRole)}
          >
            {roles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {problem && (
          <p className="m-0 mb-3.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700" role="alert">
            {problem}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={dialogCancelButtonClasses} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={dialogPrimaryButtonClasses} disabled={saving}>
            <UserPlus size={16} /> {saving ? "Inviting…" : "Invite"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
