import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email || ""
  );
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    location.state?.verified
      ? "Email verified successfully. You can now sign in."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (error) {
      setLoading(false);

      if (
        error.message
          .toLowerCase()
          .includes("email not confirmed")
      ) {
        localStorage.setItem(
          "chsdosa-verification-email",
          cleanEmail
        );

        setMessage(
          "Your email has not been verified yet. Please enter the verification code."
        );

        setTimeout(() => {
          navigate("/verify-code", {
            state: {
              email: cleanEmail,
            },
          });
        }, 1200);

        return;
      }

      setMessage(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setLoading(false);
      setMessage(
        "Unable to identify your account. Please try again."
      );
      return;
    }

    /*
      IMPORTANT:
      We no longer create a member automatically during login.

      The member must already have a valid record created
      during registration/database setup.
    */

    const {
      data: existingMember,
      error: memberCheckError,
    } = await supabase
      .from("members")
      .select(
        "id, full_name, email, phone, regime, member_number, avatar_url"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (memberCheckError) {
      await supabase.auth.signOut();

      setLoading(false);
      setMessage(memberCheckError.message);
      return;
    }

    if (!existingMember) {
      await supabase.auth.signOut();

      setLoading(false);
      setMessage(
        "Your account is not registered as a CHSDOSA member. Please contact the administrator."
      );
      return;
    }

    /*
      ==========================================================
      MEMBER RESTRICTION CHECK
      ==========================================================

      A restricted member is authenticated by Supabase first,
      but is immediately signed out before accessing the app.

      The restriction itself is controlled by the General Admin
      through the secure admin-member-restriction Edge Function.
    */

    const {
      data: restriction,
      error: restrictionCheckError,
    } = await supabase
      .from("member_restrictions")
      .select(
        "is_restricted, reason, restricted_at"
      )
      .eq("member_id", user.id)
      .maybeSingle();

    if (restrictionCheckError) {
      await supabase.auth.signOut();

      setLoading(false);

      setMessage(
        "Unable to verify your membership access. Please try again. If the problem continues, contact the administrator."
      );

      return;
    }

    if (restriction?.is_restricted === true) {
      await supabase.auth.signOut();

      setLoading(false);

      const restrictionReason =
        restriction.reason?.trim();

      setMessage(
        restrictionReason
          ? `Your CHSDOSA member access has been restricted by the administrator. Reason: ${restrictionReason}`
          : "Your CHSDOSA member access has been restricted by the administrator. Please contact the administrator."
      );

      return;
    }

    /*
      ==========================================================
      REGIME CHECK
      ==========================================================

      REGIME IS MANDATORY.
      We do NOT automatically assign "Current".
    */

    if (
      !existingMember.regime ||
      !existingMember.regime.trim()
    ) {
      await supabase.auth.signOut();

      setLoading(false);

      setMessage(
        "Your CHSDOSA regime is missing. Please contact the administrator to update your membership record."
      );

      return;
    }

    /*
      ==========================================================
      ACCOUNT CHECK
      ==========================================================

      Make sure the member has an account record.
      If it doesn't exist, create it with zero balance.
    */

    const {
      data: existingAccount,
      error: accountCheckError,
    } = await supabase
      .from("accounts")
      .select("id, balance")
      .eq("member_id", user.id)
      .maybeSingle();

    if (accountCheckError) {
      await supabase.auth.signOut();

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
        await supabase.auth.signOut();

        setLoading(false);

        setMessage(accountInsertError.message);
        return;
      }
    }

    setLoading(false);

    navigate("/dashboard", {
      replace: true,
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundHelp}>
        HELP & SUPPORT
      </div>

      <div style={styles.backgroundCircleOne}></div>
      <div style={styles.backgroundCircleTwo}></div>

      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate("/")}
        aria-label="Back to welcome"
      >
        ←
      </button>

      <div style={styles.container}>
        <div style={styles.logoArea}>
          <img
            src={`${import.meta.env.BASE_URL}chsdosa-icon.png`}
            alt="CHSDOSA Cooperative Society"
            style={styles.logoImage}
          />
        </div>

        <div style={styles.brand}>CHSDOSA</div>

        <div style={styles.badge}>
          MEMBER PORTAL
        </div>

        <h1 style={styles.title}>
          Welcome Back
        </h1>

        <p style={styles.subtitle}>
          Sign in to access your cooperative account
        </p>

        <div style={styles.card}>
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

          {message && (
            <div style={styles.message}>
              ⚠️ {message}
            </div>
          )}

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

        <button
          type="button"
          style={styles.helpLink}
          onClick={() =>
            setMessage(
              "For login or registration assistance, please contact the CHSDOSA administrator."
            )
          }
        >
          <span style={styles.helpIcon}>
            ?
          </span>
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