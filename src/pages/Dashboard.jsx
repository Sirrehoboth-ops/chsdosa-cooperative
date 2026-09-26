import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Dashboard() {
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [slide, setSlide] = useState(0);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    loadMemberData();
  }, []);

  // Moving CHSDOSA slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % 4);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const loadMemberData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    console.log("MEMBER DATA:", memberData);
    console.log("MEMBER ERROR:", memberError);

    if (memberError) {
      console.error(memberError);
    }

    setMember(memberData);

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("member_id", user.id)
      .maybeSingle();

    console.log("ACCOUNT DATA:", accountData);
    console.log("ACCOUNT ERROR:", accountError);

    if (accountData) {
      setBalance(accountData.balance || 0);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div
        style={{
          ...styles.loading,
          background: darkMode ? "#07150f" : "#f4f8f3",
          color: darkMode ? "#ffffff" : "#123b25",
        }}
      >
        <div style={styles.loadingBox}>
          <div style={styles.loadingLogo}>C</div>
          <h2>Loading your account...</h2>
          <p>CHSDOSA Cooperative Society</p>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  const slides = [
    {
      title: "CHSDOSA",
      subtitle: "COOPERATIVE SOCIETY",
      text: "Leadership with Integrity, Unity and Progress",
    },
    {
      title: "SAVE • CONTRIBUTE • GROW",
      subtitle: "YOUR COOPERATIVE JOURNEY",
      text: "Together we build a stronger community.",
    },
    {
      title: "WELCOME MEMBERS",
      subtitle: "YOUR ACCOUNT • YOUR FUTURE",
      text: "Manage your cooperative activities with ease.",
    },
    {
      title: "CHSDOSA",
      subtitle: "UNITY • PROGRESS • DEVELOPMENT",
      text: "Working together for a better tomorrow.",
    },
  ];

  return (
    <div
      style={{
        ...styles.page,
        background: darkMode
          ? "linear-gradient(180deg, #06120d 0%, #0c1d15 100%)"
          : "linear-gradient(180deg, #f4f8f3 0%, #eef4ed 100%)",
        color: darkMode ? "#ffffff" : "#173522",
      }}
    >
      <div style={styles.backgroundPattern} />

      <div style={styles.container}>
        {/* TOP HEADER */}
        <div style={styles.header}>
          <div style={styles.profileArea}>
            <button
              style={{
                ...styles.profilePicture,
                background: darkMode ? "#d6ad3a" : "#176b3a",
              }}
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
            >
              {member?.full_name
                ? member.full_name.charAt(0).toUpperCase()
                : "M"}
            </button>

            <div>
              <p
                style={{
                  ...styles.smallGreeting,
                  color: darkMode ? "#b7c8bd" : "#617466",
                }}
              >
                {greeting}
              </p>

              <h2
                style={{
                  ...styles.memberName,
                  color: darkMode ? "#ffffff" : "#123b25",
                }}
              >
                {member?.full_name || "Member"}
              </h2>
            </div>
          </div>

          <div style={styles.headerActions}>
            <button
              style={{
                ...styles.circleButton,
                background: darkMode ? "#14291f" : "#ffffff",
                color: darkMode ? "#f4c84d" : "#176b3a",
              }}
              onClick={() => setNotifications(0)}
              aria-label="Notifications"
            >
              🔔
              {notifications > 0 && (
                <span style={styles.notificationBadge}>
                  {notifications}
                </span>
              )}
            </button>

            <button
              style={{
                ...styles.circleButton,
                background: darkMode ? "#14291f" : "#ffffff",
                color: darkMode ? "#f4c84d" : "#176b3a",
              }}
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Change theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* SMALL CHSDOSA BRANDING */}
        <div style={styles.brandRow}>
          <div style={styles.brandLogo}>C</div>

          <div>
            <strong
              style={{
                color: darkMode ? "#f4c84d" : "#176b3a",
                letterSpacing: "1px",
              }}
            >
              CHSDOSA
            </strong>

            <p
              style={{
                ...styles.brandText,
                color: darkMode ? "#aebdb4" : "#66766b",
              }}
            >
              Cooperative Society
            </p>
          </div>
        </div>

        {/* MOVING SLIDESHOW */}
        <div
          style={{
            ...styles.slideshow,
            background:
              slide % 2 === 0
                ? "linear-gradient(135deg, #075b30 0%, #123b25 55%, #c99d28 100%)"
                : "linear-gradient(135deg, #123b25 0%, #176b3a 60%, #b98a20 100%)",
          }}
        >
          <div style={styles.slideLogo}>C</div>

          <div style={styles.slideContent}>
            <p style={styles.slideSmall}>{slides[slide].subtitle}</p>

            <h2 style={styles.slideTitle}>
              {slides[slide].title}
            </h2>

            <p style={styles.slideText}>
              {slides[slide].text}
            </p>
          </div>

          <div style={styles.slideDots}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setSlide(index)}
                style={{
                  ...styles.dot,
                  width: index === slide ? "24px" : "7px",
                  opacity: index === slide ? 1 : 0.45,
                }}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* WELCOME */}
        <div
          style={{
            ...styles.welcome,
            background: darkMode ? "#10251a" : "#ffffff",
            borderColor: darkMode ? "#234432" : "#e0e9e1",
          }}
        >
          <h2
            style={{
              ...styles.welcomeTitle,
              color: darkMode ? "#ffffff" : "#123b25",
            }}
          >
            Welcome to CHSDOSA 👋
          </h2>

          <p
            style={{
              ...styles.welcomeText,
              color: darkMode ? "#b7c8bd" : "#647269",
            }}
          >
            Manage your cooperative account, contributions and
            activities from one place.
          </p>

          {member?.member_number && (
            <div
              style={{
                ...styles.memberNumberBox,
                background: darkMode ? "#0a1911" : "#f2f8f3",
              }}
            >
              <span>Member No.</span>
              <strong>{member.member_number}</strong>
            </div>
          )}
        </div>

        {/* BALANCE */}
        <div style={styles.balanceCard}>
          <div style={styles.balanceTop}>
            <div>
              <p style={styles.balanceLabel}>AVAILABLE BALANCE</p>

              <h1 style={styles.balance}>
                ₦
                {Number(balance).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </h1>

              <p style={styles.accountText}>
                CHSDOSA Cooperative Account
              </p>
            </div>

            <div style={styles.balanceIcon}>₦</div>
          </div>

          <div style={styles.balanceButtons}>
            <button
              style={styles.depositButton}
              onClick={() => navigate("/deposit")}
            >
              + Deposit
            </button>

            <button
              style={styles.viewButton}
              onClick={() => navigate("/transactions")}
            >
              View Transactions
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={styles.sectionHeader}>
          <h3
            style={{
              ...styles.sectionTitle,
              color: darkMode ? "#ffffff" : "#173522",
            }}
          >
            Quick Actions
          </h3>
        </div>

        <div style={styles.grid}>
          <button
            style={{
              ...styles.menu,
              background: darkMode ? "#10251a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#173522",
            }}
            onClick={() => navigate("/deposit")}
          >
            <span style={styles.icon}>💰</span>
            <span>Deposit</span>
          </button>

          <button
            style={{
              ...styles.menu,
              background: darkMode ? "#10251a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#173522",
            }}
            onClick={() => navigate("/transactions")}
          >
            <span style={styles.icon}>📊</span>
            <span>Transactions</span>
          </button>

          <button
            style={{
              ...styles.menu,
              background: darkMode ? "#10251a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#173522",
            }}
          >
            <span style={styles.icon}>🤝</span>
            <span>Contributions</span>
          </button>

          <button
            style={{
              ...styles.menu,
              background: darkMode ? "#10251a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#173522",
            }}
            onClick={() => navigate("/profile")}
          >
            <span style={styles.icon}>👤</span>
            <span>My Profile</span>
          </button>

          <button
            style={{
              ...styles.menu,
              background: darkMode ? "#10251a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#173522",
            }}
          >
            <span style={styles.icon}>📅</span>
            <span>Meetings</span>
          </button>

          <button
            style={{
              ...styles.menu,
              background: darkMode ? "#10251a" : "#ffffff",
              color: darkMode ? "#ffffff" : "#173522",
            }}
          >
            <span style={styles.icon}>📋</span>
            <span>Loan</span>
          </button>
        </div>

        {/* HELP / ADMIN CONTACT */}
        <div
          style={{
            ...styles.helpCard,
            background: darkMode ? "#10251a" : "#ffffff",
            borderColor: darkMode ? "#234432" : "#e0e9e1",
          }}
        >
          <div>
            <h3
              style={{
                ...styles.helpTitle,
                color: darkMode ? "#ffffff" : "#173522",
              }}
            >
              Need Help?
            </h3>

            <p
              style={{
                ...styles.helpText,
                color: darkMode ? "#b7c8bd" : "#69766e",
              }}
            >
              Contact CHSDOSA Cooperative administrators for
              assistance.
            </p>
          </div>

          <button
            style={styles.helpButton}
            onClick={() => {
              alert("Admin Contact and Help section coming next.");
            }}
          >
            Help
          </button>
        </div>

        {/* BOTTOM NAVIGATION */}
        <div
          style={{
            ...styles.bottomNav,
            background: darkMode ? "#0d2016" : "#ffffff",
            borderColor: darkMode ? "#234432" : "#e1e8e2",
          }}
        >
          <button
            style={styles.navButtonActive}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span>⌂</span>
            <small>Home</small>
          </button>

          <button
            style={{
              ...styles.navButton,
              color: darkMode ? "#b7c8bd" : "#6b786f",
            }}
            onClick={() => navigate("/transactions")}
          >
            <span>↕</span>
            <small>Transactions</small>
          </button>

          <button
            style={{
              ...styles.navButton,
              color: darkMode ? "#b7c8bd" : "#6b786f",
            }}
          >
            <span>📅</span>
            <small>Meetings</small>
          </button>

          <button
            style={{
              ...styles.navButton,
              color: darkMode ? "#b7c8bd" : "#6b786f",
            }}
            onClick={() => navigate("/profile")}
          >
            <span>👤</span>
            <small>Profile</small>
          </button>
        </div>

        {/* LOGOUT */}
        <button style={styles.logout} onClick={handleLogout}>
          Logout
        </button>

        <p
          style={{
            ...styles.footer,
            color: darkMode ? "#718278" : "#8a958d",
          }}
        >
          CHSDOSA Cooperative Society • Leadership with Integrity,
          Unity and Progress
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "18px 14px 100px",
    boxSizing: "border-box",
    position: "relative",
    overflowX: "hidden",
    transition: "background 0.3s ease, color 0.3s ease",
  },

  backgroundPattern: {
    position: "fixed",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(201,157,40,0.10), transparent 70%)",
    top: "-80px",
    right: "-80px",
    pointerEvents: "none",
    zIndex: 0,
  },

  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "auto",
    position: "relative",
    zIndex: 1,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  profilePicture: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "3px solid #d6ad3a",
    color: "white",
    fontSize: "20px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 5px 15px rgba(0,0,0,0.12)",
  },

  smallGreeting: {
    margin: 0,
    fontSize: "12px",
  },

  memberName: {
    margin: "2px 0 0",
    fontSize: "17px",
  },

  headerActions: {
    display: "flex",
    gap: "8px",
  },

  circleButton: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "1px solid rgba(0,0,0,0.06)",
    cursor: "pointer",
    fontSize: "18px",
    position: "relative",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },

  notificationBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    minWidth: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "#d63b3b",
    color: "white",
    fontSize: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "14px",
  },

  brandLogo: {
    width: "31px",
    height: "31px",
    borderRadius: "9px",
    background: "#176b3a",
    color: "#f4c84d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "17px",
  },

  brandText: {
    margin: "2px 0 0",
    fontSize: "11px",
  },

  slideshow: {
    minHeight: "180px",
    borderRadius: "22px",
    padding: "24px",
    boxSizing: "border-box",
    color: "white",
    position: "relative",
    overflow: "hidden",
    marginBottom: "18px",
    boxShadow: "0 12px 30px rgba(10,60,35,0.20)",
    transition: "background 0.6s ease",
  },

  slideLogo: {
    position: "absolute",
    right: "18px",
    top: "13px",
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    border: "2px solid rgba(244,200,77,0.8)",
    color: "#f4c84d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "31px",
    fontWeight: "900",
    opacity: 0.9,
  },

  slideContent: {
    maxWidth: "80%",
  },

  slideSmall: {
    margin: 0,
    fontSize: "10px",
    letterSpacing: "1.8px",
    color: "#f4c84d",
    fontWeight: "700",
  },

  slideTitle: {
    margin: "7px 0",
    fontSize: "25px",
    lineHeight: 1.1,
    fontWeight: "900",
  },

  slideText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.88)",
  },

  slideDots: {
    position: "absolute",
    bottom: "16px",
    left: "24px",
    display: "flex",
    gap: "5px",
    alignItems: "center",
  },

  dot: {
    height: "7px",
    padding: 0,
    border: "none",
    borderRadius: "10px",
    background: "#f4c84d",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  welcome: {
    padding: "17px",
    borderRadius: "18px",
    marginBottom: "17px",
    border: "1px solid",
    boxShadow: "0 5px 18px rgba(0,0,0,0.04)",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "19px",
  },

  welcomeText: {
    margin: "7px 0 0",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  memberNumberBox: {
    marginTop: "14px",
    padding: "10px 12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
  },

  balanceCard: {
    background:
      "linear-gradient(135deg, #075b30 0%, #123b25 62%, #c99d28 150%)",
    color: "white",
    padding: "22px",
    borderRadius: "21px",
    marginBottom: "21px",
    boxShadow: "0 13px 28px rgba(10,70,40,0.23)",
  },

  balanceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceLabel: {
    margin: 0,
    fontSize: "11px",
    letterSpacing: "1px",
    opacity: 0.82,
  },

  balance: {
    margin: "8px 0 4px",
    fontSize: "35px",
    lineHeight: 1.1,
  },

  accountText: {
    margin: 0,
    opacity: 0.72,
    fontSize: "12px",
  },

  balanceIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f4c84d",
    fontWeight: "900",
    fontSize: "25px",
  },

  balanceButtons: {
    display: "flex",
    gap: "9px",
    marginTop: "19px",
  },

  depositButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "11px",
    background: "#f4c84d",
    color: "#173522",
    fontWeight: "800",
    cursor: "pointer",
  },

  viewButton: {
    flex: 1,
    padding: "12px",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "11px",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },

  sectionHeader: {
    marginBottom: "10px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "17px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  menu: {
    padding: "19px 10px",
    border: "1px solid rgba(100,120,105,0.12)",
    borderRadius: "17px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.04)",
    transition: "transform 0.2s ease",
  },

  icon: {
    fontSize: "27px",
  },

  helpCard: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "17px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  helpTitle: {
    margin: 0,
    fontSize: "16px",
  },

  helpText: {
    margin: "5px 0 0",
    fontSize: "11px",
    lineHeight: 1.4,
  },

  helpButton: {
    border: "none",
    borderRadius: "10px",
    background: "#176b3a",
    color: "white",
    padding: "10px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  bottomNav: {
    position: "fixed",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 28px)",
    maxWidth: "572px",
    padding: "9px 5px",
    borderRadius: "18px",
    border: "1px solid",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.13)",
    zIndex: 20,
  },

  navButton: {
    border: "none",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    fontSize: "19px",
    cursor: "pointer",
  },

  navButtonActive: {
    border: "none",
    background: "transparent",
    color: "#176b3a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    fontSize: "19px",
    fontWeight: "800",
    cursor: "pointer",
  },

  logout: {
    width: "100%",
    marginTop: "18px",
    padding: "12px",
    border: "1px solid #e3d8d8",
    borderRadius: "12px",
    background: "transparent",
    color: "#a13a3a",
    fontWeight: "700",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    fontSize: "10px",
    lineHeight: 1.5,
    margin: "14px 20px 0",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  loadingBox: {
    textAlign: "center",
  },

  loadingLogo: {
    width: "65px",
    height: "65px",
    margin: "0 auto 15px",
    borderRadius: "20px",
    background: "#176b3a",
    color: "#f4c84d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "900",
  },
};

export default Dashboard;