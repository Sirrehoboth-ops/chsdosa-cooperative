import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    setMessage("");

    if (!fullName || !email || !phone || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (!agreed) {
      setMessage(
        "Please read and agree to the Terms & Conditions before creating your account."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            regime: "Current",
          },
        },
      });

      if (error) {
        throw error;
      }

      setMessage(
        "Account created successfully! Please check your email and confirm your account before logging in."
      );

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setMessage(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes pageAppear {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes logoAppear {
          0% {
            opacity: 0;
            transform: translateY(-25px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes titleAppear {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fieldAppear {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes buttonAppear {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes peopleFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .register-input:focus {
          border-color: #c9a227 !important;
          box-shadow: 0 0 0 3px rgba(201,162,39,0.12);
          outline: none;
        }

        .create-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(12,35,64,0.25);
        }

        .login-link:hover {
          color: #c9a227 !important;
        }

        .back-button:hover {
          background: #f5f1e5 !important;
        }

        .terms-link:hover {
          color: #8a6b0b !important;
          text-decoration: underline;
        }

        .close-terms:hover {
          transform: scale(1.05);
        }
      `}</style>

      {/* PROFESSIONAL BACKGROUND */}
      <div style={styles.background}>
        <div style={styles.backgroundOverlay}></div>

        <div style={styles.peopleScene}>
          <div style={{ ...styles.person, ...styles.personOne }}>
            <div style={styles.head}></div>
            <div style={styles.body}></div>
          </div>

          <div style={{ ...styles.person, ...styles.personTwo }}>
            <div style={styles.head}></div>
            <div style={styles.body}></div>
          </div>

          <div style={{ ...styles.person, ...styles.personThree }}>
            <div style={styles.head}></div>
            <div style={styles.body}></div>
          </div>

          <div style={styles.communityCircle}>🤝</div>
        </div>
      </div>

      <div style={styles.pageContent}>
        <div style={styles.card}>

          {/* LOGO */}
          <div style={styles.logoContainer}>
            <img
              src="/WhatsApp%20Image%202026-09-25%20at%205.35.34%20PM.jpeg"
              alt="CHSDOSA Cooperative Society"
              style={styles.logoImage}
            />
          </div>

          {/* TITLE */}
          <div style={styles.titleSection}>
            <div style={styles.portalBadge}>
              MEMBER PORTAL
            </div>

            <h1 style={styles.title}>
              Create Your Account
            </h1>

            <p style={styles.subtitle}>
              Join the CHSDOSA Cooperative Society
            </p>

            <div style={styles.goldLine}></div>
          </div>

          {/* FORM */}

          <div style={styles.fieldWrapper1}>
            <div style={styles.inputIcon}>👤</div>

            <input
              className="register-input"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldWrapper2}>
            <div style={styles.inputIcon}>✉️</div>

            <input
              className="register-input"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldWrapper3}>
            <div style={styles.inputIcon}>📱</div>

            <input
              className="register-input"
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldWrapper4}>
            <div style={styles.inputIcon}>🔒</div>

            <input
              className="register-input"
              type={showPassword ? "text" : "password"}
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.passwordInput}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* TERMS */}
          <div style={styles.termsBox}>
            <label style={styles.termsLabel}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={styles.checkbox}
              />

              <span>
                I have read and agree to the{" "}
                <button
                  type="button"
                  className="terms-link"
                  onClick={() => setShowTerms(true)}
                  style={styles.termsLink}
                >
                  Terms & Conditions
                </button>
              </span>
            </label>
          </div>

          {/* MESSAGE */}

          {message && (
            <div
              style={{
                ...styles.message,
                background: message.includes("successfully")
                  ? "#eaf7ef"
                  : "#fff1f1",
                color: message.includes("successfully")
                  ? "#19733a"
                  : "#b42318",
                borderColor: message.includes("successfully")
                  ? "#b7e2c5"
                  : "#f2b8b5",
              }}
            >
              {message}
            </div>
          )}

          {/* CREATE ACCOUNT */}

          <button
            type="button"
            className="create-button"
            style={{
              ...styles.button,
              opacity: loading ? 0.75 : 1,
            }}
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingContent}>
                <span style={styles.spinner}></span>
                CREATING ACCOUNT...
              </span>
            ) : (
              "CREATE ACCOUNT"
            )}
          </button>

          {/* LOGIN */}

          <p style={styles.loginText}>
            Already have an account?{" "}
            <span
              className="login-link"
              style={styles.loginLink}
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>

          {/* BACK */}

          <button
            type="button"
            className="back-button"
            style={styles.backButton}
            onClick={() => navigate("/")}
          >
            ← Back to Welcome
          </button>

          <p style={styles.footer}>
            CHSDOSA Cooperative Society
            <br />
            <span>Leadership with Integrity, Unity and Progress</span>
            <br />
            <span>Est. 2026</span>
          </p>
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTerms && (
        <div style={styles.modalBackground}>
          <div style={styles.termsModal}>

            <div style={styles.termsHeader}>
              <div>
                <div style={styles.termsSmallTitle}>
                  CHSDOSA COOPERATIVE SOCIETY
                </div>

                <h2 style={styles.termsTitle}>
                  Terms & Conditions
                </h2>
              </div>

              <button
                type="button"
                className="close-terms"
                onClick={() => setShowTerms(false)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.termsContent}>

              <p>
                By registering as a member of the CHSDOSA Cooperative Society,
                you agree to comply with the cooperative's approved rules,
                policies and responsibilities.
              </p>

              <h3>1. Membership</h3>
              <p>
                Members are expected to provide accurate information and
                participate responsibly in the activities of the cooperative.
              </p>

              <h3>2. Development Contribution</h3>
              <p>
                Members agree to the mandatory cooperative development
                contribution of <strong>₦200 per week</strong>, according to
                the schedule approved by the cooperative.
              </p>

              <h3>3. Insufficient Balance</h3>
              <p>
                If there is insufficient money in a member's account when a
                contribution becomes due, the unpaid amount may remain
                outstanding and may be recovered when sufficient funds become
                available, subject to cooperative rules.
              </p>

              <h3>4. Meeting Attendance</h3>
              <p>
                Members are expected to attend official cooperative meetings
                scheduled by the leadership. Members who cannot attend for a
                genuine reason should notify the appropriate leader.
              </p>

              <h3>5. Leadership Responsibility</h3>
              <p>
                Elected and appointed leaders are expected to attend official
                leadership and committee meetings. Repeated absence without a
                reasonable explanation may result in appropriate action under
                the cooperative's approved rules.
              </p>

              <h3>6. Account Security</h3>
              <p>
                Members are responsible for keeping their login information,
                password and account access secure.
              </p>

              <h3>7. Transactions</h3>
              <p>
                Deposits, contributions and other financial transactions must
                be made through approved cooperative procedures and recorded
                appropriately.
              </p>

              <h3>8. Loans</h3>
              <p>
                Membership does not automatically guarantee a loan. Any future
                loan facility will be subject to separate eligibility
                requirements, approval and cooperative rules.
              </p>

              <h3>9. Cooperative Rules</h3>
              <p>
                Members agree to follow the constitution, bye-laws,
                resolutions and other officially approved rules of the
                cooperative.
              </p>

              <h3>10. Privacy</h3>
              <p>
                Personal information provided by members may be used for
                legitimate membership, financial and administrative purposes
                of the cooperative.
              </p>

              <h3>11. Disciplinary Procedures</h3>
              <p>
                Repeated failure to meet approved responsibilities may result
                in appropriate disciplinary action in accordance with the
                cooperative's approved rules and procedures.
              </p>

              <h3>12. Changes to These Terms</h3>
              <p>
                Approved changes to cooperative rules, contributions,
                procedures or member responsibilities may be communicated to
                members through official communication channels.
              </p>

              <div style={styles.termsNotice}>
                <strong>Important:</strong> By checking the agreement box and
                creating an account, you confirm that you have read and
                accepted these Terms & Conditions.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAgreed(true);
                setShowTerms(false);
              }}
              style={styles.agreeButton}
            >
              I HAVE READ & AGREE
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  },

  background: {
    position: "fixed",
    inset: 0,
    background:
      "linear-gradient(135deg, #071a2d 0%, #0c2340 42%, #c9a227 100%)",
    zIndex: 0,
  },

  backgroundOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 75% 25%, rgba(255,255,255,0.20), transparent 25%), radial-gradient(circle at 15% 80%, rgba(255,255,255,0.10), transparent 30%)",
  },

  peopleScene: {
    position: "absolute",
    inset: 0,
    opacity: 0.25,
  },

  person: {
    position: "absolute",
    width: "90px",
    height: "150px",
    animation: "peopleFloat 5s ease-in-out infinite",
  },

  personOne: {
    left: "8%",
    bottom: "8%",
  },

  personTwo: {
    right: "8%",
    bottom: "12%",
    animationDelay: "1s",
  },

  personThree: {
    left: "44%",
    top: "8%",
    transform: "scale(0.75)",
    animationDelay: "2s",
  },

  head: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#ffffff",
    margin: "0 auto",
  },

  body: {
    width: "70px",
    height: "90px",
    borderRadius: "35px 35px 10px 10px",
    background: "#ffffff",
    margin: "8px auto 0",
  },

  communityCircle: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    border: "2px solid rgba(255,255,255,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "45px",
  },

  pageContent: {
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "25px 16px",
    boxSizing: "border-box",
    animation: "pageAppear 0.6s ease-out",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    background: "rgba(255,255,255,0.97)",
    padding: "30px 25px 24px",
    borderRadius: "26px",
    textAlign: "center",
    boxShadow: "0 25px 70px rgba(0,0,0,0.30)",
    boxSizing: "border-box",
    overflow: "hidden",
    backdropFilter: "blur(8px)",
  },

  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "18px",
    animation: "logoAppear 0.8s ease-out forwards",
  },

  logoImage: {
    width: "112px",
    height: "112px",
    objectFit: "contain",
    borderRadius: "50%",
    boxShadow: "0 8px 25px rgba(12,35,64,0.25)",
  },

  titleSection: {
    animation: "titleAppear 0.7s ease-out 0.3s both",
  },

  portalBadge: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "30px",
    background: "#f5f1e5",
    color: "#8a6b0b",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.2px",
  },

  title: {
    margin: "12px 0 6px",
    color: "#0c2340",
    fontSize: "28px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "0",
    color: "#687386",
    fontSize: "14px",
  },

  goldLine: {
    width: "45px",
    height: "3px",
    borderRadius: "5px",
    background: "#c9a227",
    margin: "15px auto 20px",
  },

  fieldWrapper1: {
    position: "relative",
    animation: "fieldAppear 0.5s ease-out 0.55s both",
  },

  fieldWrapper2: {
    position: "relative",
    animation: "fieldAppear 0.5s ease-out 0.65s both",
  },

  fieldWrapper3: {
    position: "relative",
    animation: "fieldAppear 0.5s ease-out 0.75s both",
  },

  fieldWrapper4: {
    position: "relative",
    animation: "fieldAppear 0.5s ease-out 0.85s both",
  },

  inputIcon: {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "17px",
    zIndex: 2,
  },

  input: {
    width: "100%",
    padding: "15px 15px 15px 46px",
    margin: "6px 0",
    border: "1px solid #d8dce2",
    borderRadius: "12px",
    fontSize: "16px",
    boxSizing: "border-box",
    background: "#fafbfc",
    color: "#182230",
    transition: "0.2s",
  },

  passwordInput: {
    width: "100%",
    padding: "15px 48px 15px 46px",
    margin: "6px 0",
    border: "1px solid #d8dce2",
    borderRadius: "12px",
    fontSize: "16px",
    boxSizing: "border-box",
    background: "#fafbfc",
    color: "#182230",
  },

  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "17px",
    padding: "5px",
  },

  termsBox: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "12px",
    background: "#f8f9fb",
    border: "1px solid #e3e6eb",
    textAlign: "left",
  },

  termsLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    color: "#536070",
    fontSize: "12px",
    lineHeight: "1.5",
    cursor: "pointer",
  },

  checkbox: {
    width: "17px",
    height: "17px",
    marginTop: "1px",
    accentColor: "#0c2340",
    cursor: "pointer",
    flexShrink: 0,
  },

  termsLink: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#0c2340",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "12px",
  },

  message: {
    marginTop: "14px",
    padding: "12px",
    border: "1px solid",
    borderRadius: "10px",
    fontSize: "13px",
    lineHeight: "1.5",
    fontWeight: "600",
    animation: "titleAppear 0.3s ease-out",
  },

  button: {
    width: "100%",
    padding: "16px",
    marginTop: "18px",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    cursor: "pointer",
    background: "#0c2340",
    color: "white",
    transition: "0.2s",
    animation: "buttonAppear 0.6s ease-out 1s both",
  },

  loadingContent: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },

  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.35)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  loginText: {
    marginTop: "20px",
    color: "#657184",
    fontSize: "14px",
  },

  loginLink: {
    color: "#0c2340",
    fontWeight: "800",
    cursor: "pointer",
  },

  backButton: {
    marginTop: "8px",
    padding: "9px 16px",
    border: "1px solid #d8dce2",
    borderRadius: "9px",
    background: "white",
    color: "#536070",
    cursor: "pointer",
    fontSize: "13px",
    transition: "0.2s",
  },

  footer: {
    marginTop: "22px",
    marginBottom: "0",
    color: "#9aa2ad",
    fontSize: "10px",
    lineHeight: "1.6",
  },

  modalBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 20,
    background: "rgba(3,15,28,0.72)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
  },

  termsModal: {
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    background: "#ffffff",
    borderRadius: "22px",
    boxShadow: "0 25px 80px rgba(0,0,0,0.40)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    animation: "modalAppear 0.3s ease-out",
  },

  termsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 22px",
    background: "#0c2340",
    color: "white",
  },

  termsSmallTitle: {
    color: "#e3c45c",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  termsTitle: {
    margin: "5px 0 0",
    fontSize: "21px",
  },

  closeButton: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    fontSize: "27px",
    lineHeight: "1",
    cursor: "pointer",
  },

  termsContent: {
    padding: "20px 22px",
    overflowY: "auto",
    textAlign: "left",
    color: "#536070",
    fontSize: "13px",
    lineHeight: "1.65",
  },

  termsContentH3: {
    color: "#0c2340",
  },

  termsNotice: {
    marginTop: "18px",
    padding: "13px",
    borderRadius: "12px",
    background: "#f5f1e5",
    color: "#69530b",
    fontSize: "12px",
  },

  agreeButton: {
    margin: "0 22px 20px",
    padding: "14px",
    border: "none",
    borderRadius: "11px",
    background: "#0c2340",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    letterSpacing: "0.4px",
  },
};

export default Register;