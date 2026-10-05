import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("TRANSACTIONS ERROR:", error);
      setLoading(false);
      return;
    }

    setTransactions(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading transactions...</h2>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button
          style={styles.back}
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <h1>Transactions</h1>

        <p style={styles.subtitle}>
          Your cooperative account transaction history.
        </p>

        {transactions.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📊</div>
            <h3>No transactions yet</h3>
            <p>Your transaction history will appear here.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                style={styles.transaction}
              >
                <div>
                  <h3 style={styles.type}>
                    {transaction.type === "deposit"
                      ? "💰 Deposit"
                      : transaction.type}
                  </h3>

                  <p style={styles.description}>
                    {transaction.description ||
                      "Cooperative transaction"}
                  </p>

                  <p style={styles.date}>
                    {new Date(
                      transaction.created_at
                    ).toLocaleString("en-NG")}
                  </p>
                </div>

                <div style={styles.right}>
                  <strong style={styles.amount}>
                    ₦
                    {Number(transaction.amount).toLocaleString(
                      "en-NG",
                      {
                        minimumFractionDigits: 2,
                      }
                    )}
                  </strong>

                  <span
                    style={{
                      ...styles.status,
                      ...(transaction.status === "successful"
                        ? styles.success
                        : transaction.status === "failed"
                        ? styles.failed
                        : styles.pending),
                    }}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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

  back: {
    border: "none",
    background: "transparent",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "20px",
  },

  subtitle: {
    color: "#666",
    marginBottom: "25px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  transaction: {
    background: "white",
    padding: "18px",
    borderRadius: "15px",
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  type: {
    margin: 0,
    fontSize: "17px",
  },

  description: {
    margin: "6px 0",
    color: "#555",
  },

  date: {
    margin: 0,
    color: "#888",
    fontSize: "12px",
  },

  right: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
  },

  amount: {
    fontSize: "16px",
  },

  status: {
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    textTransform: "capitalize",
  },

  pending: {
    background: "#fff3cd",
    color: "#856404",
  },

  success: {
    background: "#d4edda",
    color: "#155724",
  },

  failed: {
    background: "#f8d7da",
    color: "#721c24",
  },

  empty: {
    background: "white",
    padding: "40px 20px",
    borderRadius: "18px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "45px",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f1ea",
  },
};

export default Transactions;