import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Account could not be created.");
      }

      const memberNumber =
        "CHS-" + Math.floor(100000 + Math.random() * 900000);

      const { error: memberError } = await supabase
        .from("members")
        .insert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          regime: "Current",
          member_number: memberNumber,
        });

      if (memberError) {
        throw memberError;
      }

      const { error: accountError } = await supabase
        .from("accounts")
        .insert({
          member_id: data.user.id,
          balance: 0,
        });

      if (accountError) {
        throw accountError;
      }

      setMessage(
        "Registration successful! Please check your email if confirmation is required."
      );

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      setMessage(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1>CHSDOSA</h1>

        <h2>Member Registration</h2>

        <p>Create your cooperative account</p>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={styles.input}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

        <button
          type="button"
          style={styles.button}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
        </button>

        <p style={styles.loginText}>
          Already have an account?{" "}
          <span
            style={styles.loginLink}
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate("/")}
        >
          ← Back to Welcome
        </button>

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
    background: "#f4f1ea",
    padding: "20px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    background: "white",
    padding: "35px 25px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  },

  input: {
    width: "100%",
    padding: "14px",
    margin: "8px 0",
    border: "1px solid #ccc",
    borderRadius: "10px",
    fontSize: "16px",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "14px",
    marginTop: "15px",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    background: "#222",
    color: "white",
  },

  message: {
    marginTop: "15px",
    fontWeight: "600",
  },

  loginText: {
    marginTop: "20px",
  },

  loginLink: {
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "underline",
  },

  backButton: {
    marginTop: "15px",
    padding: "10px 18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },
};

export default Register;