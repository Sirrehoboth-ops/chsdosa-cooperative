import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

const TYPE_INFO = {
  deposit: {
    icon: "💰",
    label: "Deposit",
  },
  admin_message: {
    icon: "📢",
    label: "Admin Message",
  },
  meeting: {
    icon: "📅",
    label: "Meeting",
  },
  contribution: {
    icon: "💳",
    label: "Contribution",
  },
  system: {
    icon: "⚙️",
    label: "System",
  },
  general: {
    icon: "🔔",
    label: "General",
  },
  guarantor_request: {
    icon: "🤝",
    label: "Guarantor Request",
  },
  guarantor_accepted: {
    icon: "✅",
    label: "Loan Update",
  },
  guarantor_declined: {
    icon: "❌",
    label: "Loan Update",
  },
  loan_submitted: {
    icon: "📋",
    label: "Loan Update",
  },
  loan_approved: {
    icon: "🎉",
    label: "Loan Approved",
  },
  loan_rejected: {
    icon: "⚠️",
    label: "Loan Update",
  },
  loan_disbursed: {
    icon: "💵",
    label: "Loan Disbursement",
  },
  loan_repayment: {
    icon: "💳",
    label: "Loan Repayment",
  },
};

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loanNotifications, setLoanNotifications] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");

  const darkMode =
    typeof window !== "undefined" &&
    localStorage.getItem("chsdosa-dark-mode") === "true";

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("chsdosa-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_notifications",
        },
        () => {
          loadNotifications(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadNotifications(silent = false) {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const userId = session.user.id;

      // ---------------------------------------------
      // GENERAL NOTIFICATIONS
      // ---------------------------------------------

      const {
        data: generalData,
        error: generalError,
      } = await supabase
        .from("notifications")
        .select(`
          id,
          recipient_id,
          notification_type,
          title,
          message,
          reference_id,
          reference_type,
          is_read,
          created_at
        `)
        .eq("recipient_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (generalError) {
        console.error(
          "General notifications:",
          generalError
        );
      }

      // ---------------------------------------------
      // LOAN NOTIFICATIONS
      // ---------------------------------------------

      const {
        data: loanData,
        error: loanError,
      } = await supabase
        .from("loan_notifications")
        .select(`
          id,
          loan_id,
          recipient_id,
          notification_type,
          title,
          message,
          is_read,
          created_at
        `)
        .eq("recipient_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (loanError) {
        console.error(
          "Loan notifications:",
          loanError
        );
      }

      setNotifications(generalData || []);
      setLoanNotifications(loanData || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load your notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ---------------------------------------------
  // COMBINE BOTH NOTIFICATION SYSTEMS
  // ---------------------------------------------

  const allNotifications = useMemo(() => {
    const general = notifications.map((item) => ({
      ...item,
      source: "general",
      sortDate: new Date(item.created_at).getTime(),
    }));

    const loans = loanNotifications.map((item) => ({
      ...item,
      source: "loan",
      reference_id: item.loan_id,
      reference_type: "loan",
      sortDate: new Date(item.created_at).getTime(),
    }));

    return [...general, ...loans].sort(
      (a, b) => b.sortDate - a.sortDate
    );
  }, [notifications, loanNotifications]);

  const unreadCount = allNotifications.filter(
    (item) => !item.is_read
  ).length;

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return allNotifications.filter(
        (item) => !item.is_read
      );
    }

    if (filter === "loan") {
      return allNotifications.filter(
        (item) =>
          item.source === "loan" ||
          [
            "guarantor_request",
            "guarantor_accepted",
            "guarantor_declined",
            "loan_submitted",
            "loan_approved",
            "loan_rejected",
            "loan_disbursed",
            "loan_repayment",
          ].includes(item.notification_type)
      );
    }

    return allNotifications;
  }, [allNotifications, filter]);

  async function markAsRead(notification) {
    try {
      if (notification.is_read) {
        openNotification(notification);
        return;
      }

      if (notification.source === "general") {
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("id", notification.id);
      } else {
        await supabase
          .from("loan_notifications")
          .update({
            is_read: true,
          })
          .eq("id", notification.id);
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      setLoanNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      openNotification({
        ...notification,
        is_read: true,
      });
    } catch (err) {
      console.error(
        "Unable to mark notification as read:",
        err
      );
    }
  }

  async function markAllAsRead() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const userId = session.user.id;

      await Promise.all([
        supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("recipient_id", userId)
          .eq("is_read", false),

        supabase
          .from("loan_notifications")
          .update({
            is_read: true,
          })
          .eq("recipient_id", userId)
          .eq("is_read", false),
      ]);

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setLoanNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(
        "Unable to mark all notifications:",
        err
      );
    }
  }

  function openNotification(notification) {
    // ---------------------------------------------
    // GUARANTOR REQUEST
    // ---------------------------------------------

    if (
      notification.notification_type ===
      "guarantor_request"
    ) {
      if (notification.loan_id) {
        navigate(
          `/loan/guarantor-request/${notification.loan_id}`
        );
      }

      return;
    }

    // ---------------------------------------------
    // OTHER LOAN NOTIFICATIONS
    // ---------------------------------------------

    if (
      notification.source === "loan" &&
      notification.loan_id
    ) {
      navigate(
        `/loan`,
        {
          state: {
            loanId: notification.loan_id,
            notificationId: notification.id,
          },
        }
      );

      return;
    }

    // ---------------------------------------------
    // GENERAL NOTIFICATION WITH REFERENCE
    // ---------------------------------------------

    if (
      notification.reference_type === "meeting" &&
      notification.reference_id
    ) {
      navigate("/meeting");
      return;
    }

    if (
      notification.reference_type === "deposit" &&
      notification.reference_id
    ) {
      navigate("/deposit");
      return;
    }

    if (
      notification.reference_type === "contribution" &&
      notification.reference_id
    ) {
      navigate("/contributions");
      return;
    }
  }

  function formatDate(date) {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return value.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getTypeInfo(type) {
    return (
      TYPE_INFO[type] || {
        icon: "🔔",
        label: "Notification",
      }
    );
  }

  if (loading) {
    return (
      <div style={pageStyle(darkMode)}>
        <div style={loadingBox(darkMode)}>
          <img
            src={LOGO}
            alt="CHSDOSA"
            style={{
              width: 70,
              height: 70,
              objectFit: "contain",
            }}
          />

          <div>Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle(darkMode)}>
      {/* HEADER */}

      <header style={headerStyle(darkMode)}>
        <button
          onClick={() => navigate(-1)}
          style={backButton(darkMode)}
        >
          ←
        </button>

        <img
          src={LOGO}
          alt="CHSDOSA"
          style={{
            width: 42,
            height: 42,
            objectFit: "contain",
          }}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 17,
            }}
          >
            Notifications
          </div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.6,
              marginTop: 2,
            }}
          >
            All your CHSDOSA updates
          </div>
        </div>

        {unreadCount > 0 && (
          <div style={unreadBadge}>
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </div>
        )}
      </header>

      <main style={mainStyle}>
        {/* SUMMARY */}

        <section style={summaryCard(darkMode)}>
          <div>
            <div
              style={{
                fontSize: 13,
                opacity: 0.65,
              }}
            >
              New messages
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                marginTop: 2,
              }}
            >
              {unreadCount}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={markAllButton(darkMode)}
            >
              Mark all as read
            </button>
          )}
        </section>

        {/* FILTERS */}

        <div style={filterRow}>
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
            darkMode={darkMode}
          >
            All
          </FilterButton>

          <FilterButton
            active={filter === "unread"}
            onClick={() => setFilter("unread")}
            darkMode={darkMode}
          >
            New
          </FilterButton>

          <FilterButton
            active={filter === "loan"}
            onClick={() => setFilter("loan")}
            darkMode={darkMode}
          >
            Loans
          </FilterButton>

          <button
            onClick={() => loadNotifications()}
            style={refreshButton(darkMode)}
          >
            {refreshing ? "..." : "↻"}
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div style={errorBox(darkMode)}>
            {error}
          </div>
        )}

        {/* LIST */}

        {filteredNotifications.length === 0 ? (
          <section style={emptyCard(darkMode)}>
            <div
              style={{
                fontSize: 52,
                marginBottom: 10,
              }}
            >
              🔔
            </div>

            <h3 style={{ margin: "0 0 7px" }}>
              No notifications
            </h3>

            <p
              style={{
                margin: 0,
                opacity: 0.6,
                lineHeight: 1.5,
              }}
            >
              You're all caught up. New CHSDOSA
              updates will appear here.
            </p>
          </section>
        ) : (
          <div>
            {filteredNotifications.map(
              (notification) => {
                const info = getTypeInfo(
                  notification.notification_type
                );

                return (
                  <button
                    key={`${notification.source}-${notification.id}`}
                    onClick={() =>
                      markAsRead(notification)
                    }
                    style={{
                      ...notificationCard(
                        darkMode,
                        !notification.is_read
                      ),
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        minWidth: 48,
                        borderRadius: 15,
                        background: darkMode
                          ? "#1c2940"
                          : "#eef4ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 23,
                      }}
                    >
                      {info.icon}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight:
                              notification.is_read
                                ? 650
                                : 850,
                          }}
                        >
                          {notification.title}
                        </div>

                        {!notification.is_read && (
                          <span
                            style={newDot}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 3,
                          opacity: 0.55,
                          fontWeight: 700,
                        }}
                      >
                        {info.label}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.55,
                          opacity: 0.72,
                          marginTop: 6,
                        }}
                      >
                        {notification.message}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.45,
                          marginTop: 8,
                        }}
                      >
                        {formatDate(
                          notification.created_at
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        opacity: 0.35,
                      }}
                    >
                      ›
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  darkMode,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${
          active
            ? "#2563eb"
            : darkMode
            ? "#334155"
            : "#d9dee7"
        }`,
        background: active
          ? "#2563eb"
          : darkMode
          ? "#111a2b"
          : "#fff",
        color: active
          ? "#fff"
          : darkMode
          ? "#fff"
          : "#111827",
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 750,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const pageStyle = (darkMode) => ({
  minHeight: "100vh",
  background: darkMode ? "#0b1220" : "#f5f7fb",
  color: darkMode ? "#fff" : "#111827",
  paddingBottom: 35,
});

const headerStyle = (darkMode) => ({
  position: "sticky",
  top: 0,
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px",
  background: darkMode
    ? "rgba(11,18,32,.96)"
    : "rgba(255,255,255,.96)",
  backdropFilter: "blur(12px)",
  borderBottom: `1px solid ${
    darkMode ? "#26334a" : "#e6e9ef"
  }`,
});

const backButton = (darkMode) => ({
  border: "none",
  background: "transparent",
  color: darkMode ? "#fff" : "#111827",
  fontSize: 26,
  cursor: "pointer",
  padding: 3,
});

const mainStyle = {
  maxWidth: 700,
  margin: "0 auto",
  padding: 16,
};

const loadingBox = (darkMode) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 14,
  color: darkMode ? "#fff" : "#111827",
});

const summaryCard = (darkMode) => ({
  background: darkMode ? "#111a2b" : "#fff",
  border: `1px solid ${
    darkMode ? "#26334a" : "#e6e9ef"
  }`,
  borderRadius: 18,
  padding: 17,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 15,
  marginBottom: 14,
});

const markAllButton = (darkMode) => ({
  border: `1px solid ${
    darkMode ? "#334155" : "#d5dbe5"
  }`,
  background: "transparent",
  color: darkMode ? "#fff" : "#111827",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 750,
  cursor: "pointer",
});

const filterRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  overflowX: "auto",
  paddingBottom: 13,
};

const refreshButton = (darkMode) => ({
  marginLeft: "auto",
  border: `1px solid ${
    darkMode ? "#334155" : "#d9dee7"
  }`,
  background: darkMode ? "#111a2b" : "#fff",
  color: darkMode ? "#fff" : "#111827",
  borderRadius: 999,
  width: 38,
  height: 38,
  fontSize: 20,
  cursor: "pointer",
});

const notificationCard = (
  darkMode,
  unread
) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 13,
  border: `1px solid ${
    unread
      ? darkMode
        ? "#315da8"
        : "#c9dcff"
      : darkMode
      ? "#26334a"
      : "#e6e9ef"
  }`,
  background: unread
    ? darkMode
      ? "#111e35"
      : "#f8fbff"
    : darkMode
    ? "#111a2b"
    : "#fff",
  borderRadius: 17,
  padding: 15,
  marginBottom: 10,
  cursor: "pointer",
  boxShadow: unread
    ? "0 3px 15px rgba(37,99,235,.07)"
    : "none",
});

const unreadBadge = {
  minWidth: 25,
  height: 25,
  padding: "0 7px",
  borderRadius: 999,
  background: "#dc2626",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 900,
};

const newDot = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#dc2626",
  display: "inline-block",
};

const errorBox = (darkMode) => ({
  background: darkMode ? "#3b1720" : "#fee2e2",
  color: darkMode ? "#fecaca" : "#991b1b",
  borderRadius: 14,
  padding: 13,
  marginBottom: 13,
  fontSize: 13,
});

const emptyCard = (darkMode) => ({
  background: darkMode ? "#111a2b" : "#fff",
  border: `1px solid ${
    darkMode ? "#26334a" : "#e6e9ef"
  }`,
  borderRadius: 18,
  padding: 35,
  textAlign: "center",
  marginTop: 8,
});