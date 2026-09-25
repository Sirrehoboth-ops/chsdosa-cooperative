 import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h2>CHSDOSA</h2>
            <p>Member Dashboard</p>
          </div>

          <button
            style={styles.logout}
            onClick={() => navigate("/")}
          >
            Logout
          </button>
        </div>

        <div style={styles.welcome}>
          <h2>Welcome, Member 👋</h2>
          <p>
            Welcome to your CHSDOSA Cooperative Society account.
          </p>
        </div>

        <div style={styles.balanceCard}>
          <p>Available Balance</p>
          <h1>₦0.00</h1>
          <p>Cooperative Account</p>
        </div>

        <div style={styles.grid}>

          <button style={styles.menu}>
            💰
            <span>Deposit</span>
          </button>

          <button style={styles.menu}>
            📊
            <span>Transactions</span>
          </button>

          <button style={styles.menu}>
            👤
            <span>My Profile</span>
          </button>

          <button style={styles.menu}>
            ⚙️
            <span>Account Settings</span>
          </button>

        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f1ea",
    padding: "20px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  logout: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  welcome: {
    background: "white",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
  },

  balanceCard: {
    background: "#222",
    color: "white",
    padding: "25px",
    borderRadius: "18px",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  menu: {
    padding: "25px 10px",
    border: "none",
    borderRadius: "15px",
    background: "white",
    fontSize: "25px",
    cursor: "pointer",
  },
};

export default Dashboard;