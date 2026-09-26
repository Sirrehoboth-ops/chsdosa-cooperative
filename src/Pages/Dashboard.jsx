import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Dashboard() {
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    console.log("MEMBER DATA:", memberData);
    console.log("MEMBER ERROR:", memberError);

    if (memberError) {
      console.error(memberError);
    }

    setMember(memberData);

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("member_id", user.id)
      .maybeSingle();

    console.log("ACCOUNT DATA:", accountData);
    console.log("ACCOUNT ERROR:", accountError);

    if (accountData) {
      setBalance(accountData.balance || 0);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading your account...</h2>
      </div>
    );
  }

  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h2 style={styles.logo}>CHSDOSA</h2>
            <p style={styles.headerText}>
              Cooperative Society
            </p>
          </div>

          <button
            style={styles.logout}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div style={styles.welcome}>
          <h2>
            {greeting},{" "}
            {member?.full_name || "Member"} 👋
          </h2>

          <p>
            Welcome to your CHSDOSA Cooperative Society account.
          </p>

          {member?.member_number && (
            <p style={styles.memberNumber}>
              Member No:{" "}
              <strong>{member.member_number}</strong>
            </p>
          )}
        </div>

        <div style={styles.balanceCard}>
          <p style={styles.balanceLabel}>
            Available Balance
          </p>

          <h1 style={styles.balance}>
            ₦
            {Number(balance).toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </h1>

          <p style={styles.accountText}>
            Cooperative Account
          </p>
        </div>

        <div style={styles.grid}>

          <button
  style={styles.menu}
  onClick={() => navigate("/deposit")}
>
  <span style={styles.icon}>💰</span>
  <span>Deposit</span>
</button>

          <button
  style={styles.menu}
  onClick={() => navigate("/transactions")}
>
  <span style={styles.icon}>📊</span>
  <span>Transactions</span>
</button>

          <button style={styles.menu}>
            <span style={styles.icon}>🤝</span>
            <span>Contributions</span>
          </button>

          <button style={styles.menu}>
            <span style={styles.icon}>👤</span>
            <span>My Profile</span>
          </button>

          <button style={styles.menu}>
            <span style={styles.icon}>📅</span>
            <span>Meetings</span>
          </button>

          <button style={styles.menu}>
            <span style={styles.icon}>📋</span>
            <span>Loan</span>
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

  logo: {
    margin: 0,
  },

  headerText: {
    margin: "4px 0 0",
    color: "#666",
  },

  logout: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    background: "white",
  },

  welcome: {
    background: "white",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
  },

  memberNumber: {
    marginTop: "15px",
    color: "#555",
  },

  balanceCard: {
    background: "#222",
    color: "white",
    padding: "25px",
    borderRadius: "18px",
    marginBottom: "20px",
  },

  balanceLabel: {
    margin: 0,
  },

  balance: {
    margin: "10px 0",
    fontSize: "34px",
  },

  accountText: {
    margin: 0,
    opacity: 0.7,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  menu: {
    padding: "22px 10px",
    border: "none",
    borderRadius: "15px",
    background: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },

  icon: {
    fontSize: "28px",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f1ea",
  },
};

export default Dashboard;