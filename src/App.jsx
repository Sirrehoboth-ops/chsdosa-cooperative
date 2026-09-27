import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Transactions from "./pages/Transactions";

function Welcome() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        @keyframes pageIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes logoEntrance {
          0% {
            opacity: 0;
            transform: scale(0.55) translateY(35px);
          }
          65% {
            opacity: 1;
            transform: scale(1.06) translateY(-3px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes logoGlow {
          0%, 100% {
            box-shadow:
              0 12px 35px rgba(23,59,99,0.20),
              0 0 0 rgba(211,155,50,0);
          }

          50% {
            box-shadow:
              0 16px 42px rgba(23,59,99,0.28),
              0 0 28px rgba(211,155,50,0.30);
          }
        }

        @keyframes shimmer {
          0% {
            left: -120%;
            opacity: 0;
          }

          15% {
            opacity: 0.8;
          }

          45% {
            opacity: 0;
          }

          100% {
            left: 130%;
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(28px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUpSoft {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes handsJoin {
          0% {
            opacity: 0;
            transform: scale(0.65) translateY(12px);
          }

          50% {
            opacity: 1;
            transform: scale(1.08);
          }

          75% {
            transform: scale(0.96);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes handsPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(211,155,50,0);
          }

          50% {
            box-shadow: 0 0 0 12px rgba(211,155,50,0.10);
          }
        }

        @keyframes peopleFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-9px) rotate(1deg);
          }
        }

        @keyframes peopleFloatReverse {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(8px) rotate(-1deg);
          }
        }

        @keyframes orbMove {
          0%, 100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(12px, -14px);
          }
        }

        @keyframes buttonIn {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes arrowMove {
          0%, 100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(4px);
          }
        }

        .welcome-page {
          animation: pageIn 0.8s ease-out both;
        }

        .logo-animation {
          animation:
            logoEntrance 1s cubic-bezier(.22,1,.36,1) both,
            logoGlow 3.5s ease-in-out 1.2s infinite;
        }

        .logo-shimmer {
          animation: shimmer 3.5s ease-in-out 1.4s infinite;
        }

        .badge-animation {
          animation: slideUp 0.7s ease-out 0.55s both;
        }

        .title-animation {
          animation: slideUp 0.7s ease-out 0.7s both;
        }

        .heading-animation {
          animation: slideUp 0.7s ease-out 0.85s both;
        }

        .motto-animation {
          animation: slideUpSoft 0.8s ease-out 1s both;
        }

        .hands-animation {
          animation:
            handsJoin 0.9s cubic-bezier(.22,1,.36,1) 1.1s both,
            handsPulse 2.8s ease-in-out 2s infinite;
        }

        .card-animation {
          animation: slideUp 0.8s ease-out 1.25s both;
        }

        .login-animation {
          animation: buttonIn 0.7s ease-out 1.45s both;
        }

        .register-animation {
          animation: buttonIn 0.7s ease-out 1.6s both;
        }

        .footer-animation {
          animation: slideUpSoft 0.7s ease-out 1.8s both;
        }

        .people-one {
          animation: peopleFloat 5s ease-in-out infinite;
        }

        .people-two {
          animation: peopleFloatReverse 6s ease-in-out 1s infinite;
        }

        .people-three {
          animation: peopleFloat 5.5s ease-in-out 0.5s infinite;
        }

        .orb-one {
          animation: orbMove 7s ease-in-out infinite;
        }

        .orb-two {
          animation: orbMove 8s ease-in-out 1s infinite reverse;
        }

        .login-animation:hover {
          transform: translateY(-3px);
          box-shadow: 0 13px 30px rgba(23,59,99,0.30);
        }

        .register-animation:hover {
          transform: translateY(-3px);
          background: #f5f8fc;
          box-shadow: 0 8px 20px rgba(23,59,99,0.10);
        }

        .login-animation:hover .arrow {
          animation: arrowMove 0.8s ease-in-out infinite;
        }

        .login-animation,
        .register-animation {
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        @media (max-width: 480px) {
          .community-background {
            opacity: 0.45 !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .welcome-page,
          .logo-animation,
          .logo-shimmer,
          .badge-animation,
          .title-animation,
          .heading-animation,
          .motto-animation,
          .hands-animation,
          .card-animation,
          .login-animation,
          .register-animation,
          .footer-animation,
          .people-one,
          .people-two,
          .people-three,
          .orb-one,
          .orb-two {
            animation: none !important;
          }
        }
      `}</style>

      <div style={styles.page} className="welcome-page">

        <div
          style={{
            ...styles.orb,
            ...styles.orbOne,
          }}
          className="orb-one"
        />

        <div
          style={{
            ...styles.orb,
            ...styles.orbTwo,
          }}
          className="orb-two"
        />

        <div
          style={styles.communityBackground}
          className="community-background"
        >

          <div
            style={{
              ...styles.peopleGroup,
              ...styles.peopleGroupLeft,
            }}
            className="people-one"
          >
            <div style={styles.personHead}></div>
            <div style={styles.personBody}></div>
            <div style={styles.personArm}></div>
          </div>

          <div
            style={{
              ...styles.peopleGroup,
              ...styles.peopleGroupRight,
            }}
            className="people-two"
          >
            <div style={styles.personHead}></div>
            <div style={styles.personBody}></div>
            <div style={styles.personArm}></div>
          </div>

          <div
            style={{
              ...styles.peopleGroup,
              ...styles.peopleGroupBottom,
            }}
            className="people-three"
          >
            <div style={styles.personHead}></div>
            <div style={styles.personBody}></div>
            <div style={styles.personArm}></div>
          </div>

          <div style={styles.connectionLineOne}></div>
          <div style={styles.connectionLineTwo}></div>

        </div>

        <div style={styles.content}>

          <div style={styles.logoWrapper}>
            <div
              style={styles.logoGlowRing}
              className="logo-animation"
            >
              <img
                src="/chsdosa-cooperative/chsdosa-icon.png"
                alt="CHSDOSA Cooperative Society"
                style={styles.logoImage}
              />

              <div
                style={styles.logoShimmer}
                className="logo-shimmer"
              />
            </div>
          </div>

          <div
            style={styles.statusBadge}
            className="badge-animation"
          >
            COOPERATIVE SOCIETY
          </div>

          <h1
            style={styles.logoTitle}
            className="title-animation"
          >
            CHSDOSA
          </h1>

          <h2
            style={styles.heading}
            className="heading-animation"
          >
            Building Together.
            <br />
            Growing Together.
          </h2>

          <p
            style={styles.motto}
            className="motto-animation"
          >
            Leadership with Integrity, Unity and Progress
          </p>

          <div
            style={styles.handsWrapper}
            className="hands-animation"
          >
            <div style={styles.handLeft}>
              🤝
            </div>
          </div>

          <div style={styles.divider}></div>

          <div
            style={styles.welcomeCard}
            className="card-animation"
          >
            <div style={styles.cardIcon}>
              🌍
            </div>

            <div style={styles.cardTitle}>
              One Community. One Future.
            </div>

            <p style={styles.welcomeText}>
              Welcome to the CHSDOSA Cooperative Society.
              <br />
              Together, we build a stronger future.
            </p>
          </div>

          <div style={styles.buttons}>

            <button
              type="button"
              style={styles.loginButton}
              className="login-animation"
              onClick={() => navigate("/login")}
            >
              <span>LOGIN</span>

              <span
                style={styles.arrow}
                className="arrow"
              >
                →
              </span>
            </button>

            <button
              type="button"
              style={styles.registerButton}
              className="register-animation"
              onClick={() => navigate("/register")}
            >
              CREATE ACCOUNT
            </button>

          </div>

          <div
            style={styles.footer}
            className="footer-animation"
          >
            <p style={styles.footerMain}>
              CHSDOSA Cooperative Society
            </p>

            <p style={styles.footerSmall}>
              Leadership • Unity • Progress
            </p>

            <p style={styles.established}>
              EST. 2026
            </p>
          </div>

        </div>
      </div>
    </>
  );
}


/* =========================
   APP ROUTES
========================= */

function App() {
  return (
    <HashRouter>
      <Routes>

        <Route
          path="/"
          element={<Welcome />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/deposit"
          element={<Deposit />}
        />

        <Route
          path="/transactions"
          element={<Transactions />}
        />

      </Routes>
    </HashRouter>
  );
}


/* =========================
   STYLES
========================= */

const styles = {

  page: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    padding: "38px 20px 28px",

    background:
      "linear-gradient(145deg, #f8f5ef 0%, #f1eadc 48%, #e5d9c5 100%)",

    color: "#18212f",

    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  content: {
    width: "100%",
    maxWidth: "430px",

    textAlign: "center",

    position: "relative",
    zIndex: 5,
  },

  orb: {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },

  orbOne: {
    width: "210px",
    height: "210px",
    top: "-90px",
    left: "-80px",
    background: "rgba(23,59,99,0.07)",
  },

  orbTwo: {
    width: "190px",
    height: "190px",
    bottom: "-90px",
    right: "-75px",
    background: "rgba(211,155,50,0.11)",
  },

  communityBackground: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
    opacity: 0.62,
  },

  peopleGroup: {
    position: "absolute",
    width: "60px",
    height: "95px",
    opacity: 0.20,
  },

  peopleGroupLeft: {
    left: "4%",
    top: "30%",
  },

  peopleGroupRight: {
    right: "4%",
    top: "40%",
  },

  peopleGroupBottom: {
    left: "18%",
    bottom: "4%",
    transform: "scale(0.8)",
  },

  personHead: {
    position: "absolute",
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    left: "17px",
    top: "2px",
    background: "#173b63",
  },

  personBody: {
    position: "absolute",
    width: "42px",
    height: "52px",
    left: "8px",
    top: "28px",
    borderRadius: "22px 22px 10px 10px",
    background:
      "linear-gradient(135deg, #173b63, #d39b32)",
  },

  personArm: {
    position: "absolute",
    width: "43px",
    height: "9px",
    left: "31px",
    top: "43px",
    borderRadius: "20px",
    background: "#d39b32",
    transform: "rotate(-25deg)",
  },

  connectionLineOne: {
    position: "absolute",
    width: "150px",
    height: "1px",
    left: "8%",
    top: "39%",
    background:
      "linear-gradient(90deg, transparent, rgba(23,59,99,0.18), transparent)",
    transform: "rotate(-10deg)",
  },

  connectionLineTwo: {
    position: "absolute",
    width: "170px",
    height: "1px",
    right: "6%",
    top: "52%",
    background:
      "linear-gradient(90deg, transparent, rgba(211,155,50,0.22), transparent)",
    transform: "rotate(12deg)",
  },

  logoWrapper: {
    width: "128px",
    height: "128px",
    margin: "0 auto 15px",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  logoGlowRing: {
    width: "112px",
    height: "112px",

    borderRadius: "32px",

    position: "relative",
    overflow: "hidden",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    background: "#ffffff",

    border:
      "2px solid rgba(211,155,50,0.40)",

    padding: "7px",
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    position: "relative",
    zIndex: 2,
    borderRadius: "24px",
  },

  logoShimmer: {
    position: "absolute",
    top: "-50%",
    left: "-120%",
    width: "42%",
    height: "200%",

    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.80), transparent)",

    transform: "rotate(18deg)",

    zIndex: 3,
    pointerEvents: "none",
  },

  statusBadge: {
    display: "inline-block",

    padding: "7px 13px",

    borderRadius: "30px",

    background: "#fff2d2",
    color: "#8a621c",

    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1px",

    marginBottom: "8px",

    border:
      "1px solid rgba(211,155,50,0.25)",
  },

  logoTitle: {
    margin: "0",

    color: "#173b63",

    fontSize: "39px",
    fontWeight: "900",

    letterSpacing: "1.5px",
    lineHeight: "1.1",
  },

  heading: {
    margin: "11px 0 0",

    color: "#526071",

    fontSize: "19px",
    lineHeight: "1.42",

    fontWeight: "700",
  },

  motto: {
    margin: "11px auto 0",

    maxWidth: "340px",

    color: "#687585",

    fontSize: "13px",
    lineHeight: "1.6",

    fontWeight: "600",
  },

  handsWrapper: {
    width: "58px",
    height: "42px",

    margin: "10px auto 2px",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    borderRadius: "50%",

    position: "relative",
    zIndex: 4,
  },

  handLeft: {
    fontSize: "30px",
    lineHeight: "1",

    filter:
      "drop-shadow(0 4px 8px rgba(23,59,99,0.15))",
  },

  divider: {
    width: "58px",
    height: "4px",

    margin: "10px auto 17px",

    borderRadius: "10px",

    background:
      "linear-gradient(90deg, #173b63, #d39b32)",
  },

  welcomeCard: {
    padding: "17px 17px",

    borderRadius: "20px",

    marginBottom: "21px",

    background:
      "rgba(255,255,255,0.91)",

    border:
      "1px solid rgba(23,59,99,0.08)",

    boxShadow:
      "0 12px 35px rgba(23,59,99,0.10)",

    backdropFilter: "blur(10px)",
  },

  cardIcon: {
    fontSize: "26px",
    marginBottom: "3px",
  },

  cardTitle: {
    color: "#173b63",
    fontSize: "14px",
    fontWeight: "800",
    marginBottom: "5px",
  },

  welcomeText: {
    margin: "0",

    color: "#526071",

    fontSize: "13px",
    lineHeight: "1.65",

    fontWeight: "500",
  },

  buttons: {
    width: "100%",
  },

  loginButton: {
    width: "100%",

    padding: "16px",

    marginBottom: "11px",

    border: "none",
    borderRadius: "14px",

    background:
      "linear-gradient(135deg, #173b63, #245d8f)",

    color: "#ffffff",

    fontSize: "16px",
    fontWeight: "800",

    cursor: "pointer",

    letterSpacing: "0.6px",

    boxShadow:
      "0 8px 22px rgba(23,59,99,0.22)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    gap: "10px",
  },

  arrow: {
    fontSize: "20px",
    lineHeight: "1",
  },

  registerButton: {
    width: "100%",

    padding: "15px",

    borderRadius: "14px",

    background: "#ffffff",

    color: "#173b63",

    border: "2px solid #173b63",

    fontSize: "15px",
    fontWeight: "800",

    cursor: "pointer",

    letterSpacing: "0.4px",

    boxShadow:
      "0 5px 15px rgba(23,59,99,0.06)",
  },

  footer: {
    marginTop: "23px",
  },

  footerMain: {
    margin: "0 0 4px",

    color: "#687585",

    fontSize: "12px",
    fontWeight: "700",
  },

  footerSmall: {
    margin: "0",

    color: "#9aa3ad",

    fontSize: "10px",

    letterSpacing: "0.4px",
  },

  established: {
    margin: "7px 0 0",

    color: "#a17a2a",

    fontSize: "9px",
    fontWeight: "800",

    letterSpacing: "1.5px",
  },
};

export default App;