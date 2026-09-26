import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    const user = data.user;

    const {
      data: existingMember,
      error: memberCheckError,
    } = await supabase
      .from("members")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (memberCheckError) {
      setLoading(false);
      setMessage(memberCheckError.message);
      return;
    }

    if (!existingMember) {
      const fullName =
        user.user_metadata?.full_name ||
        "CHSDOSA Member";

      const phone =
        user.user_metadata?.phone || "";

      const regime =
        user.user_metadata?.regime || "Current";

      const memberNumber =
        "CHS-" +
        Math.floor(100000 + Math.random() * 900000);

      const {
        error: memberInsertError,
      } = await supabase
        .from("members")
        .insert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          phone: phone,
          regime: regime,
          member_number: memberNumber,
        });

      if (memberInsertError) {
        setLoading(false);
        setMessage(memberInsertError.message);
        return;
      }
    }

    const {
      data: existingAccount,
      error: accountCheckError,
    } = await supabase
      .from("accounts")
      .select("id")
      .eq("member_id", user.id)
      .maybeSingle();

    if (accountCheckError) {
      setLoading(false);
      setMessage(accountCheckError.message);
      return;
    }

    if (!existingAccount) {
      const {
        error: accountInsertError,
      } = await supabase
        .from("accounts")
        .insert({
          member_id: user.id,
          balance: 0,
        });

      if (accountInsertError) {
        setLoading(false);
        setMessage(accountInsertError.message);
        return;
      }
    }

    setLoading(false);

    navigate("/dashboard");
  };

  return (
    <div style={styles.page}>

      {/* Subtle background decoration */}
      <div style={styles.backgroundHelp}>
        HELP & SUPPORT
      </div>

      <div style={styles.backgroundCircleOne}></div>
      <div style={styles.backgroundCircleTwo}></div>

      {/* Back button */}
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate("/")}
        aria-label="Back to welcome"
      >
        ←
      </button>

      <div style={styles.container}>

        {/* Real CHSDOSA Logo */}
        <div style={styles.logoArea}>
          <img
            src="/WhatsApp%20Image%202026-09-25%20at%205.35.34%20PM.jpeg"
            alt="CHSDOSA Cooperative Society"
            style={styles.logoImage}
          />
        </div>

        <div style={styles.brand}>
          CHSDOSA
        </div>

        <div style={styles.badge}>
          MEMBER PORTAL
        </div>

        <h1 style={styles.title}>
          Welcome Back
        </h1>

        <p style={styles.subtitle}>
          Sign in to access your cooperative account
        </p>

        {/* Login Card */}
        <div style={styles.card}>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Email Address
            </label>

            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                ✉️
              </span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                style={styles.input}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Password
            </label>

            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                🔒
              </span>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                style={styles.input}
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                style={styles.eyeButton}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            type="button"
            style={{
              ...styles.loginButton,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingContent}>
                <span style={styles.spinner}></span>
                SIGNING IN...
              </span>
            ) : (
              "SIGN IN"
            )}
          </button>

          {/* Error message */}
          {message && (
            <div style={styles.message}>
              ⚠️ {message}
            </div>
          )}

          {/* Forgot password */}
          <button
            type="button"
            style={styles.forgot}
            onClick={() =>
              setMessage(
                "Password recovery will be connected here."
              )
            }
          >
            Forgot Password?
          </button>

        </div>

        {/* Create account */}
        <div style={styles.registerArea}>
          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
            style={styles.registerLink}
          >
            Create Account
          </button>
        </div>

        {/* Very subtle Help */}
        <button
          type="button"
          style={styles.helpLink}
          onClick={() =>
            setMessage(
              "For login or registration assistance, please contact the CHSDOSA administrator."
            )
          }
        >
          <span style={styles.helpIcon}>?</span>
          Need help?
        </button>

        <p style={styles.footer}>
          CHSDOSA Cooperative Society
        </p>

        <p style={styles.motto}>
          Leadership with Integrity, Unity and Progress
        </p>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "linear-gradient(145deg, #f7f9fc 0%, #edf3f8 55%, #e1ebf4 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "35px 20px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },

  backgroundHelp: {
    position: "absolute",
    top: "12%",
    right: "-45px",
    color: "rgba(23,59,99,0.035)",
    fontSize: "58px",
    fontWeight: "900",
    letterSpacing: "3px",
    transform: "rotate(-18deg)",
    pointerEvents: "none",
    userSelect: "none",
  },

  backgroundCircleOne: {
    position: "absolute",
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    background: "rgba(244,206,112,0.10)",
    top: "-90px",
    left: "-90px",
    pointerEvents: "none",
  },

  backgroundCircleTwo: {
    position: "absolute",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background: "rgba(23,59,99,0.045)",
    bottom: "-130px",
    right: "-100px",
    pointerEvents: "none",
  },

  backButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    border: "1px solid #d8e0e8",
    background: "#ffffff",
    color: "#173b63",
    fontSize: "22px",
    cursor: "pointer",
    boxShadow:
      "0 5px 15px rgba(23,59,99,0.10)",
    zIndex: 5,
  },

  container: {
    width: "100%",
    maxWidth: "430px",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  },

  logoArea: {
    width: "88px",
    height: "88px",
    margin: "0 auto 10px",
    borderRadius: "25px",
    background: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "7px",
    boxSizing: "border-box",
    boxShadow:
      "0 10px 28px rgba(23,59,99,0.14)",
    border: "1px solid #e1e8ef",
  },

  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "18px",
  },

  brand: {
    color: "#173b63",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  badge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "6px 11px",
    borderRadius: "20px",
    background: "#fff1cf",
    color: "#8a621c",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.8px",
  },

  title: {
    margin: "20px 0 6px",
    color: "#18212f",
    fontSize: "28px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "0 0 22px",
    color: "#647181",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px 20px",
    boxShadow:
      "0 15px 40px rgba(23,59,99,0.12)",
    border: "1px solid #e5ebf1",
    textAlign: "left",
  },

  fieldGroup: {
    marginBottom: "17px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#263548",
    fontSize: "13px",
    fontWeight: "700",
  },

  inputWrapper: {
    width: "100%",
    minHeight: "52px",
    display: "flex",
    alignItems: "center",
    border: "1px solid #d7e0e8",
    borderRadius: "13px",
    background: "#f9fbfd",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  inputIcon: {
    paddingLeft: "14px",
    paddingRight: "8px",
    fontSize: "16px",
  },

  input: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "14px 8px",
    fontSize: "15px",
    color: "#18212f",
    boxSizing: "border-box",
  },

  eyeButton: {
    border: "none",
    background: "transparent",
    padding: "10px",
    cursor: "pointer",
    fontSize: "16px",
  },

  loginButton: {
    width: "100%",
    padding: "15px",
    marginTop: "4px",
    border: "none",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, #173b63, #245d8f)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(23,59,99,0.20)",
  },

  loadingContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
  },

  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.45)",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    display: "inline-block",
  },

  message: {
    marginTop: "15px",
    padding: "11px",
    borderRadius: "10px",
    background: "#fff0f0",
    color: "#b4232c",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  forgot: {
    display: "block",
    margin: "17px auto 0",
    border: "none",
    background: "transparent",
    color: "#245d8f",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  registerArea: {
    marginTop: "22px",
    fontSize: "14px",
    color: "#647181",
  },

  registerLink: {
    marginLeft: "6px",
    border: "none",
    background: "transparent",
    color: "#173b63",
    fontWeight: "800",
    cursor: "pointer",
    padding: 0,
  },

  helpLink: {
    marginTop: "17px",
    border: "none",
    background: "transparent",
    color: "#7a8795",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    opacity: 0.85,
  },

  helpIcon: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    width: "17px",
    height: "17px",
    marginRight: "5px",
    border: "1px solid #aab4bf",
    borderRadius: "50%",
    fontSize: "11px",
  },

  footer: {
    margin: "22px 0 4px",
    color: "#667485",
    fontSize: "12px",
    fontWeight: "700",
  },

  motto: {
    margin: 0,
    color: "#8995a3",
    fontSize: "10px",
  },
};

export default Login;