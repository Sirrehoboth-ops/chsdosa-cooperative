import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

const MENU = [
  { id: "overview", icon: "📊", label: "Overview" },
  { id: "members", icon: "👥", label: "Members" },
  { id: "payments", icon: "💳", label: "Payments" },
  { id: "loans", icon: "🏦", label: "Loans" },
  { id: "officers", icon: "👔", label: "Officers" },
  { id: "meetings", icon: "🎙️", label: "Meetings" },
  { id: "restrictions", icon: "🔒", label: "Restrictions" },
  { id: "security", icon: "🛡️", label: "Security & Audit" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const [stats, setStats] = useState({
    members: 0,
    savings: 0,
    development: 0,
    meetings: 0,
    pendingPayments: 0,
    loans: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        navigate("/admin-login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("id, full_name, role, admin_slot, is_active")
        .eq("id", session.user.id)
        .eq("role", "general_admin")
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        await supabase.auth.signOut();
        navigate("/admin-login", { replace: true });
        return;
      }

      setAdmin(data);

      await loadDashboardStats();
    } catch (error) {
      console.error("Admin access error:", error);
      navigate("/admin-login", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardStats() {
    try {
      const [
        membersResult,
        transactionsResult,
        contributionsResult,
      ] = await Promise.all([
        supabase
          .from("members")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("transactions")
          .select("amount, type, status"),

        supabase
          .from("contributions")
          .select("amount, status"),
      ]);

      const membersCount = membersResult.count || 0;

      let savings = 0;
      let pendingPayments = 0;

      if (!transactionsResult.error && transactionsResult.data) {
        transactionsResult.data.forEach((item) => {
          const amount = Number(item.amount || 0);

          if (
            item.status === "success" ||
            item.status === "completed" ||
            item.status === "approved"
          ) {
            if (
              item.type === "savings" ||
              item.type === "deposit"
            ) {
              savings += amount;
            }
          }

          if (
            item.status === "pending"
          ) {
            pendingPayments += 1;
          }
        });
      }

      let development = 0;
      let meetings = 0;

      if (!contributionsResult.error && contributionsResult.data) {
        contributionsResult.data.forEach((item) => {
          if (
            item.status === "success" ||
            item.status === "completed" ||
            item.status === "approved"
          ) {
            const amount = Number(item.amount || 0);

            development += amount;
          }
        });
      }

      setStats({
        members: membersCount,
        savings,
        development,
        meetings,
        pendingPayments,
        loans: 0,
      });
    } catch (error) {
      console.error("Dashboard statistics error:", error);
    }
  }

  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out of General Administration?"
    );

    if (!confirmed) return;

    await supabase.auth.signOut();

    navigate("/admin-login", { replace: true });
  }

  function openPage(page) {
   if (page === "members") {
    navigate("/admin-members");
    return;
   }

   setActivePage(page);
   setMenuOpen(false);
  }

  function formatMoney(amount) {
    return `₦${Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <img src={LOGO} alt="CHSDOSA" style={styles.loadingLogo} />

        <div style={styles.spinner}></div>

        <h2 style={{ marginBottom: 6 }}>
          Checking Administration Access
        </h2>

        <p style={{ color: "#64748b", marginTop: 0 }}>
          Please wait...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          ...(menuOpen ? styles.sidebarOpen : {}),
        }}
      >
        <div style={styles.brand}>
          <img src={LOGO} alt="CHSDOSA" style={styles.logo} />

          <div>
            <div style={styles.brandTitle}>CHSDOSA</div>
            <div style={styles.brandSubtitle}>
              General Administration
            </div>
          </div>
        </div>

        <div style={styles.adminBox}>
          <div style={styles.adminAvatar}>
            {(admin?.full_name || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div style={{ minWidth: 0 }}>
            <strong style={styles.adminName}>
              {admin?.full_name || "Administrator"}
            </strong>

            <div style={styles.adminRole}>
              General Administrator {admin?.admin_slot}
            </div>
          </div>
        </div>

        <nav style={styles.navigation}>
          {MENU.map((item) => (
            <button
              key={item.id}
              onClick={() => openPage(item.id)}
              style={{
                ...styles.menuButton,
                ...(activePage === item.id
                  ? styles.menuButtonActive
                  : {}),
              }}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          🚪 <span>Logout</span>
        </button>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        {/* HEADER */}
        <header style={styles.header}>
          <button
            onClick={() => setMenuOpen((value) => !value)}
            style={styles.mobileMenuButton}
          >
            ☰
          </button>

          <div>
            <h1 style={styles.pageTitle}>
              {MENU.find((item) => item.id === activePage)?.label ||
                "Overview"}
            </h1>

            <p style={styles.pageSubtitle}>
              CHSDOSA Cooperative Administration Center
            </p>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.statusBadge}>
              <span style={styles.statusDot}></span>
              System Active
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <section style={styles.content}>
          {activePage === "overview" && (
            <>
              <div style={styles.welcomeCard}>
                <div>
                  <div style={styles.welcomeSmall}>
                    GENERAL ADMINISTRATION
                  </div>

                  <h2 style={styles.welcomeTitle}>
                    Welcome, {admin?.full_name || "Administrator"}
                  </h2>

                  <p style={styles.welcomeText}>
                    You have full administrative access to the
                    CHSDOSA Cooperative system.
                  </p>
                </div>

                <div style={styles.slotBadge}>
                  ADMIN SLOT {admin?.admin_slot}
                </div>
              </div>

              <div style={styles.statsGrid}>
                <StatCard
                  icon="👥"
                  title="Total Members"
                  value={stats.members.toLocaleString()}
                />

                <StatCard
                  icon="💰"
                  title="Total Savings"
                  value={formatMoney(stats.savings)}
                />

                <StatCard
                  icon="📈"
                  title="Development"
                  value={formatMoney(stats.development)}
                />

                <StatCard
                  icon="🎙️"
                  title="Meeting Charges"
                  value={formatMoney(stats.meetings)}
                />

                <StatCard
                  icon="⏳"
                  title="Pending Payments"
                  value={stats.pendingPayments.toLocaleString()}
                />

                <StatCard
                  icon="🏦"
                  title="Loan Records"
                  value={stats.loans.toLocaleString()}
                />
              </div>

              <div style={styles.sectionTitle}>
                Administration Modules
              </div>

              <div style={styles.moduleGrid}>
                {MENU.filter(
                  (item) => item.id !== "overview"
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openPage(item.id)}
                    style={styles.moduleCard}
                  >
                    <div style={styles.moduleIcon}>
                      {item.icon}
                    </div>

                    <div>
                      <strong>{item.label}</strong>

                      <p>
                        Manage {item.label.toLowerCase()} from
                        General Administration.
                      </p>
                    </div>

                    <span style={styles.arrow}>›</span>
                  </button>
                ))}
              </div>

              <div style={styles.securityNotice}>
                <div style={styles.securityIcon}>🛡️</div>

                <div>
                  <strong>Administrator Security</strong>

                  <p>
                    This dashboard is restricted to authorized
                    General Administrators. Member accounts do not
                    receive access to this area.
                  </p>
                </div>
              </div>
            </>
          )}

          {activePage !== "overview" && (
            <ModulePlaceholder
              title={
                MENU.find((item) => item.id === activePage)?.label
              }
              icon={
                MENU.find((item) => item.id === activePage)?.icon
              }
              onBack={() => openPage("overview")}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>

      <div style={{ minWidth: 0 }}>
        <div style={styles.statTitle}>{title}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

function ModulePlaceholder({ title, icon, onBack }) {
  return (
    <div style={styles.placeholder}>
      <div style={styles.placeholderIcon}>{icon}</div>

      <h2>{title}</h2>

      <p>
        This administration module is ready for integration.
        We will connect it to the CHSDOSA Cooperative database
        next.
      </p>

      <button
        onClick={onBack}
        style={styles.backButton}
      >
        ← Back to Overview
      </button>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    display: "flex",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  loadingScreen: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    textAlign: "center",
  },

  loadingLogo: {
    width: 90,
    height: 90,
    objectFit: "contain",
    marginBottom: 20,
  },

  spinner: {
    width: 30,
    height: 30,
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #0f766e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 18,
  },

  sidebar: {
    width: 260,
    minHeight: "100vh",
    background: "#0f172a",
    color: "#fff",
    padding: 18,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 50,
  },

  sidebarOpen: {
    transform: "translateX(0)",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "8px 5px 22px",
  },

  logo: {
    width: 46,
    height: 46,
    objectFit: "contain",
    borderRadius: 12,
    background: "#fff",
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: 800,
  },

  brandSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },

  adminBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#1e293b",
    padding: 12,
    borderRadius: 14,
    marginBottom: 18,
  },

  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#0f766e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },

  adminName: {
    display: "block",
    fontSize: 13,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 165,
  },

  adminRole: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 3,
  },

  navigation: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    flex: 1,
  },

  menuButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: "11px 12px",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 11,
    textAlign: "left",
    cursor: "pointer",
    fontSize: 13,
  },

  menuButtonActive: {
    background: "#0f766e",
    color: "#fff",
    fontWeight: 700,
  },

  menuIcon: {
    width: 24,
    textAlign: "center",
    fontSize: 17,
  },

  logoutButton: {
    border: "1px solid #334155",
    background: "transparent",
    color: "#fca5a5",
    padding: "11px 12px",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
  },

  main: {
    flex: 1,
    marginLeft: 260,
    minWidth: 0,
  },

  header: {
    minHeight: 78,
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "14px 25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
    boxSizing: "border-box",
  },

  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
  },

  pageSubtitle: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#64748b",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
  },

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 11px",
    borderRadius: 20,
    background: "#ecfdf5",
    color: "#047857",
    fontSize: 11,
    fontWeight: 700,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#10b981",
  },

  mobileMenuButton: {
    display: "none",
    border: "none",
    background: "#f1f5f9",
    borderRadius: 9,
    padding: "8px 11px",
    fontSize: 18,
    cursor: "pointer",
  },

  content: {
    padding: 25,
    maxWidth: 1500,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  welcomeCard: {
    background:
      "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
    color: "#fff",
    borderRadius: 20,
    padding: 25,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 22,
  },

  welcomeSmall: {
    fontSize: 10,
    letterSpacing: 1.2,
    opacity: 0.8,
    fontWeight: 800,
  },

  welcomeTitle: {
    margin: "7px 0",
    fontSize: 24,
  },

  welcomeText: {
    margin: 0,
    fontSize: 13,
    opacity: 0.9,
  },

  slotBadge: {
    padding: "10px 13px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.15)",
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
    marginBottom: 28,
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    alignItems: "center",
    gap: 13,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 21,
    flexShrink: 0,
  },

  statTitle: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 4,
  },

  statValue: {
    fontSize: 18,
    fontWeight: 800,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 800,
    marginBottom: 13,
  },

  moduleGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 13,
  },

  moduleCard: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 15,
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 13,
    textAlign: "left",
    cursor: "pointer",
    color: "#0f172a",
    boxShadow: "0 2px 7px rgba(15,23,42,0.03)",
  },

  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },

  moduleCardP: {
    color: "#64748b",
  },

  arrow: {
    marginLeft: "auto",
    fontSize: 24,
    color: "#94a3b8",
  },

  securityNotice: {
    marginTop: 24,
    background: "#fff",
    border: "1px solid #dbeafe",
    borderRadius: 16,
    padding: 17,
    display: "flex",
    gap: 13,
    alignItems: "flex-start",
  },

  securityIcon: {
    fontSize: 22,
  },

  placeholder: {
    minHeight: 450,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 30,
  },

  placeholderIcon: {
    fontSize: 55,
    marginBottom: 8,
  },

  backButton: {
    marginTop: 12,
    border: "none",
    background: "#0f766e",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
};