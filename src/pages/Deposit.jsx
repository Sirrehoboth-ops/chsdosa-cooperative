import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaystackPop from "@paystack/inline-js";
import { supabase } from "../lib/supabase";

function Deposit() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    try {
      // Check logged-in member
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Your session has expired. Please login again.");
        navigate("/login");
        return;
      }

      // Initialize payment through Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(
        "initialize-payment",
        {
          body: {
            amount: depositAmount,
          },
        }
      );

      if (error) {
        console.error("PAYMENT INITIALIZATION ERROR:", error);
        alert(error.message || "Unable to start payment.");
        return;
      }

      if (!data?.access_code) {
        console.error("PAYSTACK RESPONSE:", data);
        alert(data?.error || "Unable to start Paystack payment.");
        return;
      }

      // Open Paystack inside the app
      const popup = new PaystackPop();

      popup.resumeTransaction(data.access_code, {
        onSuccess: async (transaction) => {
          console.log("PAYSTACK SUCCESS:", transaction);

          const paymentReference =
            transaction?.reference || data.reference;

          try {
            setLoading(true);

            // Verify payment through Supabase Edge Function
            const {
              data: verificationData,
              error: verificationError,
            } = await supabase.functions.invoke("verify-payment", {
              body: {
                reference: paymentReference,
              },
            });

            if (verificationError) {
              console.error(
                "PAYMENT VERIFICATION ERROR:",
                verificationError
              );

              alert(
                "Payment was received, but verification could not be completed. Please contact the administrator."
              );

              return;
            }

            if (!verificationData?.success) {
              alert(
                verificationData?.message ||
                  verificationData?.error ||
                  "Payment could not be verified."
              );

              return;
            }

            alert(
              `Payment successful! 🎉\n\nAmount: ₦${Number(
                verificationData.amount
              ).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}\n\nYour CHSDOSA account has been credited.`
            );

            setAmount("");

            navigate("/dashboard");
          } catch (error) {
            console.error("VERIFICATION ERROR:", error);

            alert(
              "Payment was completed, but verification could not be completed. Please contact the administrator."
            );
          } finally {
            setLoading(false);
          }
        },

        onCancel: () => {
          alert("Payment was cancelled.");
        },

        onError: (error) => {
          console.error("PAYSTACK ERROR:", error);
          alert("Payment could not be completed.");
        },
      });
    } catch (error) {
      console.error("DEPOSIT ERROR:", error);
      alert("Something went wrong while starting payment.");
    } finally {
      setLoading(false);
    }
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
              min="1"
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