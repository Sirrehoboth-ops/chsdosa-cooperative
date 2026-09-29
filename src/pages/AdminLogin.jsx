import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter your Gmail address.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "A secure login link has been sent to your Gmail. Check your email."
    );
  };

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
          Secure access for authorized CHSDOSA Cooperative administrators.
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
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "CHECKING..." : "CONTINUE →"}
          </button>

        </form>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/")}
          style={styles.backButton}
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
    boxShadow: "0 15px 45px rgba(23,59,99,0.15)",
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
    padding: "15px",
    borderRadius: "13px",
    border: "1px solid #d7dde5",
    outline: "none",
    fontSize: "15px",
    marginBottom: "14px",
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

  message: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f3f6fa",
    color: "#526071",
    fontSize: "13px",
    lineHeight: "1.5",
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