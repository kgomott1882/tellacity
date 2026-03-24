"use client";

import { useEffect, useState, useCallback } from "react";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import PageLoadingOverlay from "../../_components/PageLoadingOverlay";

// ── Types ─────────────────────────────────────────────────────────────────────

type Member = {
  id: string;
  user_id: string;
  email: string | null;
  role: "owner" | "admin" | "member";
  status: string;
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
};

type TeamData = {
  members: Member[];
  invites: Invite[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data: any }> {
  try {
    if (options.method === "POST") {
      const body = options.body ? JSON.parse(String(options.body)) : undefined;
      const data = await dashboardApiPost(path, body);
      return { ok: true, data };
    }
    const data = await dashboardApiGet(path);
    return { ok: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error. Please try again.";
    return { ok: false, data: { error: msg } };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner:  "bg-[#2fb2a8]/15 text-[#0E4E45]",
    admin:  "bg-blue-50 text-blue-700",
    member: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[role] ?? colors.member
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending:  "bg-yellow-50 text-yellow-700",
    accepted: "bg-green-50 text-green-700",
    revoked:  "bg-red-50 text-red-700",
    active:   "bg-green-50 text-green-700",
    removed:  "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 border-b border-gray-200 pb-3">
      <h2 className="text-base font-semibold text-[#0E0E0E]">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

function Alert({
  type,
  text,
}: {
  type: "success" | "error";
  text: string;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        type === "success"
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {text}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamAccessPage() {
  const [loading,       setLoading]       = useState(true);
  const [teamData,      setTeamData]      = useState<TeamData | null>(null);
  const [fetchError,    setFetchError]    = useState<string | null>(null);

  // Invite form
  const [inviteEmail,   setInviteEmail]   = useState("");
  const [inviteRole,    setInviteRole]    = useState<"admin" | "member">("member");
  const [inviting,      setInviting]      = useState(false);
  const [inviteMsg,     setInviteMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Role change per member
  const [roleChanges,   setRoleChanges]   = useState<Record<string, string>>({});
  const [savingRole,    setSavingRole]    = useState<Record<string, boolean>>({});
  const [roleMsg,       setRoleMsg]       = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  // Remove member
  const [removing,      setRemoving]      = useState<Record<string, boolean>>({});

  // Resend invite
  const [resending,     setResending]     = useState<Record<string, boolean>>({});
  const [resendMsg,     setResendMsg]     = useState<Record<string, { type: "success" | "error"; text: string }>>({});


  // ── Load team data ──────────────────────────────────────────────────────────

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { ok, data } = await apiFetch("/api/business/team-access");
    if (ok) {
      setTeamData(data as TeamData);
      // Pre-fill role selects with current values
      const initial: Record<string, string> = {};
      (data.members as Member[]).forEach((m) => {
        if (m.role !== "owner") initial[m.id] = m.role;
      });
      setRoleChanges(initial);
    } else {
      setFetchError(data?.error ?? "Failed to load team.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // ── Send invite ─────────────────────────────────────────────────────────────

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg(null);
    setInviting(true);
    const { ok, data } = await apiFetch("/api/business/team-access/invite", {
      method: "POST",
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    if (ok) {
      setInviteMsg({ type: "success", text: `Invite sent to ${inviteEmail}.` });
      setInviteEmail("");
      await loadTeam();
    } else {
      setInviteMsg({ type: "error", text: data?.error ?? "Failed to send invite." });
    }
    setInviting(false);
  };

  // ── Save role ───────────────────────────────────────────────────────────────

  const handleSaveRole = async (memberId: string) => {
    setSavingRole((p) => ({ ...p, [memberId]: true }));
    setRoleMsg((p) => ({ ...p, [memberId]: undefined as any }));
    const { ok, data } = await apiFetch("/api/business/team-access/role", {
      method: "POST",
      body: JSON.stringify({ memberId, role: roleChanges[memberId] }),
    });
    if (ok) {
      setRoleMsg((p) => ({ ...p, [memberId]: { type: "success", text: "Role updated." } }));
      await loadTeam();
    } else {
      setRoleMsg((p) => ({
        ...p,
        [memberId]: { type: "error", text: data?.error ?? "Failed to update role." },
      }));
    }
    setSavingRole((p) => ({ ...p, [memberId]: false }));
  };

  // ── Remove member ───────────────────────────────────────────────────────────

  const handleRemove = async (memberId: string, email: string | null) => {
    if (!window.confirm(`Remove ${email ?? "this member"} from the team?`)) return;
    setRemoving((p) => ({ ...p, [memberId]: true }));
    const { ok, data } = await apiFetch("/api/business/team-access/remove", {
      method: "POST",
      body: JSON.stringify({ memberId }),
    });
    if (!ok) {
      alert(data?.error ?? "Failed to remove member.");
    }
    setRemoving((p) => ({ ...p, [memberId]: false }));
    await loadTeam();
  };

  // ── Resend invite ───────────────────────────────────────────────────────────

  const handleResendInvite = async (inviteId: string, email: string) => {
    setResending((p) => ({ ...p, [inviteId]: true }));
    setResendMsg((p) => ({ ...p, [inviteId]: undefined as any }));
    const { ok, data } = await apiFetch("/api/business/team-access/resend", {
      method: "POST",
      body: JSON.stringify({ inviteId }),
    });
    setResendMsg((p) => ({
      ...p,
      [inviteId]: ok
        ? { type: "success", text: `Invite resent to ${email}.` }
        : { type: "error", text: data?.error ?? "Failed to resend invite." },
    }));
    setResending((p) => ({ ...p, [inviteId]: false }));
    if (ok) await loadTeam();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">
      {loading && !teamData && <PageLoadingOverlay />}
      <div>
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Team Access</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage who can access and manage your business on Tellacity.
        </p>
      </div>

      {fetchError && <Alert type="error" text={fetchError} />}

      {/* ── Invite a teammate ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <SectionHeading
          title="Invite a teammate"
          sub="Send an email invitation to add someone to your team."
        />
        {inviteMsg && (
          <div className="mb-4">
            <Alert type={inviteMsg.type} text={inviteMsg.text} />
          </div>
        )}
        <form onSubmit={handleSendInvite} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-[#0E0E0E]">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="colleague@example.com"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
            />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-[#0E0E0E]">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50"
          >
            {inviting ? "Sending..." : "Send invite"}
          </button>
        </form>
      </div>

      {/* ── Team members ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <SectionHeading
          title="Team members"
          sub="Active members who can access this business."
        />
        {!teamData || teamData.members.length === 0 ? (
          <p className="text-sm text-gray-500">No team members yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {teamData.members.map((member) => {
              const isOwner = member.role === "owner";
              return (
                <div key={member.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0E0E0E] truncate">
                        {member.email ?? member.user_id}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <RoleBadge role={member.role} />
                        <StatusBadge status={member.status} />
                      </div>
                    </div>

                    {!isOwner && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={roleChanges[member.id] ?? member.role}
                          onChange={(e) =>
                            setRoleChanges((p) => ({ ...p, [member.id]: e.target.value }))
                          }
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(member.id)}
                          disabled={
                            savingRole[member.id] ||
                            (roleChanges[member.id] ?? member.role) === member.role
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                        >
                          {savingRole[member.id] ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(member.id, member.email)}
                          disabled={removing[member.id]}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
                        >
                          {removing[member.id] ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    )}
                  </div>

                  {roleMsg[member.id] && (
                    <div className="mt-2">
                      <Alert type={roleMsg[member.id].type} text={roleMsg[member.id].text} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pending invites ── */}
      {teamData && teamData.invites.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <SectionHeading
            title="Pending invites"
            sub="Invitations that have been sent but not yet accepted."
          />
          <div className="divide-y divide-gray-100">
            {teamData.invites.map((invite) => (
              <div key={invite.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#0E0E0E]">{invite.email}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Invited{" "}
                      {new Date(invite.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleBadge role={invite.role} />
                    <StatusBadge status={invite.status} />
                    {invite.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleResendInvite(invite.id, invite.email)}
                        disabled={resending[invite.id]}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        {resending[invite.id] ? "Sending..." : "Resend"}
                      </button>
                    )}
                  </div>
                </div>
                {resendMsg[invite.id] && (
                  <div className="mt-2">
                    <Alert type={resendMsg[invite.id].type} text={resendMsg[invite.id].text} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
