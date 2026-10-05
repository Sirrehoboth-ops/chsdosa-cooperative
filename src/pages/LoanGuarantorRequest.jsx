import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

function formatNaira(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function LoanGuarantorRequest() {
  const navigate = useNavigate();
  const { loanId } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loan, setLoan] = useState(null);
  const [guarantor, setGuarantor] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [showAccept, setShowAccept] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const darkMode =
    typeof window !== "undefined" &&
    localStorage.getItem("chsdosa-dark-mode") === "true";

  useEffect(() => {
    loadRequest();
  }, [loanId]);

  async function loadRequest() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      if (!loanId) {
        setError("Loan request could not be identified.");
        return;
      }

      // --------------------------------------------------
      // LOAD LOAN
      // --------------------------------------------------

      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .select(`
          id,
          applicant_id,
          savings_amount,
          eligible_amount,
          requested_amount,
          approved_amount,
          repayment_months,
          estimated_monthly_payment,
          status,
          created_at
        `)
        .eq("id", loanId)
        .maybeSingle();

      if (loanError) throw loanError;

      if (!loanData) {
        setError("This loan request could not be found.");
        return;
      }

      // --------------------------------------------------
      // LOAD CURRENT MEMBER'S GUARANTOR RECORD
      // --------------------------------------------------

      const { data: guarantorData, error: guarantorError } =
        await supabase
          .from("loan_guarantors")
          .select(`
            id,
            loan_id,
            guarantor_id,
            guarantor_number,
            requirement,
            status,
            signature,
            signed_at,
            responded_at
          `)
          .eq("loan_id", loanId)
          .eq("guarantor_id", session.user.id)
          .maybeSingle();

      if (guarantorError) throw guarantorError;

      if (!guarantorData) {
        setError(
          "You are not an assigned guarantor for this loan."
        );
        return;
      }

      // --------------------------------------------------
      // LOAD APPLICANT
      // --------------------------------------------------

      const { data: applicantData, error: applicantError } =
        await supabase
          .from("members")
          .select(`
            id,
            full_name,
            member_number,
            regime
          `)
          .eq("id", loanData.applicant_id)
          .maybeSingle();

      if (applicantError) throw applicantError;

      setLoan(loanData);
      setGuarantor(guarantorData);
      setApplicant(applicantData);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load this guarantor request."
      );
    } finally {
      setLoading(false);
    }
  }

  async function respondToRequest(action) {
    setError("");
    setProcessing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        navigate("/login", { replace: true });
        return;
      }

      if (action === "accept") {
        if (!signature.trim()) {
          setError(
            "Please enter your full name as your electronic signature."
          );
          setProcessing(false);
          return;
        }

        if (signature.trim().length < 2) {
          setError(
            "Please enter your full name as your electronic signature."
          );
          setProcessing(false);
          return;
        }
      }

      const { data, error: functionError } =
        await supabase.functions.invoke(
          "respond-to-loan-guarantor",
          {
            body: {
              loanId,
              action,
              signature:
                action === "accept"
                  ? signature.trim()
                  : "",
              declineReason:
                action === "decline"
                  ? declineReason.trim()
                  : "",
            },
          }
        );

      if (functionError) {
        throw functionError;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Unable to process your response."
        );
      }

      if (action === "accept") {
        alert(
          data?.message ||
            "Your guarantor acceptance has been recorded."
        );
      } else {
        alert(
          data?.message ||
            "You have declined the guarantor request."
        );
      }

      navigate("/notifications", {
        replace: true,
      });
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to process your response. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: darkMode ? "#0b1220" : "#f5f7fb",
          color: darkMode ? "#fff" : "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: 24,
        }}
      >
        <img
          src={LOGO}
          alt="CHSDOSA"
          style={{
            width: 70,
            height: 70,
            objectFit: "contain",
          }}
        />

        <div>Loading guarantor request...</div>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: darkMode ? "#0b1220" : "#f5f7fb",
          color: darkMode ? "#fff" : "#111827",
          padding: 20,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={backButton(darkMode)}
        >
          ← Back
        </button>

        <div style={errorCard(darkMode)}>
          <div style={{ fontSize: 42 }}>⚠️</div>

          <h2>Request unavailable</h2>

          <p>{error}</p>
        </div>
      </div>
    );
  }

  const alreadyResponded =
    guarantor?.status !== "pending";

  const requirementText =
    guarantor?.guarantor_number === 1
      ? "Same-regime CHSDOSA guarantor"
      : "CHSDOSA guarantor from any regime";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkMode ? "#0b1220" : "#f5f7fb",
        color: darkMode ? "#fff" : "#111827",
        paddingBottom: 40,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: darkMode
            ? "rgba(11,18,32,.95)"
            : "rgba(255,255,255,.95)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${
            darkMode ? "#243044" : "#e5e7eb"
          }`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            color: darkMode ? "#fff" : "#111827",
            fontSize: 25,
            cursor: "pointer",
          }}
        >
          ←
        </button>

        <img
          src={LOGO}
          alt="CHSDOSA"
          style={{
            width: 42,
            height: 42,
            objectFit: "contain",
          }}
        />

        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            CHSDOSA LOAN
          </div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.65,
            }}
          >
            Guarantor Request
          </div>
        </div>
      </div>

      <main
        style={{
          maxWidth: 620,
          margin: "0 auto",
          padding: 18,
        }}
      >
        {/* ERROR */}

        {error && (
          <div
            style={{
              background: darkMode
                ? "#3b1720"
                : "#fee2e2",
              color: darkMode
                ? "#fecaca"
                : "#991b1b",
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* TITLE */}

        <div
          style={{
            textAlign: "center",
            marginTop: 10,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 46,
              marginBottom: 8,
            }}
          >
            🤝
          </div>

          <div
            style={{
              display: "inline-block",
              background: darkMode
                ? "#1d4ed8"
                : "#dbeafe",
              color: darkMode ? "#fff" : "#1e40af",
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            CHSDOSA MEMBER
          </div>

          <h1
            style={{
              margin: "14px 0 6px",
              fontSize: 26,
            }}
          >
            Guarantor Request
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.68,
              lineHeight: 1.5,
            }}
          >
            You have been selected to guarantee this
            CHSDOSA loan.
          </p>
        </div>

        {/* GUARANTOR POSITION */}

        <section style={card(darkMode)}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            Your Role
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginTop: 5,
            }}
          >
            Guarantor {guarantor?.guarantor_number}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              opacity: 0.7,
            }}
          >
            {requirementText}
          </div>
        </section>

        {/* APPLICANT */}

        <section style={card(darkMode)}>
          <div
            style={sectionTitle}
          >
            Applicant
          </div>

          <InfoRow
            darkMode={darkMode}
            label="Full Name"
            value={
              applicant?.full_name || "Not available"
            }
          />

          <InfoRow
            darkMode={darkMode}
            label="Member ID"
            value={
              applicant?.member_number ||
              "Not available"
            }
          />

          <InfoRow
            darkMode={darkMode}
            label="Regime"
            value={
              applicant?.regime || "Not available"
            }
          />
        </section>

        {/* LOAN DETAILS */}

        <section style={card(darkMode)}>
          <div style={sectionTitle}>
            Loan Details
          </div>

          <InfoRow
            darkMode={darkMode}
            label="Requested Amount"
            value={formatNaira(
              loan?.requested_amount
            )}
            strong
          />

          <InfoRow
            darkMode={darkMode}
            label="Repayment Period"
            value={`${loan?.repayment_months} months`}
          />

          <InfoRow
            darkMode={darkMode}
            label="Estimated Monthly Payment"
            value={formatNaira(
              loan?.estimated_monthly_payment
            )}
          />

          <InfoRow
            darkMode={darkMode}
            label="Applicant Savings"
            value={formatNaira(
              loan?.savings_amount
            )}
          />

          <InfoRow
            darkMode={darkMode}
            label="Eligible Amount"
            value={formatNaira(
              loan?.eligible_amount
            )}
          />
        </section>

        {/* RESPONSIBILITY */}

        <section style={card(darkMode)}>
          <div style={sectionTitle}>
            Your Responsibility
          </div>

          <p style={paragraph}>
            By accepting this request, you acknowledge
            that you are voluntarily standing as a
            guarantor for the applicant's loan.
          </p>

          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              lineHeight: 1.8,
              fontSize: 14,
              opacity: 0.85,
            }}
          >
            <li>
              You confirm that you know the applicant
              and agree to guarantee the loan.
            </li>

            <li>
              Your guarantor obligation remains active
              until the loan is fully repaid and marked
              <strong> completed</strong>.
            </li>

            <li>
              While this obligation is active, you
              cannot take a new CHSDOSA loan.
            </li>

            <li>
              While this obligation is active, you
              cannot guarantee another loan.
            </li>

            <li>
              Your normal CHSDOSA account remains
              available; the restriction applies to
              new loan obligations.
            </li>
          </ul>
        </section>

        {/* ALREADY RESPONDED */}

        {alreadyResponded ? (
          <section
            style={{
              ...card(darkMode),
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 44,
                marginBottom: 8,
              }}
            >
              {guarantor?.status === "accepted"
                ? "✅"
                : "❌"}
            </div>

            <h2 style={{ margin: "5px 0 8px" }}>
              {guarantor?.status === "accepted"
                ? "Request Accepted"
                : "Request Declined"}
            </h2>

            <p
              style={{
                opacity: 0.7,
                marginBottom: 18,
              }}
            >
              You have already responded to this
              guarantor request.
            </p>

            <button
              onClick={() =>
                navigate("/notifications")
              }
              style={primaryButton}
            >
              Back to Notifications
            </button>
          </section>
        ) : (
          <>
            {/* ACTIONS */}

            <section style={card(darkMode)}>
              <div style={sectionTitle}>
                Your Decision
              </div>

              <p style={paragraph}>
                Please review the information above
                carefully before making your decision.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 12,
                  marginTop: 18,
                }}
              >
                <button
                  disabled={processing}
                  onClick={() =>
                    setShowDecline(true)
                  }
                  style={declineButton}
                >
                  DECLINE
                </button>

                <button
                  disabled={processing}
                  onClick={() =>
                    setShowAccept(true)
                  }
                  style={primaryButton}
                >
                  ACCEPT & SIGN
                </button>
              </div>
            </section>

            {/* ACCEPT */}

            {showAccept && (
              <section style={card(darkMode)}>
                <div style={sectionTitle}>
                  Electronic Signature
                </div>

                <p style={paragraph}>
                  Type your full name below. This
                  signature represents your personal
                  acceptance of the guarantor
                  responsibility.
                </p>

                <input
                  type="text"
                  value={signature}
                  onChange={(e) =>
                    setSignature(e.target.value)
                  }
                  placeholder="Enter your full name"
                  disabled={processing}
                  style={inputStyle(darkMode)}
                />

                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    background: darkMode
                      ? "#172033"
                      : "#f3f4f6",
                    fontSize: 12,
                    lineHeight: 1.5,
                    opacity: 0.8,
                  }}
                >
                  By signing and accepting, you confirm
                  that you understand and accept the
                  guarantor responsibility described
                  above.
                </div>

                <button
                  disabled={processing}
                  onClick={() =>
                    respondToRequest("accept")
                  }
                  style={{
                    ...primaryButton,
                    width: "100%",
                    marginTop: 16,
                    opacity: processing ? 0.6 : 1,
                  }}
                >
                  {processing
                    ? "PROCESSING..."
                    : "CONFIRM & ACCEPT GUARANTOR ROLE"}
                </button>

                <button
                  disabled={processing}
                  onClick={() =>
                    setShowAccept(false)
                  }
                  style={{
                    ...secondaryButton(darkMode),
                    width: "100%",
                    marginTop: 10,
                  }}
                >
                  CANCEL
                </button>
              </section>
            )}

            {/* DECLINE */}

            {showDecline && (
              <section style={card(darkMode)}>
                <div style={sectionTitle}>
                  Decline Request
                </div>

                <p style={paragraph}>
                  You may provide a reason for declining
                  this guarantor request.
                </p>

                <textarea
                  value={declineReason}
                  onChange={(e) =>
                    setDeclineReason(e.target.value)
                  }
                  placeholder="Reason for declining (optional)"
                  rows={4}
                  disabled={processing}
                  style={{
                    ...inputStyle(darkMode),
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />

                <button
                  disabled={processing}
                  onClick={() =>
                    respondToRequest("decline")
                  }
                  style={{
                    ...declineButton,
                    width: "100%",
                    marginTop: 14,
                    opacity: processing ? 0.6 : 1,
                  }}
                >
                  {processing
                    ? "PROCESSING..."
                    : "CONFIRM DECLINE"}
                </button>

                <button
                  disabled={processing}
                  onClick={() =>
                    setShowDecline(false)
                  }
                  style={{
                    ...secondaryButton(darkMode),
                    width: "100%",
                    marginTop: 10,
                  }}
                >
                  CANCEL
                </button>
              </section>
            )}
          </>
        )}

        {/* SECURITY NOTE */}

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 12,
            opacity: 0.55,
            lineHeight: 1.6,
          }}
        >
          🔐 Your response is processed securely through
          CHSDOSA's loan system.
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  label,
  value,
  strong,
  darkMode,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "11px 0",
        borderBottom: `1px solid ${
          darkMode ? "#253047" : "#eef0f3"
        }`,
      }}
    >
      <span
        style={{
          fontSize: 13,
          opacity: 0.62,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: 14,
          fontWeight: strong ? 800 : 600,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: 800,
  marginBottom: 14,
};

const paragraph = {
  fontSize: 14,
  lineHeight: 1.7,
  opacity: 0.78,
  marginTop: 0,
};

function card(darkMode) {
  return {
    background: darkMode ? "#111a2b" : "#ffffff",
    border: `1px solid ${
      darkMode ? "#26334a" : "#e6e9ef"
    }`,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    boxShadow: darkMode
      ? "none"
      : "0 4px 18px rgba(0,0,0,.04)",
  };
}

function errorCard(darkMode) {
  return {
    maxWidth: 500,
    margin: "70px auto",
    textAlign: "center",
    background: darkMode ? "#111a2b" : "#fff",
    border: `1px solid ${
      darkMode ? "#26334a" : "#e6e9ef"
    }`,
    borderRadius: 18,
    padding: 24,
  };
}

function backButton(darkMode) {
  return {
    border: "none",
    background: "transparent",
    color: darkMode ? "#fff" : "#111827",
    fontSize: 16,
    cursor: "pointer",
    padding: 5,
  };
}

function inputStyle(darkMode) {
  return {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: `1px solid ${
      darkMode ? "#334155" : "#d1d5db"
    }`,
    background: darkMode ? "#0f172a" : "#fff",
    color: darkMode ? "#fff" : "#111827",
    padding: "13px 14px",
    fontSize: 15,
    outline: "none",
  };
}

const primaryButton = {
  border: "none",
  borderRadius: 12,
  padding: "14px 16px",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const declineButton = {
  border: "none",
  borderRadius: 12,
  padding: "14px 16px",
  background: "#dc2626",
  color: "#fff",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

function secondaryButton(darkMode) {
  return {
    border: `1px solid ${
      darkMode ? "#334155" : "#d1d5db"
    }`,
    borderRadius: 12,
    padding: "13px 16px",
    background: "transparent",
    color: darkMode ? "#fff" : "#111827",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
}