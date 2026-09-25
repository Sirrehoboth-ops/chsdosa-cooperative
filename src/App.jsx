import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>CHSDOSA</div>

        <h1>COOPERATIVE SOCIETY</h1>

        <p style={styles.motto}>
          Leadership with Integrity, Unity and Progress
        </p>

        <p style={styles.welcome}>
          Welcome to the CHSDOSA Cooperative Society.
          <br />
          Together, we build a stronger future.
        </p>

        <button
          style={styles.login}
          onClick={() => navigate("/login")}
        >
          LOGIN
        </button>

        <button
          style={styles.register}
          onClick={() => navigate("/register")}
        >
          REGISTER
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
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
    padding: "40px 25px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  },

  logo: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "20px",
  },

  motto: {
    fontWeight: "600",
    marginBottom: "25px",
  },

  welcome: {
    lineHeight: "1.6",
    marginBottom: "30px",
  },

  login: {
    width: "100%",
    padding: "14px",
    marginBottom: "12px",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  register: {
    width: "100%",
    padding: "14px",
    border: "1px solid #333",
    borderRadius: "10px",
    background: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default App;