import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regime, setRegime] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * STRONG PASSWORD RULES
   *
   * 8+ characters
   * Uppercase
   * Lowercase
   * Number
   * Symbol
   */
  const passwordRules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const strongPassword = Object.values(passwordRules).every(
    Boolean
  );

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanRegime = regime.trim();

    if (!cleanName) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!cleanPhone) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (!cleanRegime) {
      setMessage("Please enter your regime / set.");
      return;
    }

    /*
     * STRONG PASSWORD VALIDATION
     */
    if (!strongPassword) {
      setMessage(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one symbol."
      );
      return;
    }

    if (!agreed) {
      setMessage("Please accept the Terms & Conditions.");
      return;
    }

    try {
      setLoading(true);

      console.log(
        "CHSDOSA registration started:",
        cleanEmail
      );

      const { data, error } =
        await supabase.functions.invoke("register-member", {
          body: {
            fullName: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            regime: cleanRegime,
            password,
          },
        });

      console.log("register-member response:", {
        data,
        error,
      });

      /*
       * Supabase can place the Edge Function response
       * inside error.context when the function returns
       * a non-2xx status.
       */
      let serverResponse = null;

      if (error?.context) {
        try {
          serverResponse = await error.context.json();

          console.log(
            "register-member server response:",
            serverResponse
          );
        } catch (responseError) {
          console.error(
            "Could not read Edge Function response:",
            responseError
          );
        }
      }

      /*
       * EXISTING VERIFIED ACCOUNT
       */
      if (
        serverResponse?.code === "EMAIL_ALREADY_VERIFIED" ||
        serverResponse?.verified === true
      ) {
        setMessage(
          "This email is already verified. Please login."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1500);

        return;
      }

      /*
       * EXISTING UNVERIFIED ACCOUNT
       *
       * If the Edge Function successfully resent
       * the verification code, go to verification.
       */
      if (
        serverResponse?.success === true &&
        (
          serverResponse?.resent === true ||
          serverResponse?.existing === true
        )
      ) {
        localStorage.setItem(
          "chsdosa-verification-email",
          cleanEmail
        );

        navigate("/verify-code", {
          state: {
            email: cleanEmail,
          },
        });

        return;
      }

      /*
       * EDGE FUNCTION ERROR
       */
      if (error) {
        console.error(
          "Registration function error:",
          error
        );

        setMessage(
          serverResponse?.error ||
            error.message ||
            "Unable to create your account. Please try again."
        );

        return;
      }

      /*
       * NORMAL NEW ACCOUNT REGISTRATION
       */
      if (data?.success) {
        localStorage.setItem(
          "chsdosa-verification-email",
          cleanEmail
        );

        navigate("/verify-code", {
          state: {
            email: cleanEmail,
          },
        });

        return;
      }

      setMessage(
        data?.error ||
          "Unable to create your account. Please try again."
      );
    } catch (error) {
      console.error(
        "CHSDOSA registration error:",
        error
      );

      setMessage(
        error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * PASSWORD CHECK ITEM
   */
  const PasswordRule = ({ passed, children }) => {
    return (
      <div
        style={{
          ...styles.passwordRule,
          color: passed ? "#087443" : "#888",
        }}
      >
        <span
          style={{
            ...styles.ruleIcon,
            background: passed ? "#087443" : "#ddd",
            color: passed ? "#fff" : "#777",
          }}
        >
          {passed ? "✓" : "•"}
        </span>

        <span>{children}</span>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img
            src="/chsdosa-cooperative/chsdosa-icon.png"
            alt="CHSDOSA"
            style={styles.logo}
          />
        </div>

        <h1 style={styles.title}>
          Create Account
        </h1>

        <p style={styles.subtitle}>
          Join CHSDOSA Cooperative Society
        </p>

        <form onSubmit={handleRegister}>
          <input
            style={styles.input}
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            disabled={loading}
            autoComplete="name"
          />

          <input
            style={styles.input}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            disabled={loading}
            autoComplete="email"
          />

          <input
            style={styles.input}
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            disabled={loading}
            autoComplete="tel"
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Regime / Set (e.g. 2016 Set)"
            value={regime}
            onChange={(e) =>
              setRegime(e.target.value)
            }
            disabled={loading}
          />

          {/* PASSWORD */}
          <div style={styles.passwordWrap}>
            <input
              style={{
                ...styles.input,
                paddingRight: "55px",
                marginBottom: "8px",
              }}
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Create Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (previous) => !previous
                )
              }
              style={styles.eyeButton}
              disabled={loading}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* PASSWORD REQUIREMENTS */}
          <div style={styles.passwordBox}>
            <div style={styles.passwordTitle}>
              Password requirements
            </div>

            <PasswordRule
              passed={passwordRules.minLength}
            >
              At least 8 characters
            </PasswordRule>

            <PasswordRule
              passed={passwordRules.uppercase}
            >
              At least one uppercase letter (A-Z)
            </PasswordRule>

            <PasswordRule
              passed={passwordRules.lowercase}
            >
              At least one lowercase letter (a-z)
            </PasswordRule>

            <PasswordRule
              passed={passwordRules.number}
            >
              At least one number (0-9)
            </PasswordRule>

            <PasswordRule
              passed={passwordRules.symbol}
            >
              At least one symbol (! @ # $ % ...)
            </PasswordRule>

            {password.length > 0 && (
              <div
                style={{
                  ...styles.passwordStatus,
                  color: strongPassword
                    ? "#087443"
                    : "#b45309",
                }}
              >
                {strongPassword
                  ? "✓ Strong password"
                  : "Complete all requirements"}
              </div>
            )}
          </div>

          {/* TERMS */}
          <label style={styles.termsRow}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) =>
                setAgreed(e.target.checked)
              }
              disabled={loading}
            />

            <span>
              I agree to the{" "}
              <button
                type="button"
                onClick={() =>
                  setShowTerms(true)
                }
                style={styles.termsButton}
                disabled={loading}
              >
                Terms & Conditions
              </button>
            </span>
          </label>

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.registerButton,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Checking Account..."
              : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={styles.loginButton}
          disabled={loading}
        >
          Already have an account? Login
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          style={styles.backButton}
          disabled={loading}
        >
          ← Back
        </button>
      </div>

      {/* TERMS MODAL */}
      {showTerms && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>
              CHSDOSA Cooperative Terms & Conditions
            </h2>

            <div style={styles.termsContent}>
              <p>
                By registering, you agree to follow
                the rules and guidelines of CHSDOSA
                Cooperative Society.
              </p>

              <p>
                <strong>
                  Development Contribution:
                </strong>{" "}
                Members are required to contribute
                ₦200 weekly toward cooperative
                development.
              </p>

              <p>
                <strong>Meeting:</strong> Members are
                expected to participate in cooperative
                meetings and observe applicable meeting
                requirements.
              </p>

              <p>
                <strong>Account Security:</strong> Keep
                your login details private and do not
                share your password with another person.
              </p>

              <p>
                <strong>Transactions:</strong> Members
                are responsible for ensuring that their
                deposits and other transactions are made
                through the approved cooperative
                channels.
              </p>

              <p>
                <strong>Loans:</strong> Loan applications
                are subject to cooperative eligibility
                requirements and approval.
              </p>

              <p>
                <strong>Cooperative Rules:</strong>{" "}
                Members agree to respect the
                constitution, rules, decisions and
                procedures of the cooperative.
              </p>

              <p>
                <strong>Privacy:</strong> Information
                supplied during registration may be used
                for legitimate cooperative administration
                and member services.
              </p>

              <p>
                <strong>
                  Disciplinary Procedures:
                </strong>{" "}
                Members may be subject to applicable
                cooperative disciplinary procedures for
                violations of cooperative rules.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowTerms(false)
              }
              style={styles.closeButton}
            >
              Close
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background:
      "linear-gradient(135deg, #f4fff8 0%, #e8f7ef 50%, #fff8df 100%)",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "30px 24px",
    boxShadow:
      "0 15px 45px rgba(0,0,0,0.12)",
    boxSizing: "border-box",
  },

  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px",
  },

  logo: {
    width: "82px",
    height: "82px",
    objectFit: "contain",
    borderRadius: "50%",
  },

  title: {
    textAlign: "center",
    margin: "5px 0",
    color: "#075b35",
    fontSize: "28px",
    fontWeight: "800",
  },

  subtitle: {
    textAlign: "center",
    margin: "0 0 24px",
    color: "#666",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    marginBottom: "14px",
    borderRadius: "12px",
    border: "1px solid #d5ded9",
    outline: "none",
    fontSize: "15px",
    background: "#fbfffd",
  },

  passwordWrap: {
    position: "relative",
  },

  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "2px",
    height: "48px",
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
  },

  passwordBox: {
    background: "#f7faf8",
    border: "1px solid #e1e9e4",
    borderRadius: "12px",
    padding: "12px 14px",
    marginBottom: "16px",
  },

  passwordTitle: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#075b35",
    marginBottom: "8px",
  },

  passwordRule: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    marginBottom: "6px",
    transition: "0.2s",
  },

  ruleIcon: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "11px",
    fontWeight: "800",
  },

  passwordStatus: {
    fontSize: "12px",
    fontWeight: "800",
    marginTop: "8px",
  },

  termsRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "13px",
    color: "#555",
    margin: "4px 0 15px",
    lineHeight: "1.5",
  },

  termsButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#087443",
    fontWeight: "700",
    cursor: "pointer",
  },

  message: {
    padding: "11px 12px",
    marginBottom: "14px",
    borderRadius: "10px",
    background: "#f0f8f3",
    color: "#075b35",
    fontSize: "13px",
    lineHeight: "1.4",
  },

  registerButton: {
    width: "100%",
    border: "none",
    borderRadius: "13px",
    padding: "15px",
    background:
      "linear-gradient(135deg, #087443, #075b35)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  loginButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#087443",
    marginTop: "18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  backButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#777",
    marginTop: "14px",
    fontSize: "14px",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "500px",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    boxSizing: "border-box",
  },

  termsContent: {
    color: "#555",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  closeButton: {
    width: "100%",
    marginTop: "15px",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#075b35",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
};