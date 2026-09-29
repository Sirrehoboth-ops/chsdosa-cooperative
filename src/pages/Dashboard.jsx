import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const APP_LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

function Dashboard() {
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [balance, setBalance] = useState(0);

  // App startup / return splash
  const [booting, setBooting] = useState(true);

  // Remember dark mode after refresh/reopening
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("chsdosa-dark-mode") === "true";
  });

  const [slide, setSlide] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Pull-to-refresh state
  const pullStartY = useRef(null);
  const pulling = useRef(false);
  const refreshing = useRef(false);

  /*
   * SAVE DARK MODE
   */
  useEffect(() => {
    localStorage.setItem("chsdosa-dark-mode", String(darkMode));
  }, [darkMode]);

  /*
   * LOAD MEMBER DATA
   *
   * Existing Supabase session is restored automatically.
   * The member is NOT logged out when the app is closed/reopened.
   */
  useEffect(() => {
    let mounted = true;

    const startDashboard = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("SESSION ERROR:", error);
        }

        if (!session?.user) {
          if (mounted) {
            setBooting(false);
            navigate("/login", { replace: true });
          }
          return;
        }

        await loadMemberData(session.user);

        if (mounted) {
          /*
           * Small professional logo appearance when reopening
           * the app with an existing login session.
           */
          setTimeout(() => {
            if (mounted) {
              setBooting(false);
            }
          }, 650);
        }
      } catch (error) {
        console.error("DASHBOARD ERROR:", error);

        if (mounted) {
          setBooting(false);
        }
      }
    };

    startDashboard();

    /*
     * Listen for Supabase authentication changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("AUTH EVENT:", event);

      if (session?.user) {
        await loadMemberData(session.user);

        if (mounted) {
          setBooting(false);
        }
      } else if (event === "SIGNED_OUT") {
        setMember(null);
        setBalance(0);
        setBooting(false);

        navigate("/login", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  /*
   * MOVING CHSDOSA SLIDESHOW
   *
   * No dots or manual indicators.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % 5);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  /*
   * PULL DOWN TO REFRESH
   *
   * Only refreshes when the Dashboard is already at the top.
   * The Dashboard itself is not moved or shifted.
   */
  useEffect(() => {
    const handleTouchStart = (event) => {
      if (window.scrollY !== 0) return;

      pullStartY.current = event.touches?.[0]?.clientY ?? null;
      pulling.current = false;
    };

    const handleTouchMove = (event) => {
      if (pullStartY.current === null) return;
      if (window.scrollY !== 0) return;

      const currentY = event.touches?.[0]?.clientY ?? 0;
      const distance = currentY - pullStartY.current;

      if (distance > 15) {
        pulling.current = true;

        // Prevent the Dashboard itself from being dragged downward.
        event.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling.current) {
        pullStartY.current = null;
        return;
      }

      pullStartY.current = null;
      pulling.current = false;

      if (refreshing.current) return;

      refreshing.current = true;

      try {
        await loadMemberData();
      } finally {
        refreshing.current = false;
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    document.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  /*
   * LOAD MEMBER + ACCOUNT
   */
  const loadMemberData = async (currentUser = null) => {
    try {
      let user = currentUser;

      if (!user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        user = session?.user;
      }

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      /*
       * MEMBER DATA
       */
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

      /*
       * ACCOUNT BALANCE
       */
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("member_id", user.id)
        .maybeSingle();

      console.log("ACCOUNT DATA:", accountData);
      console.log("ACCOUNT ERROR:", accountError);

      if (accountError) {
        console.error(accountError);
      }

      if (accountData) {
        setBalance(Number(accountData.balance || 0));
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error("LOAD MEMBER DATA ERROR:", error);
    }
  };

  /*
   * UPLOAD MEMBER PROFILE PICTURE
   */
  const handleProfileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const fileExt =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${user.id}.${fileExt}`;
      const filePath = `members/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        alert("Unable to upload picture. Please try again.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("members")
        .update({
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("PROFILE UPDATE ERROR:", updateError);

        alert(
          "Picture uploaded, but profile could not be updated."
        );

        return;
      }

      setMember((current) => ({
        ...(current || {}),
        avatar_url: avatarUrl,
      }));

      alert("Profile picture updated successfully.");
    } catch (error) {
      console.error("PROFILE PHOTO ERROR:", error);
      alert("Something went wrong while uploading your picture.");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  /*
   * LOGOUT
   *
   * This is the member-controlled logout.
   */
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("LOGOUT ERROR:", error);
        alert("Unable to log out. Please try again.");
        return;
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }
  };

  /*
   * APP RETURN / STARTUP LOGO
   */
  if (booting) {
    return (
      <div
        style={{
          ...styles.returnSplash,
          background: darkMode
            ? "#07150f"
            : "#f4f8f3",
        }}
      >
        <div style={styles.splashContent}>
          <img
            src={APP_LOGO}
            alt="CHSDOSA Cooperative Society"
            style={styles.splashLogo}
          />

          <p
            style={{
              ...styles.splashText,
              color: darkMode ? "#f4c84d" : "#176b3a",
            }}
          >
            CHSDOSA COOPERATIVE SOCIETY
          </p>
        </div>
      </div>
    );
  }

  /*
   * GREETING
   */
  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  /*
   * SLIDES
   */
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
      title: "LOAN OPPORTUNITY",
      subtitle: "UP TO 1.5× ELIGIBLE SAVINGS",
      text: "Eligible members can apply for a loan according to cooperative rules and approval.",
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
        overscrollBehaviorY: "contain",
      }}
    >
      <div style={styles.backgroundPattern} />

      <div style={styles.container}>
        {/* TOP HEADER */}
        <div style={styles.header}>
          <div style={styles.profileArea}>
            <label
              style={{
                ...styles.profilePicture,
                background: darkMode ? "#d6ad3a" : "#176b3a",
              }}
              title="Upload profile picture"
            >
              {member?.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt="Member profile"
                  style={styles.profileImage}
                />
              ) : (
                member?.full_name
                  ? member.full_name.charAt(0).toUpperCase()
                  : "M"
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleProfileUpload}
                style={styles.hiddenFileInput}
                disabled={uploadingPhoto}
              />
            </label>

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
              onClick={() => navigate("/notifications")}
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
              onClick={() => setDarkMode((current) => !current)}
              aria-label="Change theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* CHSDOSA BRANDING */}
        <div style={styles.brandRow}>
          <img
            src={APP_LOGO}
            alt="CHSDOSA Cooperative Society"
            style={styles.brandLogo}
          />

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

        {/* BALANCE */}
        <div style={styles.balanceCard}>
          <div style={styles.balanceTop}>
            <div>
              <p style={styles.balanceLabel}>
                AVAILABLE BALANCE
              </p>

              <div style={styles.balanceRow}>
                <h1 style={styles.balance}>
                  {showBalance
                    ? `₦${Number(balance).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}`
                    : "₦••••••••"}
                </h1>

                <button
                  style={styles.balanceEye}
                  onClick={() =>
                    setShowBalance((current) => !current)
                  }
                  aria-label={
                    showBalance
                      ? "Hide balance"
                      : "Show balance"
                  }
                >
                  {showBalance ? "👁️" : "🙈"}
                </button>
              </div>

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
          <img
            src={APP_LOGO}
            alt=""
            style={styles.slideBackgroundLogo}
          />

          <div style={styles.slideContent}>
            <p style={styles.slideSmall}>
              {slides[slide].subtitle}
            </p>

            <h2 style={styles.slideTitle}>
              {slides[slide].title}
            </h2>

            <p style={styles.slideText}>
              {slides[slide].text}
            </p>

            {slide === 3 && (
              <button
                style={styles.slideLoanButton}
                onClick={() => navigate("/loan")}
              >
                View Loan
              </button>
            )}
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
            onClick={() => navigate("/contributions")}
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
            onClick={() => navigate("/meeting")}
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
            onClick={() => navigate("/loan")}
          >
            <span style={styles.icon}>📋</span>
            <span>Loan</span>
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
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
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
            onClick={() => navigate("/meeting")}
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
    padding: "15px 12px 100px",
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
    marginBottom: "12px",
  },

  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  profilePicture: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "3px solid #d6ad3a",
    color: "white",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 5px 15px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  hiddenFileInput: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },

  smallGreeting: {
    margin: 0,
    fontSize: "11px",
  },

  memberName: {
    margin: "2px 0 0",
    fontSize: "16px",
  },

  headerActions: {
    display: "flex",
    gap: "7px",
  },

  circleButton: {
    width: "39px",
    height: "39px",
    borderRadius: "50%",
    border: "1px solid rgba(0,0,0,0.06)",
    cursor: "pointer",
    fontSize: "17px",
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
    gap: "8px",
    marginBottom: "11px",
  },

  brandLogo: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    objectFit: "contain",
    background: "#ffffff",
    padding: "2px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
  },

  brandText: {
    margin: "2px 0 0",
    fontSize: "10px",
  },

  balanceCard: {
    background:
      "linear-gradient(135deg, #075b30 0%, #123b25 62%, #c99d28 150%)",
    color: "white",
    padding: "18px",
    borderRadius: "19px",
    marginBottom: "14px",
    boxShadow: "0 13px 28px rgba(10,70,40,0.23)",
  },

  balanceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceLabel: {
    margin: 0,
    fontSize: "10px",
    letterSpacing: "1px",
    opacity: 0.82,
  },

  balanceRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  balance: {
    margin: "7px 0 3px",
    fontSize: "31px",
    lineHeight: 1.1,
  },

  balanceEye: {
    border: "none",
    background: "rgba(255,255,255,0.12)",
    borderRadius: "9px",
    padding: "6px 8px",
    cursor: "pointer",
    fontSize: "15px",
  },

  accountText: {
    margin: 0,
    opacity: 0.72,
    fontSize: "10px",
  },

  balanceIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f4c84d",
    fontWeight: "900",
    fontSize: "23px",
  },

  balanceButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "15px",
  },

  depositButton: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    background: "#f4c84d",
    color: "#173522",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "12px",
  },

  viewButton: {
    flex: 1,
    padding: "10px",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px",
  },

  welcome: {
    padding: "14px",
    borderRadius: "16px",
    marginBottom: "13px",
    border: "1px solid",
    boxShadow: "0 5px 18px rgba(0,0,0,0.04)",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "17px",
  },

  welcomeText: {
    margin: "6px 0 0",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  memberNumberBox: {
    marginTop: "10px",
    padding: "8px 10px",
    borderRadius: "9px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
  },

  slideshow: {
    minHeight: "110px",
    borderRadius: "16px",
    padding: "15px",
    boxSizing: "border-box",
    color: "white",
    position: "relative",
    overflow: "hidden",
    marginBottom: "15px",
    boxShadow: "0 10px 24px rgba(10,60,35,0.17)",
    transition: "background 0.6s ease",
  },

  slideBackgroundLogo: {
    position: "absolute",
    right: "-18px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "125px",
    height: "125px",
    objectFit: "contain",
    opacity: 0.09,
    filter: "grayscale(100%) brightness(2)",
    pointerEvents: "none",
  },

  slideContent: {
    maxWidth: "82%",
    position: "relative",
    zIndex: 2,
  },

  slideSmall: {
    margin: 0,
    fontSize: "8px",
    letterSpacing: "1.4px",
    color: "#f4c84d",
    fontWeight: "700",
  },

  slideTitle: {
    margin: "4px 0",
    fontSize: "18px",
    lineHeight: 1.1,
    fontWeight: "900",
  },

  slideText: {
    margin: 0,
    fontSize: "10px",
    lineHeight: 1.4,
    color: "rgba(255,255,255,0.88)",
  },

  slideLoanButton: {
    marginTop: "8px",
    padding: "6px 11px",
    border: "none",
    borderRadius: "8px",
    background: "#f4c84d",
    color: "#173522",
    fontSize: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  sectionHeader: {
    marginBottom: "8px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  menu: {
    padding: "16px 9px",
    border: "1px solid rgba(100,120,105,0.12)",
    borderRadius: "15px",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.04)",
    transition: "transform 0.2s ease",
  },

  icon: {
    fontSize: "24px",
  },

  bottomNav: {
    position: "fixed",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 24px)",
    maxWidth: "576px",
    padding: "8px 5px",
    borderRadius: "17px",
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
    fontSize: "18px",
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
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
  },

  logout: {
    width: "100%",
    marginTop: "16px",
    padding: "11px",
    border: "1px solid #e3d8d8",
    borderRadius: "11px",
    background: "transparent",
    color: "#a13a3a",
    fontWeight: "700",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    fontSize: "9px",
    lineHeight: 1.5,
    margin: "12px 18px 0",
  },

  /*
   * PROFESSIONAL APP RETURN SPLASH
   */
  returnSplash: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  splashContent: {
    textAlign: "center",
    animation: "chsdosaSplashFade 0.65s ease-out",
  },

  splashLogo: {
    width: "78px",
    height: "78px",
    margin: "0 auto 14px",
    borderRadius: "22px",
    background: "#ffffff",
    padding: "5px",
    objectFit: "contain",
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
  },

  splashText: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.2px",
  },
};

/*
 * Splash animation.
 * It does not affect meeting audio because this is only
 * the Dashboard/app-return screen.
 */
if (
  typeof document !== "undefined" &&
  !document.getElementById("chsdosa-dashboard-animation")
) {
  const style = document.createElement("style");

  style.id = "chsdosa-dashboard-animation";

  style.textContent = `
    @keyframes chsdosaSplashFade {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;

  document.head.appendChild(style);
}

export default Dashboard;