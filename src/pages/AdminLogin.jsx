import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // --------------------------------------------------
  // CHECK EXISTING ADMIN SESSION
  // --------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setCheckingSession(false);
          }
          return;
        }

        const { data: admin, error } = await supabase
          .from("admin_users")
          .select("id, full_name, role, admin_slot, is_active")
          .eq("id", session.user.id)
          .eq("role", "general_admin")
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Admin session check error:", error);

          await supabase.auth.signOut();

          if (mounted) {
            setCheckingSession(false);
          }

          return;
        }

        if (admin) {
          navigate("/admin-dashboard", { replace: true });
          return;
        }

        // Authenticated user is not a General Admin.
        await supabase.auth.signOut();

        if (mounted) {
          setMessage(
            "This account is not authorized for General Administration."
          );
          setMessageType("error");
          setCheckingSession(false);
        }
      } catch (error) {
        console.error("Session check failed:", error);

        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // --------------------------------------------------
  // ADMIN LOGIN
  // --------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("info");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Please enter your authorized Gmail address.");
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign in through Supabase Authentication.
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (authError) {
        setMessage(authError.message);
        setMessageType("error");
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setMessage("Unable to verify your administrator account.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // 2. Verify that this Auth user is a General Admin.
      const { data: admin, error: adminError } =
        await supabase
          .from("admin_users")
          .select(
            "id, full_name, role, admin_slot, is_active"
          )
          .eq("id", authData.user.id)
          .eq("role", "general_admin")
          .eq("is_active", true)
          .maybeSingle();

      if (adminError) {
        console.error("Admin authorization error:", adminError);

        await supabase.auth.signOut();

        setMessage(
          "Unable to verify administrator authorization."
        );
        setMessageType("error");
        setLoading(false);
        return;
      }

      // 3. Authenticated but not authorized.
      if (!admin) {
        await supabase.auth.signOut();

        setMessage(
          "Access denied. This account is not an authorized General Administrator."
        );
        setMessageType("error");
        setLoading(false);
        return;
      }

      // 4. Successful login.
      setMessage(
        `Welcome, ${admin.full_name}. Opening General Administration...`
      );
      setMessageType("success");

      setTimeout(() => {
        navigate("/admin-dashboard", {
          replace: true,
        });
      }, 500);
    } catch (error) {
      console.error("Admin login error:", error);

      await supabase.auth.signOut();

      setMessage(
        "Something went wrong while signing in. Please try again."
      );
      setMessageType("error");
    }

    setLoading(false);
  };

  // --------------------------------------------------
  // FORGOT PASSWORD
  // --------------------------------------------------
  const handleForgotPassword = async () => {
    setMessage("");
    setMessageType("info");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage(
        "Enter your administrator Gmail address first."
      );
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      // First confirm that the email belongs to an active
      // General Administrator.
      //
      // This query depends on your RLS policy. If RLS blocks
      // this query for logged-out users, we will move this
      // check to a secure Edge Function later.
      const { data: admin, error: adminError } =
        await supabase
          .from("admin_users")
          .select("id, role, is_active")
          .eq("role", "general_admin")
          .eq("is_active", true)
          .limit(2);

      if (adminError) {
        console.error(
          "Password recovery admin check:",
          adminError
        );
      }

      /*
       * We intentionally send the password-reset request
       * through Supabase Auth.
       *
       * Supabase will send the recovery email only when
       * the email exists in Auth.
       */
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: `${window.location.origin}/admin-reset-password`,
          }
        );

      if (error) {
        setMessage(error.message);
        setMessageType("error");
      } else {
        setMessage(
          "If this is an authorized administrator email, a password reset link has been sent."
        );
        setMessageType("success");
      }
    } catch (error) {
      console.error("Password reset error:", error);

      setMessage(
        "Unable to start password recovery. Please try again."
      );
      setMessageType("error");
    }

    setLoading(false);
  };

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------
  if (checkingSession) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <img
            src="/chsdosa-cooperative/chsdosa-icon.png"
            alt="CHSDOSA Cooperative"
            style={styles.logo}
          />

          <div style={styles.badge}>
            GENERAL ADMINISTRATION
          </div>

          <h1 style={styles.title}>
            Checking Access...
          </h1>

          <p style={styles.subtitle}>
            Securely verifying your administrator session.
          </p>

          <div style={styles.loader}>
            Please wait...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img
          src="/chsdosa-cooperative/chsdosa-icon.png"
          alt="CHSDOSA Cooperative"
          style={styles.logo}
        />

        <div style={styles.badge}>
          GENERAL ADMINISTRATION
        </div>

        <h1 style={styles.title}>
          Administrator Login
        </h1>

        <p style={styles.subtitle}>
          Secure access for authorized CHSDOSA Cooperative
          administrators.
        </p>

        <form onSubmit={handleLogin}>
          <label style={styles.label}>
            Authorized Gmail
          </label>

          <input
            type="email"
            placeholder="Enter authorized Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            disabled={loading}
          />

          <label style={styles.label}>
            Password
          </label>

          <div style={styles.passwordWrapper}>
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              style={styles.passwordInput}
              autoComplete="current-password"
              disabled={loading}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              style={styles.showButton}
              disabled={loading}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "SIGNING IN..."
              : "SIGN IN →"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={loading}
          style={styles.forgotButton}
        >
          Forgot password?
        </button>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(messageType === "error"
                ? styles.errorMessage
                : {}),
              ...(messageType === "success"
                ? styles.successMessage
                : {}),
            }}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/")}
          style={styles.backButton}
          disabled={loading}
        >
          ← Back
        </button>

        <p style={styles.security}>
          🔒 Restricted administrative access
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    background:
      "linear-gradient(145deg, #f8f5ef 0%, #f1eadc 48%, #e5d9c5 100%)",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow:
      "0 15px 45px rgba(23,59,99,0.15)",
  },

  logo: {
    width: "82px",
    height: "82px",
    objectFit: "contain",
    borderRadius: "20px",
    marginBottom: "18px",
  },

  badge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#fff2d2",
    color: "#8a621c",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  title: {
    margin: "15px 0 8px",
    color: "#173b63",
    fontSize: "27px",
    fontWeight: "900",
  },

  subtitle: {
    margin: "0 auto 25px",
    maxWidth: "320px",
    color: "#687585",
    fontSize: "13px",
    lineHeight: "1.6",
  },

  label: {
    display: "block",
    textAlign: "left",
    marginBottom: "8px",
    color: "#173b63",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    borderRadius: "13px",
    border: "1px solid #d7dde5",
    outline: "none",
    fontSize: "15px",
    marginBottom: "14px",
  },

  passwordWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: "14px",
  },

  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 72px 15px 15px",
    borderRadius: "13px",
    border: "1px solid #d7dde5",
    outline: "none",
    fontSize: "15px",
  },

  showButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#173b63",
    fontSize: "10px",
    fontWeight: "800",
    cursor: "pointer",
    padding: "8px",
  },

  button: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, #173b63, #245d8f)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
  },

  forgotButton: {
    marginTop: "15px",
    border: "none",
    background: "transparent",
    color: "#245d8f",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  message: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f3f6fa",
    color: "#526071",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  errorMessage: {
    background: "#fff1f1",
    color: "#a33a3a",
  },

  successMessage: {
    background: "#eefaf1",
    color: "#26733a",
  },

  loader: {
    marginTop: "20px",
    color: "#687585",
    fontSize: "13px",
  },

  backButton: {
    marginTop: "20px",
    border: "none",
    background: "transparent",
    color: "#173b63",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  security: {
    marginTop: "20px",
    marginBottom: 0,
    color: "#9aa3ad",
    fontSize: "10px",
  },
};

export default AdminLogin;