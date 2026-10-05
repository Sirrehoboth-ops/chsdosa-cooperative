import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function MemberProfile() {
  const navigate = useNavigate();
  const { memberId } = useParams();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode =
      localStorage.getItem("chsdosa-dark-mode") === "true";

    setDarkMode(savedMode);

    loadMember();
  }, [memberId]);

  async function loadMember() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, avatar_url")
        .eq("id", memberId)
        .single();

      if (error) {
        console.error("Member profile error:", error);
        setMember(null);
        return;
      }

      setMember(data);
    } catch (error) {
      console.error(error);
      setMember(null);
    } finally {
      setLoading(false);
    }
  }

  function toggleDarkMode() {
    const nextMode = !darkMode;

    setDarkMode(nextMode);

    localStorage.setItem(
      "chsdosa-dark-mode",
      String(nextMode)
    );
  }

  function getInitials(name = "") {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div
        style={{
          ...styles.page,
          background: darkMode ? "#101010" : "#f5f5f5",
          color: darkMode ? "#fff" : "#111",
        }}
      >
        <div style={styles.topBar}>
          <button
            onClick={() => navigate(-1)}
            style={styles.backButton}
          >
            ←
          </button>

          <strong>Member Profile</strong>

          <div style={{ width: 40 }} />
        </div>

        <div style={styles.empty}>
          <div style={{ fontSize: 55 }}>👤</div>
          <h3>Member not found</h3>
          <button
            onClick={() => navigate("/regime-members")}
            style={styles.primaryButton}
          >
            Back to Regime Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.page,
        background: darkMode ? "#101010" : "#f5f5f5",
        color: darkMode ? "#fff" : "#111",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          ...styles.topBar,
          background: darkMode ? "#181818" : "#ffffff",
          borderBottom: darkMode
            ? "1px solid #292929"
            : "1px solid #e5e5e5",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            ...styles.backButton,
            color: darkMode ? "#fff" : "#111",
          }}
        >
          ←
        </button>

        <strong>Member Profile</strong>

        <button
          onClick={toggleDarkMode}
          style={{
            ...styles.modeButton,
            color: darkMode ? "#fff" : "#111",
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {/* PROFILE */}
      <div style={styles.profileContainer}>
        <div
          style={{
            ...styles.profileCard,
            background: darkMode ? "#181818" : "#ffffff",
            border: darkMode
              ? "1px solid #292929"
              : "1px solid #e5e5e5",
          }}
        >
          {/* AVATAR */}
          <div style={styles.avatarWrapper}>
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.full_name}
                style={styles.avatar}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {getInitials(member.full_name)}
              </div>
            )}
          </div>

          {/* NAME */}
          <h2 style={{ margin: "18px 0 6px" }}>
            {member.full_name || "CHSDOSA Member"}
          </h2>

          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginBottom: 25,
            }}
          >
            CHSDOSA MEMBER
          </div>

          {/* CHAT */}
          <button
            onClick={() =>
              navigate(`/chat?member=${member.id}`)
            }
            style={styles.primaryButton}
          >
            💬 Chat
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  topBar: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    border: "none",
    background: "transparent",
    fontSize: 28,
    cursor: "pointer",
  },

  modeButton: {
    width: 40,
    height: 40,
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
  },

  profileContainer: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "30px 18px",
    boxSizing: "border-box",
  },

  profileCard: {
    borderRadius: 24,
    padding: "35px 20px",
    textAlign: "center",
    boxShadow:
      "0 8px 30px rgba(0,0,0,0.08)",
  },

  avatarWrapper: {
    display: "flex",
    justifyContent: "center",
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #ffffff",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.18)",
  },

  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f7a4d",
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "bold",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.18)",
  },

  primaryButton: {
    width: "100%",
    maxWidth: 320,
    height: 50,
    border: "none",
    borderRadius: 14,
    background: "#1f7a4d",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  spinner: {
    width: 35,
    height: 35,
    borderRadius: "50%",
    border: "4px solid #ddd",
    borderTop: "4px solid #1f7a4d",
    animation: "spin 1s linear infinite",
  },

  empty: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    textAlign: "center",
  },
};