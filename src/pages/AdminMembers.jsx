import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

export default function AdminMembers() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [members, setMembers] = useState([]);
  const [restrictions, setRestrictions] = useState({});
  const [selectedMember, setSelectedMember] = useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/admin-login", { replace: true });
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id, full_name, role, admin_slot, is_active")
        .eq("id", session.user.id)
        .eq("role", "general_admin")
        .eq("is_active", true)
        .maybeSingle();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        navigate("/admin-login", { replace: true });
        return;
      }

      setAdmin(adminData);

      await loadMembers();
    } catch (err) {
      console.error(err);
      setError("Unable to load the Members section.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select(
        "id, full_name, email, phone, regime, member_number, created_at, avatar_url, cover_url"
      )
      .order("created_at", { ascending: false });

    if (memberError) {
      console.error(memberError);
      setError("Unable to load members.");
      return;
    }

    const {
      data: restrictionData,
      error: restrictionError,
    } = await supabase
      .from("member_restrictions")
      .select(
        "id, member_id, is_restricted, reason, restricted_at, lifted_by, lifted_at"
      );

    if (restrictionError) {
      console.error("Restriction loading error:", restrictionError);
    }

    const restrictionMap = {};

    (restrictionData || []).forEach((item) => {
      restrictionMap[item.member_id] = item;
    });

    setMembers(memberData || []);
    setRestrictions(restrictionMap);
  }

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return members;

    return members.filter((member) => {
      return (
        String(member.full_name || "")
          .toLowerCase()
          .includes(value) ||
        String(member.email || "")
          .toLowerCase()
          .includes(value) ||
        String(member.phone || "")
          .toLowerCase()
          .includes(value) ||
        String(member.member_number || "")
          .toLowerCase()
          .includes(value) ||
        String(member.regime || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [members, search]);

  async function callRestrictionFunction(
    member,
    action,
    reason = ""
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your admin session has expired.");
    }

    const { data, error } = await supabase.functions.invoke(
      "admin-member-restriction",
      {
        body: {
          member_id: member.id,
          action,
          reason,
        },
      }
    );

    if (error) {
      console.error("Edge Function error:", error);
      throw new Error(
        error.message || "Unable to contact the admin security service."
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.error || "The administrator action could not be completed."
      );
    }

    return data;
  }

  async function restrictMember(member, reason) {
    if (!admin) return;

    const cleanReason =
      reason?.trim() || "Restricted by General Administrator";

    setActionLoading(true);
    setError("");

    try {
      await callRestrictionFunction(
        member,
        "restrict",
        cleanReason
      );

      await loadMembers();

      const { data: latestRestriction } = await supabase
        .from("member_restrictions")
        .select(
          "id, member_id, is_restricted, reason, restricted_at, lifted_by, lifted_at"
        )
        .eq("member_id", member.id)
        .maybeSingle();

      setSelectedMember({
        ...member,
        restriction: latestRestriction || {
          member_id: member.id,
          is_restricted: true,
          reason: cleanReason,
          restricted_at: new Date().toISOString(),
        },
      });

      alert(`${member.full_name} has been restricted successfully.`);
    } catch (err) {
      console.error(err);

      alert(
        `Unable to restrict member:\n\n${
          err?.message || "Unknown error"
        }`
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function permitMember(member) {
    if (!admin) return;

    setActionLoading(true);
    setError("");

    try {
      await callRestrictionFunction(member, "permit");

      await loadMembers();

      const { data: latestRestriction } = await supabase
        .from("member_restrictions")
        .select(
          "id, member_id, is_restricted, reason, restricted_at, lifted_by, lifted_at"
        )
        .eq("member_id", member.id)
        .maybeSingle();

      setSelectedMember({
        ...member,
        restriction: latestRestriction || {
          member_id: member.id,
          is_restricted: false,
        },
      });

      alert(`${member.full_name} has been permitted successfully.`);
    } catch (err) {
      console.error(err);

      alert(
        `Unable to permit member:\n\n${
          err?.message || "Unknown error"
        }`
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleRestrict(member) {
    const reason = window.prompt(
      `Why are you restricting ${member.full_name}?`
    );

    if (reason === null) return;

    const cleanReason = reason.trim();

    if (!cleanReason) {
      alert("Please enter a reason for restricting this member.");
      return;
    }

    restrictMember(member, cleanReason);
  }

  function handlePermit(member) {
    const confirmed = window.confirm(
      `Permit ${member.full_name} again?`
    );

    if (!confirmed) return;

    permitMember(member);
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <img src={LOGO} alt="CHSDOSA" style={styles.logo} />
        <div style={styles.spinner}></div>
        <h3>Loading Members...</h3>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button
          onClick={() => navigate("/admin-dashboard")}
          style={styles.backButton}
        >
          ← Dashboard
        </button>

        <div style={styles.headerTitle}>
          <img
            src={LOGO}
            alt="CHSDOSA"
            style={styles.logoSmall}
          />

          <div>
            <h1 style={styles.title}>
              Members Management
            </h1>

            <p style={styles.subtitle}>
              General Administration • Member Control Center
            </p>
          </div>
        </div>

        <div style={styles.adminBadge}>
          {admin?.full_name}
        </div>
      </header>

      <main style={styles.content}>
        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <section style={styles.topCard}>
          <div>
            <h2 style={styles.sectionHeading}>
              Cooperative Members
            </h2>

            <p style={styles.muted}>
              Search and manage registered CHSDOSA members.
            </p>
          </div>

          <div style={styles.memberCount}>
            {filteredMembers.length} member
            {filteredMembers.length === 1 ? "" : "s"}
          </div>
        </section>

        <div style={styles.searchBox}>
          🔎

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Member ID, name, phone, email or regime..."
            style={styles.searchInput}
          />
        </div>

        <section style={styles.list}>
          {filteredMembers.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>👥</div>

              <h3>No members found</h3>

              <p>
                {search
                  ? "Try a different search."
                  : "There are currently no registered members."}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const restriction =
                restrictions[member.id];

              const restricted =
                restriction?.is_restricted === true;

              return (
                <div
                  key={member.id}
                  style={styles.memberCard}
                >
                  <div style={styles.memberMain}>
                    <div style={styles.avatar}>
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <span>
                          {(member.full_name || "M")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div style={styles.memberInfo}>
                      <strong style={styles.memberName}>
                        {member.full_name ||
                          "Unnamed Member"}
                      </strong>

                      <span style={styles.memberNumber}>
                        Member ID:{" "}
                        {member.member_number ||
                          "Not assigned"}
                      </span>

                      <span style={styles.memberContact}>
                        {member.phone || "No phone"} •{" "}
                        {member.email || "No email"}
                      </span>

                      <span style={styles.memberRegime}>
                        Regime:{" "}
                        {member.regime ||
                          "Not specified"}
                      </span>
                    </div>
                  </div>

                  <div style={styles.memberActions}>
                    <span
                      style={{
                        ...styles.status,
                        ...(restricted
                          ? styles.restricted
                          : styles.permitted),
                      }}
                    >
                      {restricted
                        ? "🔒 Restricted"
                        : "✓ Permitted"}
                    </span>

                    <button
                      onClick={() =>
                        setSelectedMember(member)
                      }
                      style={styles.viewButton}
                    >
                      View
                    </button>

                    {restricted ? (
                      <button
                        disabled={actionLoading}
                        onClick={() =>
                          handlePermit(member)
                        }
                        style={styles.permitButton}
                      >
                        Permit
                      </button>
                    ) : (
                      <button
                        disabled={actionLoading}
                        onClick={() =>
                          handleRestrict(member)
                        }
                        style={styles.restrictButton}
                      >
                        Restrict
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          restriction={
            restrictions[selectedMember.id] ||
            selectedMember.restriction
          }
          actionLoading={actionLoading}
          onClose={() => setSelectedMember(null)}
          onRestrict={handleRestrict}
          onPermit={handlePermit}
        />
      )}
    </div>
  );
}

function MemberModal({
  member,
  restriction,
  actionLoading,
  onClose,
  onRestrict,
  onPermit,
}) {
  const restricted =
    restriction?.is_restricted === true;

  return (
    <div
      style={styles.overlay}
      onClick={onClose}
    >
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={styles.closeButton}
        >
          ×
        </button>

        <div style={styles.modalAvatar}>
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.full_name}
              style={styles.modalAvatarImage}
            />
          ) : (
            <span>
              {(member.full_name || "M")
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        <h2 style={styles.modalName}>
          {member.full_name || "Unnamed Member"}
        </h2>

        <div
          style={{
            ...styles.status,
            ...(restricted
              ? styles.restricted
              : styles.permitted),
            margin: "0 auto 18px",
          }}
        >
          {restricted
            ? "🔒 Restricted"
            : "✓ Permitted"}
        </div>

        <div style={styles.detailGrid}>
          <Detail
            label="Member ID"
            value={member.member_number}
          />

          <Detail
            label="Regime"
            value={member.regime}
          />

          <Detail
            label="Phone"
            value={member.phone}
          />

          <Detail
            label="Email"
            value={member.email}
          />

          <Detail
            label="Registered"
            value={
              member.created_at
                ? new Date(
                    member.created_at
                  ).toLocaleDateString()
                : "Unknown"
            }
          />

          {restricted && (
            <>
              <Detail
                label="Restriction Reason"
                value={
                  restriction?.reason ||
                  "No reason provided"
                }
              />

              <Detail
                label="Restricted At"
                value={
                  restriction?.restricted_at
                    ? new Date(
                        restriction.restricted_at
                      ).toLocaleString()
                    : "Not available"
                }
              />
            </>
          )}

          {!restricted &&
            restriction?.lifted_at && (
              <Detail
                label="Last Permitted"
                value={new Date(
                  restriction.lifted_at
                ).toLocaleString()}
              />
            )}
        </div>

        <div style={styles.modalActions}>
          {restricted ? (
            <button
              disabled={actionLoading}
              onClick={() => onPermit(member)}
              style={styles.permitLarge}
            >
              {actionLoading
                ? "Processing..."
                : "✓ Permit Member"}
            </button>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => onRestrict(member)}
              style={styles.restrictLarge}
            >
              {actionLoading
                ? "Processing..."
                : "🔒 Restrict Member"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={styles.detail}>
      <span style={styles.detailLabel}>
        {label}
      </span>

      <strong style={styles.detailValue}>
        {value || "Not available"}
      </strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  spinner: {
    width: 28,
    height: 28,
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #0f766e",
    borderRadius: "50%",
    marginTop: 15,
    animation: "spin 1s linear infinite",
  },

  logo: {
    width: 75,
    height: 75,
    objectFit: "contain",
  },

  header: {
    minHeight: 75,
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 15,
    padding: "12px 20px",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  backButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#0f172a",
    borderRadius: 10,
    padding: "10px 13px",
    cursor: "pointer",
    fontWeight: 700,
  },

  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },

  logoSmall: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },

  title: {
    margin: 0,
    fontSize: 19,
    fontWeight: 800,
  },

  subtitle: {
    margin: "3px 0 0",
    fontSize: 11,
    color: "#64748b",
  },

  adminBadge: {
    background: "#ecfdf5",
    color: "#047857",
    padding: "8px 11px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },

  content: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    boxSizing: "border-box",
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: 12,
    padding: 13,
    marginBottom: 15,
  },

  topCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 15,
  },

  sectionHeading: {
    margin: 0,
    fontSize: 19,
  },

  muted: {
    color: "#64748b",
    margin: "5px 0 0",
    fontSize: 12,
  },

  memberCount: {
    background: "#f0fdfa",
    color: "#0f766e",
    padding: "8px 11px",
    borderRadius: 20,
    fontWeight: 800,
    fontSize: 12,
  },

  searchBox: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 13,
    padding: "10px 13px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },

  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 14,
    background: "transparent",
    minWidth: 0,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  memberCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 15,
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  memberMain: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "#ccfbf1",
    color: "#0f766e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 19,
    overflow: "hidden",
    flexShrink: 0,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  memberInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    gap: 3,
  },

  memberName: {
    fontSize: 14,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  memberNumber: {
    fontSize: 11,
    color: "#0f766e",
    fontWeight: 700,
  },

  memberContact: {
    fontSize: 11,
    color: "#64748b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  memberRegime: {
    fontSize: 10,
    color: "#94a3b8",
  },

  memberActions: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  status: {
    padding: "6px 9px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  permitted: {
    background: "#ecfdf5",
    color: "#047857",
  },

  restricted: {
    background: "#fef2f2",
    color: "#b91c1c",
  },

  viewButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    borderRadius: 8,
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  },

  restrictButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 8,
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  },

  permitButton: {
    border: "none",
    background: "#dcfce7",
    color: "#15803d",
    borderRadius: 8,
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
  },

  empty: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 55,
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: 42,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    zIndex: 100,
  },

  modal: {
    background: "#fff",
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: 20,
    padding: 25,
    position: "relative",
    boxSizing: "border-box",
  },

  closeButton: {
    position: "absolute",
    right: 15,
    top: 12,
    border: "none",
    background: "#f1f5f9",
    width: 34,
    height: 34,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 23,
  },

  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#ccfbf1",
    color: "#0f766e",
    margin: "5px auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 800,
    overflow: "hidden",
  },

  modalAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  modalName: {
    textAlign: "center",
    margin: "0 0 10px",
    fontSize: 20,
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 9,
  },

  detail: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: 11,
  },

  detailLabel: {
    display: "block",
    fontSize: 10,
    color: "#64748b",
    marginBottom: 4,
  },

  detailValue: {
    display: "block",
    fontSize: 12,
    wordBreak: "break-word",
  },

  modalActions: {
    marginTop: 18,
  },

  restrictLarge: {
    width: "100%",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },

  permitLarge: {
    width: "100%",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },
};