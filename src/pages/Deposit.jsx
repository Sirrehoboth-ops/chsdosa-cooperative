import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Deposit() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      alert("Your session has expired. Please login again.");
      navigate("/login");
      return;
    }

    const reference =
      "DEP-" +
      Date.now() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabase.from("transactions").insert({
      member_id: user.id,
      type: "deposit",
      amount: Number(amount),
      status: "pending",
      reference: reference,
      description: "Cooperative account deposit",
    });

    setLoading(false);

    if (error) {
      console.error("DEPOSIT ERROR:", error);
      alert(error.message);
      return;
    }

    alert(
      `Deposit request created successfully.\n\nAmount: ₦${Number(
        amount
      ).toLocaleString("en-NG")}\nStatus: Pending`
    );

    setAmount("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button
          style={styles.back}
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <h1>Make a Deposit</h1>

        <p style={styles.text}>
          Enter the amount you want to deposit into your CHSDOSA
          Cooperative account.
        </p>

        <div style={styles.card}>
          <label style={styles.label}>Deposit Amount</label>

          <div style={styles.inputBox}>
            <span>₦</span>

            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            style={styles.button}
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "CONTINUE"}
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
    maxWidth: "500px",
    margin: "auto",
  },

  back: {
    border: "none",
    background: "transparent",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "20px",
  },

  text: {
    color: "#666",
    lineHeight: "1.6",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "18px",
    marginTop: "25px",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    fontWeight: "bold",
  },

  inputBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "20px",
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "20px",
    paddingLeft: "8px",
  },

  button: {
    width: "100%",
    marginTop: "20px",
    padding: "15px",
    border: "none",
    borderRadius: "10px",
    background: "#222",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Deposit;