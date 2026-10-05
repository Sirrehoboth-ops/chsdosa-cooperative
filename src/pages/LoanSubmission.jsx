import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

export default function LoanSubmission() {
  const navigate = useNavigate();
  const location = useLocation();

  const application = location.state || {};

  const {
    requestedAmount = 0,
    eligibleAmount = 0,
    saving = 0,
    duration = 0,
    monthlyRepayment = 0,

    applicantSignature = "",
    applicantAgreed = false,

    guarantor1 = null,
    guarantor2 = null,

    guarantor1Accepted = false,
    guarantor2Accepted = false,

    guarantor1Signature = "",
    guarantor2Signature = "",
  } = application;

  const [confirmed, setConfirmed] = useState(false);
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

  const guarantor1Name =
    guarantor1?.full_name || "Guarantor 1";

  const guarantor2Name =
    guarantor2?.full_name || "Guarantor 2";

  const allRequirementsComplete = useMemo(() => {
    return (
      requestedAmount > 0 &&
      duration >= 8 &&
      duration <= 10 &&
      applicantAgreed &&
      applicantSignature.trim() &&
      guarantor1 &&
      guarantor2 &&
      guarantor1Accepted &&
      guarantor2Accepted &&
      guarantor1Signature.trim() &&
      guarantor2Signature.trim()
    );
  }, [
    requestedAmount,
    duration,
    applicantAgreed,
    applicantSignature,
    guarantor1,
    guarantor2,
    guarantor1Accepted,
    guarantor2Accepted,
    guarantor1Signature,
    guarantor2Signature,
  ]);

  function submitForReview() {
    setError("");

    if (!allRequirementsComplete) {
      setError(
        "This application is not complete. Please make sure the applicant and both guarantors have accepted and signed."
      );
      return;
    }

    if (!confirmed) {
      setError(
        "Please confirm that you have reviewed all the information."
      );
      return;
    }

    /*
     * IMPORTANT:
     * We are intentionally NOT inserting into Supabase here yet.
     *
     * The next stage will use a secure Edge Function to:
     * 1. Re-authenticate the applicant.
     * 2. Verify the applicant.
     * 3. Verify both guarantors again.
     * 4. Verify their signatures/acceptance.
     * 5. Verify the applicant's savings and eligibility.
     * 6. Create the loan application.
     * 7. Create the guarantor records.
     * 8. Create notifications.
     * 9. Lock the application.
     */

    navigate("/loan/submitted", {
      state: {
        ...application,
        readyForSubmission: true,
        finalConfirmed: true,
      },
    });
  }

  const pageStyle = {
    minHeight: "100vh",
    background: isDark ? "#07111f" : "#f5f7fb",
    color: isDark ? "#ffffff" : "#111827",
    padding: "20px 16px 45px",
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

  const badge = (good) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 800,
    background: good
      ? isDark
        ? "#12351f"
        : "#dcfce7"
      : isDark
      ? "#35171b"
      : "#fee2e2",
    color: good
      ? isDark
        ? "#86efac"
        : "#166534"
      : isDark
      ? "#fda4af"
      : "#991b1b",
  });

  if (!location.state) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            ...cardStyle,
            maxWidth: 600,
            margin: "60px auto",
            textAlign: "center",
          }}
        >
          <img
            src={LOGO}
            alt="CHSDOSA"
            style={{
              width: 75,
              height: 75,
              borderRadius: 18,
              objectFit: "cover",
              marginBottom: 15,
            }}
          />

          <h2>Loan Application Not Found</h2>

          <p style={{ opacity: 0.7 }}>
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
                opacity: 0.6,
              }}
            >
              CHSDOSA COOPERATIVE
            </div>

            <h2 style={{ margin: "3px 0 0" }}>
              Final Review
            </h2>
          </div>
        </div>

        {/* SUCCESS HEADER */}
        <div
          style={{
            ...cardStyle,
            textAlign: "center",
            background: isDark ? "#0d2a1b" : "#f0fdf4",
            borderColor: isDark ? "#1d5935" : "#bbf7d0",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#16a34a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              fontSize: 30,
            }}
          >
            ✓
          </div>

          <h2 style={{ margin: 0 }}>
            Application Ready
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              opacity: 0.75,
              lineHeight: 1.5,
            }}
          >
            The applicant and both guarantors have completed
            their acceptance and electronic signatures.
          </p>
        </div>

        {/* LOAN DETAILS */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            Loan Details
          </h3>

          <div
            style={{
              background: isDark ? "#0b1626" : "#f8fafc",
              borderRadius: 15,
              padding: 16,
              marginBottom: 15,
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.6,
                marginBottom: 5,
              }}
            >
              REQUESTED AMOUNT
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              {formatNGN(requestedAmount)}
            </div>
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

              <strong>
                {formatNGN(monthlyRepayment)}
              </strong>
            </div>
          </div>
        </div>

        {/* APPLICANT */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            Applicant Confirmation
          </h3>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 15,
            }}
          >
            <span>Loan Agreement</span>

            <span style={badge(applicantAgreed)}>
              {applicantAgreed ? "ACCEPTED" : "NOT ACCEPTED"}
            </span>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: isDark ? "#0b1626" : "#f8fafc",
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.6,
                marginBottom: 5,
              }}
            >
              ELECTRONIC SIGNATURE
            </div>

            <strong>
              {applicantSignature || "Not provided"}
            </strong>
          </div>
        </div>

        {/* GUARANTOR 1 */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <h3 style={{ margin: 0 }}>
              Guarantor 1
            </h3>

            <span style={badge(guarantor1Accepted)}>
              {guarantor1Accepted
                ? "ACCEPTED"
                : "NOT ACCEPTED"}
            </span>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: isDark ? "#0b1626" : "#f8fafc",
            }}
          >
            <strong>
              {guarantor1Name}
            </strong>

            <div
              style={{
                fontSize: 13,
                opacity: 0.65,
                marginTop: 5,
              }}
            >
              Member ID:{" "}
              {guarantor1?.member_number ||
                "Not available"}
            </div>

            <div
              style={{
                fontSize: 13,
                opacity: 0.65,
                marginTop: 3,
              }}
            >
              Regime:{" "}
              {guarantor1?.regime ||
                "Not available"}
            </div>

            <div
              style={{
                borderTop: `1px solid ${
                  isDark ? "#23344d" : "#e5e7eb"
                }`,
                marginTop: 13,
                paddingTop: 13,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  marginBottom: 5,
                }}
              >
                ELECTRONIC SIGNATURE
              </div>

              <strong>
                {guarantor1Signature ||
                  "Not provided"}
              </strong>
            </div>
          </div>
        </div>

        {/* GUARANTOR 2 */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <h3 style={{ margin: 0 }}>
              Guarantor 2
            </h3>

            <span style={badge(guarantor2Accepted)}>
              {guarantor2Accepted
                ? "ACCEPTED"
                : "NOT ACCEPTED"}
            </span>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: isDark ? "#0b1626" : "#f8fafc",
            }}
          >
            <strong>
              {guarantor2Name}
            </strong>

            <div
              style={{
                fontSize: 13,
                opacity: 0.65,
                marginTop: 5,
              }}
            >
              Member ID:{" "}
              {guarantor2?.member_number ||
                "Not available"}
            </div>

            <div
              style={{
                fontSize: 13,
                opacity: 0.65,
                marginTop: 3,
              }}
            >
              Regime:{" "}
              {guarantor2?.regime ||
                "Not available"}
            </div>

            <div
              style={{
                borderTop: `1px solid ${
                  isDark ? "#23344d" : "#e5e7eb"
                }`,
                marginTop: 13,
                paddingTop: 13,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  marginBottom: 5,
                }}
              >
                ELECTRONIC SIGNATURE
              </div>

              <strong>
                {guarantor2Signature ||
                  "Not provided"}
              </strong>
            </div>
          </div>
        </div>

        {/* FINAL CONFIRMATION */}
        <div style={cardStyle}>
          <label
            style={{
              display: "flex",
              gap: 11,
              alignItems: "flex-start",
              lineHeight: 1.55,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) =>
                setConfirmed(e.target.checked)
              }
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
              }}
            />

            <span>
              I have reviewed the loan amount, repayment period,
              applicant information and both guarantor
              confirmations. I confirm that the information is
              correct and I am ready to submit this application
              for administrator review.
            </span>
          </label>
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

        {/* SUBMIT */}
        <button
          onClick={submitForReview}
          disabled={
            !allRequirementsComplete ||
            !confirmed
          }
          style={{
            width: "100%",
            padding: "17px",
            border: "none",
            borderRadius: 15,
            background:
              allRequirementsComplete && confirmed
                ? "#16a34a"
                : isDark
                ? "#26364b"
                : "#d1d5db",
            color:
              allRequirementsComplete && confirmed
                ? "#ffffff"
                : isDark
                ? "#8fa0b7"
                : "#6b7280",
            fontSize: 16,
            fontWeight: 800,
            cursor:
              allRequirementsComplete && confirmed
                ? "pointer"
                : "not-allowed",
          }}
        >
          SUBMIT FOR ADMINISTRATOR REVIEW
        </button>

        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            opacity: 0.5,
            marginTop: 15,
          }}
        >
          CHSDOSA Cooperative
          <br />
          Leadership with Integrity, Unity and Progress
        </div>
      </div>
    </div>
  );
}