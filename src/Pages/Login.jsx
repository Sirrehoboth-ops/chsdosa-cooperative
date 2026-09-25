import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>CHSDOSA</div>

        <h1>Member Login</h1>

        <p style={styles.subtitle}>
          Welcome back to your cooperative account
        </p>

        <input
          type="email"
          placeholder="Email Address"
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={() => navigate("/dashboard")}
        >
          LOGIN
        </button>

        <p style={styles.forgot}>
          Forgot Password?
        </p>

        <p style={styles.registerText}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            style={styles.registerLink}
          >
            Register
          </span>
        </p>

        <button
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

  logo: {
    fontSize: "30px",
    fontWeight: "bold",
    marginBottom: "10px",
  },

  subtitle: {
    lineHeight: "1.5",
    marginBottom: "25px",
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
  },

  forgot: {
    marginTop: "18px",
  },

  registerText: {
    marginTop: "20px",
  },

  registerLink: {
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "underline",
  },

  backButton: {
    marginTop: "20px",
    padding: "10px 18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },
};

export default Login;