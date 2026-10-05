import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";
const MAX_LOAN = 5_000_000;

export default function LoanApplication() {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(0);

  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(8);

  const [guarantor1, setGuarantor1] = useState("");
  const [guarantor2, setGuarantor2] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedMode = localStorage.getItem("chsdosa-dark-mode");
    setDarkMode(savedMode === "true");

    loadSavings();
  }, []);

  const loadSavings = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("accounts")
        .select("balance")
        .eq("member_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("LOAN SAVINGS ERROR:", error);
        setMessage(
          "Unable to load your savings. Please try again."
        );
        return;
      }

      const balance = Number(data?.balance || 0);
      setSaving(balance);
    } catch (error) {
      console.error("LOAN APPLICATION ERROR:", error);
      setMessage(
        "Something went wrong while loading your loan information."
      );
    } finally {
      setLoading(false);
    }
  };

  const eligibleAmount = useMemo(() => {
    return Math.min(saving * 2, MAX_LOAN);
  }, [saving]);

  const requestedAmount = Number(
    String(amount).replace(/,/g, "")
  ) || 0;

  const monthlyRepayment =
    requestedAmount > 0
      ? requestedAmount / duration
      : 0;

  const formatMoney = (value) => {
    return `₦${Number(value || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");

    if (!raw) {
      setAmount("");
      return;
    }

    const numeric = Number(raw);

    if (numeric > MAX_LOAN) {
      setAmount(MAX_LOAN.toLocaleString("en-NG"));
      return;
    }

    setAmount(numeric.toLocaleString("en-NG"));
  };

  const continueApplication = () => {
    setMessage("");

    if (saving <= 0) {
      setMessage(
        "You need eligible savings before applying for a loan."
      );
      return;
    }

    if (requestedAmount <= 0) {
      setMessage("Please enter the amount you want to borrow.");
      return;
    }

    if (requestedAmount > eligibleAmount) {
      setMessage(
        `The maximum amount you are currently eligible for is ${formatMoney(
          eligibleAmount
        )}.`
      );
      return;
    }

    if (![8, 9, 10].includes(Number(duration))) {
      setMessage("Please select a repayment period.");
      return;
    }

    if (!guarantor1.trim()) {
      setMessage("Please enter Guarantor 1 member ID.");
      return;
    }

    if (!guarantor2.trim()) {
      setMessage("Please enter Guarantor 2 member ID.");
      return;
    }

    if (
      guarantor1.trim().toLowerCase() ===
      guarantor2.trim().toLowerCase()
    ) {
      setMessage(
        "Guarantor 1 and Guarantor 2 cannot be the same member."
      );
      return;
    }

    /*
      We are not submitting to Supabase yet.

      The next stage will:
      1. Verify both guarantors.
      2. Confirm Guarantor 1 belongs to the applicant's regime.
      3. Confirm both members are approved.
      4. Create the loan application.
      5. Open the loan agreement.
    */

    navigate("/loan/agreement", {
      state: {
        requestedAmount,
        eligibleAmount,
        saving,
        duration: Number(duration),
        monthlyRepayment,
        guarantor1: guarantor1.trim(),
        guarantor2: guarantor2.trim(),
      },
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: darkMode ? "#06120d" : "#f5fbf7",
          color: darkMode ? "#fff" : "#102018",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        Loading your loan information...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkMode
          ? "linear-gradient(180deg, #06150e 0%, #020906 100%)"
          : "linear-gradient(180deg, #f5fff8 0%, #ffffff 100%)",
        color: darkMode ? "#fff" : "#102018",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "none",
            background: darkMode ? "#123326" : "#e5f3ea",
            color: darkMode ? "#fff" : "#123326",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          ←
        </button>

        <div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.65,
              fontWeight: 700,
            }}
          >
            CHSDOSA COOPERATIVE
          </div>

          <h2
            style={{
              margin: "3px 0 0",
              fontSize: 23,
            }}
          >
            Loan Application
          </h2>
        </div>
      </div>

      {/* Logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <img
          src={LOGO}
          alt="CHSDOSA"
          style={{
            width: 70,
            height: 70,
            borderRadius: 20,
            objectFit: "cover",
            background: "#fff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          }}
        />
      </div>

      {/* Savings card */}
      <div
        style={{
          borderRadius: 24,
          padding: 22,
          background: darkMode ? "#0d281b" : "#eaf8ef",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 13,
            opacity: 0.7,
            fontWeight: 700,
          }}
        >
          YOUR ELIGIBLE SAVINGS
        </div>

        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            marginTop: 7,
          }}
        >
          {formatMoney(saving)}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Maximum loan eligibility:
          <strong>
            {" "}
            {formatMoney(eligibleAmount)}
          </strong>
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 12,
            opacity: 0.65,
          }}
        >
          Calculated as your eligible savings × 2,
          subject to the ₦5,000,000 maximum.
        </div>
      </div>

      {/* Application form */}
      <div
        style={{
          borderRadius: 24,
          padding: 20,
          background: darkMode ? "#0a1d14" : "#ffffff",
          boxShadow: darkMode
            ? "0 10px 30px rgba(0,0,0,0.25)"
            : "0 10px 30px rgba(0,0,0,0.07)",
          border: darkMode
            ? "1px solid #163d2a"
            : "1px solid #e5eee8",
        }}
      >
        <h3
          style={{
            margin: "0 0 18px",
            fontSize: 19,
          }}
        >
          Loan Details
        </h3>

        {/* Amount */}
        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Amount you want to borrow
        </label>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: 16,
            background: darkMode ? "#10271b" : "#f4f8f5",
            border: darkMode
              ? "1px solid #214b35"
              : "1px solid #dce9e0",
            padding: "0 14px",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              opacity: 0.7,
            }}
          >
            ₦
          </span>

          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: darkMode ? "#fff" : "#102018",
              padding: "16px 10px",
              fontSize: 17,
              fontWeight: 700,
            }}
          />
        </div>

        {/* Duration */}
        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Repayment period
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 9,
            marginBottom: 20,
          }}
        >
          {[8, 9, 10].map((months) => (
            <button
              key={months}
              onClick={() => setDuration(months)}
              style={{
                border:
                  duration === months
                    ? "2px solid #0b8a50"
                    : darkMode
                    ? "1px solid #244c38"
                    : "1px solid #d7e5dc",
                borderRadius: 14,
                padding: "14px 5px",
                background:
                  duration === months
                    ? darkMode
                      ? "#123d29"
                      : "#e7f7ed"
                    : darkMode
                    ? "#0c1c14"
                    : "#fff",
                color: darkMode ? "#fff" : "#102018",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {months} months
            </button>
          ))}
        </div>

        {/* Repayment */}
        <div
          style={{
            borderRadius: 18,
            padding: 17,
            background: darkMode ? "#11291c" : "#f0f8f3",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
              fontWeight: 700,
            }}
          >
            ESTIMATED MONTHLY REPAYMENT
          </div>

          <div
            style={{
              fontSize: 25,
              fontWeight: 900,
              marginTop: 5,
            }}
          >
            {formatMoney(monthlyRepayment)}
          </div>

          <div
            style={{
              fontSize: 11,
              opacity: 0.6,
              marginTop: 5,
            }}
          >
            This is an initial estimate and does not include
            any approved charges or interest.
          </div>
        </div>

        {/* Guarantors */}
        <h3
          style={{
            margin: "0 0 5px",
            fontSize: 19,
          }}
        >
          Guarantors
        </h3>

        <p
          style={{
            margin: "0 0 17px",
            fontSize: 13,
            opacity: 0.65,
            lineHeight: 1.5,
          }}
        >
          You need 2 approved CHSDOSA members. Guarantor 1
          must be from your regime. Guarantor 2 may be from
          any regime.
        </p>

        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Guarantor 1 — Same regime
        </label>

        <input
          type="text"
          value={guarantor1}
          onChange={(e) => setGuarantor1(e.target.value)}
          placeholder="Enter member ID"
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 15,
            border: darkMode
              ? "1px solid #244c38"
              : "1px solid #d7e5dc",
            background: darkMode ? "#0d2118" : "#f8fbf9",
            color: darkMode ? "#fff" : "#102018",
            padding: "15px",
            outline: "none",
            marginBottom: 15,
            fontSize: 15,
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Guarantor 2 — Any regime
        </label>

        <input
          type="text"
          value={guarantor2}
          onChange={(e) => setGuarantor2(e.target.value)}
          placeholder="Enter member ID"
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 15,
            border: darkMode
              ? "1px solid #244c38"
              : "1px solid #d7e5dc",
            background: darkMode ? "#0d2118" : "#f8fbf9",
            color: darkMode ? "#fff" : "#102018",
            padding: "15px",
            outline: "none",
            fontSize: 15,
          }}
        />

        {/* Message */}
        {message && (
          <div
            style={{
              marginTop: 17,
              padding: 14,
              borderRadius: 14,
              background: darkMode ? "#3a1717" : "#fff0f0",
              color: darkMode ? "#ffb7b7" : "#a32222",
              fontSize: 13,
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {/* Continue */}
        <button
          onClick={continueApplication}
          style={{
            width: "100%",
            marginTop: 22,
            border: "none",
            borderRadius: 17,
            padding: "17px",
            background: "#0b8a50",
            color: "#fff",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(11,138,80,0.22)",
          }}
        >
          Continue to Agreement →
        </button>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 11,
          opacity: 0.5,
          lineHeight: 1.5,
        }}
      >
        Your loan application will not be submitted to
        administrators until the required agreement and
        guarantor approvals are completed.
      </div>
    </div>
  );
}