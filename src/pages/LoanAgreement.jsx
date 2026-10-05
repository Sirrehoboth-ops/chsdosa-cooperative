import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

export default function LoanAgreement() {
  const navigate = useNavigate();
  const location = useLocation();

  const application = location.state || {};

  const {
    requestedAmount = 0,
    eligibleAmount = 0,
    saving = 0,
    duration = 0,
    monthlyRepayment = 0,
    guarantor1 = "",
    guarantor2 = "",
  } = application;

  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");

  const isDark =
    typeof window !== "undefined" &&
    localStorage.getItem("chsdosa-dark-mode") === "true";

  const formatNGN = (value) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const canContinue = useMemo(() => {
    return agreed && signature.trim().length >= 3;
  }, [agreed, signature]);

  function continueToGuarantors() {
    setError("");

    if (!agreed) {
      setError("Please read and accept the Loan Agreement.");
      return;
    }

    if (!signature.trim()) {
      setError("Please provide your electronic signature.");
      return;
    }

    navigate("/loan/guarantors", {
      state: {
        ...application,
        applicantSignature: signature.trim(),
        applicantAgreed: true,
      },
    });
  }

  const pageStyle = {
    minHeight: "100vh",
    background: isDark ? "#07111f" : "#f5f7fb",
    color: isDark ? "#ffffff" : "#111827",
    padding: "20px 16px 40px",
    fontFamily: "Arial, sans-serif",
  };

  const cardStyle = {
    background: isDark ? "#101c2d" : "#ffffff",
    border: `1px solid ${isDark ? "#23344d" : "#e5e7eb"}`,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    boxShadow: isDark
      ? "0 8px 25px rgba(0,0,0,.18)"
      : "0 8px 25px rgba(15,23,42,.06)",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    borderRadius: 12,
    border: `1px solid ${isDark ? "#344866" : "#d1d5db"}`,
    background: isDark ? "#0b1626" : "#ffffff",
    color: isDark ? "#ffffff" : "#111827",
    fontSize: 15,
    outline: "none",
  };

  // Prevent opening this page directly without application data.
  if (!location.state) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            maxWidth: 600,
            margin: "60px auto",
            ...cardStyle,
            textAlign: "center",
          }}
        >
          <img
            src={LOGO}
            alt="CHSDOSA"
            style={{
              width: 75,
              height: 75,
              objectFit: "cover",
              borderRadius: 18,
              marginBottom: 15,
            }}
          />

          <h2>Loan Application Not Found</h2>

          <p style={{ opacity: 0.7, lineHeight: 1.6 }}>
            Please start your loan application again.
          </p>

          <button
            onClick={() => navigate("/loan")}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "14px 20px",
              background: "#16a34a",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            BACK TO LOAN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 650, margin: "0 auto" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: "none",
              background: isDark ? "#17263b" : "#e9eef5",
              color: isDark ? "#fff" : "#111827",
              fontSize: 20,
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
                letterSpacing: 0.5,
              }}
            >
              CHSDOSA COOPERATIVE
            </div>

            <h2 style={{ margin: "3px 0 0" }}>
              Loan Agreement
            </h2>
          </div>
        </div>

        {/* APPLICATION SUMMARY */}
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginBottom: 7,
            }}
          >
            LOAN REQUEST
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              marginBottom: 18,
            }}
          >
            {formatNGN(requestedAmount)}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 15,
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Savings
              </div>
              <strong>{formatNGN(saving)}</strong>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Maximum Eligible
              </div>
              <strong>{formatNGN(eligibleAmount)}</strong>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Repayment Period
              </div>
              <strong>{duration} months</strong>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Estimated Monthly
              </div>
              <strong>{formatNGN(monthlyRepayment)}</strong>
            </div>
          </div>
        </div>

        {/* GUARANTORS */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            Selected Guarantors
          </h3>

          <div
            style={{
              padding: 13,
              borderRadius: 12,
              background: isDark ? "#0b1626" : "#f8fafc",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.6,
                marginBottom: 4,
              }}
            >
              GUARANTOR 1 — SAME REGIME
            </div>

            <strong>{guarantor1 || "Not provided"}</strong>
          </div>

          <div
            style={{
              padding: 13,
              borderRadius: 12,
              background: isDark ? "#0b1626" : "#f8fafc",
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.6,
                marginBottom: 4,
              }}
            >
              GUARANTOR 2 — ANY REGIME
            </div>

            <strong>{guarantor2 || "Not provided"}</strong>
          </div>
        </div>

        {/* AGREEMENT */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            CHSDOSA COOPERATIVE LOAN AGREEMENT
          </h3>

          <div
            style={{
              lineHeight: 1.7,
              fontSize: 14,
              opacity: 0.9,
            }}
          >
            <p>
              By proceeding with this application, I acknowledge
              that I am applying for a loan through the CHSDOSA
              Cooperative and agree to comply with the cooperative's
              approved loan rules, repayment requirements and
              administrative decisions.
            </p>

            <h4>1. Loan Information</h4>

            <p>
              The requested loan amount is{" "}
              <strong>{formatNGN(requestedAmount)}</strong>.
              My current eligible amount shown by the system is{" "}
              <strong>{formatNGN(eligibleAmount)}</strong>.
              The requested repayment period is{" "}
              <strong>{duration} months</strong>.
            </p>

            <h4>2. Borrower's Responsibility</h4>

            <p>
              I agree to repay the approved loan according to the
              repayment schedule provided by CHSDOSA Cooperative.
              I understand that approval of an application does not
              remove my responsibility to repay the amount actually
              disbursed to me.
            </p>

            <h4>3. Repayment</h4>

            <p>
              I agree to make my repayments on time and to comply
              with any repayment instructions communicated by the
              cooperative. Any applicable charges, penalties or
              adjustments will be determined according to the
              cooperative's approved rules.
            </p>

            <h4>4. Guarantors</h4>

            <p>
              I understand that my two selected guarantors must
              independently review and accept their guarantor
              responsibilities before my application can proceed to
              administrator review.
            </p>

            <h4>5. Accuracy of Information</h4>

            <p>
              I confirm that the information I provide during this
              application is true and accurate. Providing false,
              misleading or fraudulent information may result in
              rejection of the application or other action under
              CHSDOSA Cooperative rules.
            </p>

            <h4>6. Administrator Review</h4>

            <p>
              I understand that signing this agreement does not
              automatically approve my loan. The application must
              first receive acceptance from both guarantors and then
              undergo administrator review.
            </p>

            <h4>7. Final Approval</h4>

            <p>
              The final approved amount, repayment schedule and
              applicable terms will be determined by the authorized
              CHSDOSA Cooperative administrator in accordance with
              the cooperative's rules.
            </p>

            <h4>8. Electronic Signature</h4>

            <p>
              I understand that my electronic signature below is
              intended to confirm my acceptance of this agreement
              and my willingness to proceed with the loan application.
            </p>
          </div>
        </div>

        {/* ACCEPTANCE */}
        <div style={cardStyle}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              cursor: "pointer",
              lineHeight: 1.5,
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
              }}
            />

            <span>
              I have read the complete Loan Agreement and I agree
              to the terms stated above.
            </span>
          </label>

          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Electronic Signature
            </label>

            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type your full name"
              style={inputStyle}
            />

            <div
              style={{
                fontSize: 12,
                opacity: 0.55,
                marginTop: 7,
              }}
            >
              Type your full name as your electronic signature.
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              ...cardStyle,
              background: isDark ? "#32151a" : "#fff1f2",
              borderColor: isDark ? "#71313a" : "#fecdd3",
              color: isDark ? "#ffd7dc" : "#9f1239",
            }}
          >
            <strong>Attention</strong>

            <div style={{ marginTop: 6 }}>
              {error}
            </div>
          </div>
        )}

        {/* CONTINUE */}
        <button
          onClick={continueToGuarantors}
          disabled={!canContinue}
          style={{
            width: "100%",
            padding: "17px",
            border: "none",
            borderRadius: 15,
            background: canContinue
              ? "#16a34a"
              : isDark
              ? "#26364b"
              : "#d1d5db",
            color: canContinue
              ? "#ffffff"
              : isDark
              ? "#8fa0b7"
              : "#6b7280",
            fontSize: 16,
            fontWeight: 800,
            cursor: canContinue
              ? "pointer"
              : "not-allowed",
          }}
        >
          CONTINUE TO GUARANTORS
        </button>

        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            opacity: 0.5,
            marginTop: 14,
          }}
        >
          CHSDOSA Cooperative • Leadership with Integrity,
          Unity and Progress
        </div>
      </div>
    </div>
  );
}