import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const APP_LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

export default function RegimeMembers() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [myMember, setMyMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("chsdosa-dark-mode") === "true"
  );

  useEffect(() => {
    loadRegimeMembers();

    const handleThemeChange = () => {
      setDarkMode(localStorage.getItem("chsdosa-dark-mode") === "true");
    };

    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  async function loadRegimeMembers() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/login");
        return;
      }

      setUser(user);

      const { data: member, error: memberError } = await supabase
        .from("members")
        .select(
          "id, full_name, member_number, regime, avatar_url"
        )
        .eq("id", user.id)
        .single();

      if (memberError) throw memberError;

      setMyMember(member);

      if (!member.regime) {
        setMembers([]);
        setError("Your regime has not been assigned yet.");
        return;
      }

      const { data: regimeMembers, error: membersError } =
        await supabase
          .from("members")
          .select(
            "id, full_name, member_number, regime, avatar_url"
          )
          .eq("regime", member.regime)
          .order("full_name", { ascending: true });

      if (membersError) throw membersError;

      setMembers(regimeMembers || []);
    } catch (err) {
      console.error("REGIME MEMBERS ERROR:", err);
      setError(
        err.message || "Unable to load regime members."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return members;

    return members.filter((member) =>
      [
        member.full_name,
        member.member_number,
        member.regime,
      ]
        .filter(Boolean)
        .some((field) =>
          field.toLowerCase().includes(value)
        )
    );
  }, [members, search]);

  function getInitials(name) {
    if (!name) return "CH";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  const theme = darkMode
    ? {
        page: "#0d1117",
        header: "rgba(13,17,23,0.96)",
        text: "#f2f5f9",
        secondary: "#9ba8b8",
        card: "#161d27",
        border: "#283342",
        input: "#161d27",
        inputText: "#f2f5f9",
        muted: "#202936",
        button: "#202936",
        avatarFallback: "#273242",
      }
    : {
        page: "#f6f8fb",
        header: "rgba(255,255,255,0.96)",
        text: "#172033",
        secondary: "#687386",
        card: "#ffffff",
        border: "#e3e8ef",
        input: "#ffffff",
        inputText: "#172033",
        muted: "#eef2f7",
        button: "#f8fafc",
        avatarFallback: "#e9eef5",
      };

  return (
    <div
      style={{
        ...styles.page,
        background: theme.page,
        color: theme.text,
      }}
    >
      <header
        style={{
          ...styles.header,
          background: theme.header,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            ...styles.backButton,
            background: theme.card,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        >
          ←
        </button>

        <div style={styles.headerTitle}>
          <img
            src={APP_LOGO}
            alt="CHSDOSA"
            style={styles.headerLogo}
          />

          <div>
            <div style={{ ...styles.title, color: theme.text }}>
              Regime Members
            </div>

            <div
              style={{
                ...styles.subtitle,
                color: theme.secondary,
              }}
            >
              {myMember?.regime
                ? `Regime ${myMember.regime}`
                : "CHSDOSA Cooperative"}
            </div>
          </div>
        </div>
      </header>

      <main style={styles.content}>
        {loading ? (
          <div
            style={{
              ...styles.centerState,
              color: theme.secondary,
            }}
          >
            <div
              style={{
                ...styles.spinner,
                borderColor: theme.border,
                borderTopColor: theme.text,
              }}
            />
            <p>Loading regime members...</p>
          </div>
        ) : error ? (
          <div
            style={{
              ...styles.errorBox,
              background: theme.card,
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            <div style={styles.errorIcon}>!</div>

            <div>{error}</div>

            <button
              onClick={loadRegimeMembers}
              style={{
                ...styles.retryButton,
                background: theme.text,
                color: theme.page,
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <section style={styles.regimeCard}>
              <div style={styles.regimeLogo}>
                <img
                  src={APP_LOGO}
                  alt="CHSDOSA"
                  style={{
                    width: 43,
                    height: 43,
                    objectFit: "contain",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={styles.smallLabel}>
                  YOUR REGIME
                </div>

                <div style={styles.regimeName}>
                  {myMember?.regime || "Not assigned"}
                </div>

                <div style={styles.memberCount}>
                  {members.length}{" "}
                  {members.length === 1
                    ? "member"
                    : "members"}
                </div>
              </div>
            </section>

            <div
              style={{
                ...styles.searchBox,
                background: theme.input,
                borderColor: theme.border,
              }}
            >
              <span style={styles.searchIcon}>⌕</span>

              <input
                type="text"
                placeholder="Search regime members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  ...styles.searchInput,
                  color: theme.inputText,
                }}
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    ...styles.clearButton,
                    color: theme.secondary,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <section>
              <div
                style={{
                  ...styles.sectionTitle,
                  color: theme.text,
                }}
              >
                <span>Members</span>

                <span
                  style={{
                    ...styles.resultCount,
                    background: theme.muted,
                    color: theme.secondary,
                  }}
                >
                  {filteredMembers.length}
                </span>
              </div>

              {filteredMembers.length === 0 ? (
                <div
                  style={{
                    ...styles.emptyState,
                    background: theme.card,
                    borderColor: theme.border,
                    color: theme.secondary,
                  }}
                >
                  <div style={styles.emptyIcon}>👥</div>

                  <strong style={{ color: theme.text }}>
                    No members found
                  </strong>

                  <p>
                    {search
                      ? "Try a different search."
                      : "There are no members in this regime yet."}
                  </p>
                </div>
              ) : (
                <div style={styles.memberList}>
                  {filteredMembers.map((member) => {
                    const isMe = member.id === user?.id;

                    return (
                      <div
                        key={member.id}
                        style={{
                          ...styles.memberCard,
                          background: theme.card,
                          borderColor: theme.border,
                        }}
                      >
                        <div style={styles.avatarWrap}>
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              style={styles.avatar}
                            />
                          ) : (
                            <div
                              style={{
                                ...styles.initialAvatar,
                                background:
                                  theme.avatarFallback,
                                color: theme.secondary,
                              }}
                            >
                              {getInitials(member.full_name)}
                            </div>
                          )}
                        </div>

                        <div style={styles.memberInfo}>
                          <div
                            style={{
                              ...styles.memberName,
                              color: theme.text,
                            }}
                          >
                            {member.full_name ||
                              "CHSDOSA Member"}

                            {isMe && (
                              <span
                                style={{
                                  ...styles.youBadge,
                                  background: theme.muted,
                                  color: theme.secondary,
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              ...styles.memberNumber,
                              color: theme.secondary,
                            }}
                          >
                            {member.member_number ||
                              "Member ID unavailable"}
                          </div>

                          <div
                            style={{
                              ...styles.regimeText,
                              color: theme.secondary,
                            }}
                          >
                            Regime {member.regime}
                          </div>
                        </div>

                        <button
                          style={{
                            ...styles.arrowButton,
                            background: theme.button,
                            borderColor: theme.border,
                            color: theme.text,
                          }}
                          onClick={() => {
                            if (isMe) {
                              navigate("/profile");
                            } else {
                              alert(
                                `${member.full_name || "Member"} profile/chat will be connected here.`
                              );
                            }
                          }}
                        >
                          ›
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    transition:
      "background 0.25s ease, color 0.25s ease",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    height: 72,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    backdropFilter: "blur(12px)",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    fontSize: 25,
    cursor: "pointer",
  },

  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  headerLogo: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },

  title: {
    fontWeight: 800,
    fontSize: 18,
    lineHeight: 1.1,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
  },

  content: {
    width: "100%",
    maxWidth: 700,
    margin: "0 auto",
    padding: "18px 15px 40px",
    boxSizing: "border-box",
  },

  regimeCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 17,
    borderRadius: 22,
    background:
      "linear-gradient(135deg, #172033, #263b5a)",
    color: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(23,32,51,0.14)",
    marginBottom: 16,
  },

  regimeLogo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  smallLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
    opacity: 0.72,
  },

  regimeName: {
    fontSize: 25,
    fontWeight: 900,
    marginTop: 2,
  },

  memberCount: {
    fontSize: 12,
    marginTop: 3,
    opacity: 0.78,
  },

  searchBox: {
    height: 52,
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "0 14px",
    border: "1px solid",
    borderRadius: 17,
    marginBottom: 20,
    boxSizing: "border-box",
  },

  searchIcon: {
    fontSize: 24,
    color: "#7c8797",
    lineHeight: 1,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14,
  },

  clearButton: {
    border: "none",
    background: "transparent",
    fontSize: 24,
    cursor: "pointer",
  },

  sectionTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 800,
  },

  resultCount: {
    minWidth: 27,
    height: 27,
    padding: "0 8px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    boxSizing: "border-box",
  },

  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  memberCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    border: "1px solid",
    borderRadius: 19,
    boxShadow:
      "0 5px 18px rgba(23,32,51,0.05)",
  },

  avatarWrap: {
    width: 54,
    height: 54,
    flexShrink: 0,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },

  initialAvatar: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 16,
  },

  memberInfo: {
    flex: 1,
    minWidth: 0,
  },

  memberName: {
    fontSize: 15,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },

  youBadge: {
    fontSize: 8,
    fontWeight: 900,
    padding: "3px 6px",
    borderRadius: 8,
  },

  memberNumber: {
    fontSize: 11,
    marginTop: 4,
  },

  regimeText: {
    fontSize: 10,
    marginTop: 2,
  },

  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid",
    fontSize: 24,
    cursor: "pointer",
    flexShrink: 0,
  },

  emptyState: {
    padding: "45px 20px",
    textAlign: "center",
    border: "1px solid",
    borderRadius: 20,
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 8,
  },

  errorBox: {
    padding: 25,
    border: "1px solid",
    borderRadius: 20,
    textAlign: "center",
  },

  errorIcon: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff0f0",
    color: "#7d3434",
    fontWeight: 900,
  },

  retryButton: {
    marginTop: 15,
    padding: "11px 18px",
    borderRadius: 12,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },

  centerState: {
    minHeight: 300,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  spinner: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "3px solid",
    animation:
      "chsdosaSpin 0.8s linear infinite",
    marginBottom: 12,
  },
};