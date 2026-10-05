import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

export default function LoanGuarantors() {
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

  const [member, setMember] = useState(null);
  const [guarantorOne, setGuarantorOne] = useState(null);
  const [guarantorTwo, setGuarantorTwo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const [acceptedOne, setAcceptedOne] = useState(false);
  const [acceptedTwo, setAcceptedTwo] = useState(false);

  const [signatureOne, setSignatureOne] = useState("");
  const [signatureTwo, setSignatureTwo] = useState("");

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
    return (
      guarantorOne &&
      guarantorTwo &&
      guarantorOne !== guarantorTwo &&
      guarantorOneDataValid &&
      guarantorTwoDataValid &&
      acceptedOne &&
      acceptedTwo &&
      signatureOne.trim() &&
      signatureTwo.trim()
    );
  }, [
    guarantorOne,
    guarantorTwo,
    acceptedOne,
    acceptedTwo,
    signatureOne,
    signatureTwo,
  ]);

  const [guarantorOneDataValid, setGuarantorOneDataValid] = useState(false);
  const [guarantorTwoDataValid, setGuarantorTwoDataValid] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: currentMember, error: memberError } = await supabase
        .from("members")
        .select("id, full_name, member_number, regime")
        .eq("id", session.user.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!currentMember) {
        setError("Your CHSDOSA member profile could not be found.");
        return;
      }

      setMember(currentMember);

      if (!guarantorOne || !guarantorTwo) {
        setError(
          "Guarantor information is missing. Please return to the loan application."
        );
        return;
      }

      if (guarantorOne === guarantorTwo) {
        setError("Guarantor 1 and Guarantor 2 must be different members.");
        return;
      }

      await verifyGuarantors(currentMember);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Unable to verify the guarantors. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyGuarantors(currentMember) {
    setChecking(true);
    setError("");

    try {
      /*
       * Guarantor 1:
       * Must belong to the applicant's same regime.
       */
      const { data: g1, error: g1Error } = await supabase
        .from("members")
        .select("id, full_name, member_number, regime")
        .eq("member_number", guarantorOne)
        .maybeSingle();

      if (g1Error) throw g1Error;

      if (!g1) {
        setGuarantorOneDataValid(false);
        setError(
          "Guarantor 1 could not be found. Check the CHSDOSA Member ID."
        );
      } else if (g1.id === currentMember.id) {
        setGuarantorOneDataValid(false);
        setError("You cannot use yourself as a guarantor.");
      } else if (g1.regime !== currentMember.regime) {
        setGuarantorOneDataValid(false);
        setError(
          "Guarantor 1 must be an approved member from your same regime."
        );
      } else {
        setGuarantorOne(g1);
        setGuarantorOneDataValid(true);
      }

      /*
       * Guarantor 2:
       * Can belong to any CHSDOSA regime.
       */
      const { data: g2, error: g2Error } = await supabase
        .from("members")
        .select("id, full_name, member_number, regime")
        .eq("member_number", guarantorTwo)
        .maybeSingle();

      if (g2Error) throw g2Error;

      if (!g2) {
        setGuarantorTwoDataValid(false);
        setError(
          "Guarantor 2 could not be found. Check the CHSDOSA Member ID."
        );
      } else if (g2.id === currentMember.id) {
        setGuarantorTwoDataValid(false);
        setError("You cannot use yourself as a guarantor.");
      } else if (g1 && g2.id === g1.id) {
        setGuarantorTwoDataValid(false);
        setError("Guarantor 1 and Guarantor 2 must be different members.");
      } else {
        setGuarantorTwo(g2);
        setGuarantorTwoDataValid(true);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "There was a problem checking the guarantors."
      );
    } finally {
      setChecking(false);
    }
  }

  function continueApplication() {
    if (!guarantorOneDataValid || !guarantorTwoDataValid) {
      setError("Both guarantors must be valid CHSDOSA members.");
      return;
    }

    if (!acceptedOne || !acceptedTwo) {
      setError("Both guarantors must accept the guarantor responsibility.");
      return;
    }

    if (!signatureOne.trim() || !signatureTwo.trim()) {
      setError("Both guarantors must provide their electronic signatures.");
      return;
    }

    navigate("/loan/submission", {
      state: {
        ...application,
        applicant: member,
        guarantor1: guarantorOne,
        guarantor2: guarantorTwo,
        guarantor1Accepted: acceptedOne,
        guarantor2Accepted: acceptedTwo,
        guarantor1Signature: signatureOne.trim(),
        guarantor2Signature: signatureTwo.trim(),
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
    padding: "13px 14px",
    borderRadius: 12,
    border: `1px solid ${isDark ? "#344866" : "#d1d5db"}`,
    background: isDark ? "#0b1626" : "#ffffff",
    color: isDark ? "#ffffff" : "#111827",
    outline: "none",
    fontSize: 15,
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div>
            <img
              src={LOGO}
              alt="CHSDOSA"
              style={{
                width: 70,
                height: 70,
                borderRadius: 18,
                objectFit: "cover",
                marginBottom: 15,
              }}
            />
            <div style={{ fontWeight: 700 }}>
              Verifying guarantors...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
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
            <div style={{ fontSize: 13, opacity: 0.65 }}>
              CHSDOSA COOPERATIVE
            </div>
            <h2 style={{ margin: "3px 0 0" }}>
              Guarantor Approval
            </h2>
          </div>
        </div>

        {/* LOAN SUMMARY */}
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginBottom: 6,
            }}
          >
            LOAN REQUEST
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              marginBottom: 15,
            }}
          >
            {formatNGN(requestedAmount)}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <small style={{ opacity: 0.6 }}>Savings</small>
              <div style={{ fontWeight: 700 }}>
                {formatNGN(saving)}
              </div>
            </div>

            <div>
              <small style={{ opacity: 0.6 }}>Maximum Eligible</small>
              <div style={{ fontWeight: 700 }}>
                {formatNGN(eligibleAmount)}
              </div>
            </div>

            <div>
              <small style={{ opacity: 0.6 }}>Repayment</small>
              <div style={{ fontWeight: 700 }}>
                {duration} months
              </div>
            </div>

            <div>
              <small style={{ opacity: 0.6 }}>
                Estimated Monthly
              </small>
              <div style={{ fontWeight: 700 }}>
                {formatNGN(monthlyRepayment)}
              </div>
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
            <div style={{ marginTop: 6 }}>{error}</div>
          </div>
        )}

        {/* GUARANTOR 1 */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Guarantor 1</h3>
              <small style={{ opacity: 0.65 }}>
                Same regime required
              </small>
            </div>

            {guarantorOneDataValid && (
              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "6px 9px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                VERIFIED
              </span>
            )}
          </div>

          {guarantorOneDataValid ? (
            <>
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: isDark ? "#0b1626" : "#f8fafc",
                  marginBottom: 15,
                }}
              >
                <strong>{guarantorOne.full_name}</strong>

                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.65,
                    marginTop: 5,
                  }}
                >
                  Member ID: {guarantorOne.member_number}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.65,
                    marginTop: 3,
                  }}
                >
                  Regime: {guarantorOne.regime}
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedOne}
                  onChange={(e) =>
                    setAcceptedOne(e.target.checked)
                  }
                  style={{ marginTop: 4 }}
                />

                <span>
                  I accept responsibility as guarantor for this
                  loan and agree to the CHSDOSA Cooperative loan
                  guarantor terms.
                </span>
              </label>

              <div style={{ marginTop: 15 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 7,
                  }}
                >
                  Electronic Signature
                </label>

                <input
                  value={signatureOne}
                  onChange={(e) =>
                    setSignatureOne(e.target.value)
                  }
                  placeholder="Type your full name"
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.7 }}>
              Guarantor 1 has not been successfully verified.
            </div>
          )}
        </div>

        {/* GUARANTOR 2 */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Guarantor 2</h3>
              <small style={{ opacity: 0.65 }}>
                Any approved CHSDOSA regime
              </small>
            </div>

            {guarantorTwoDataValid && (
              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "6px 9px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                VERIFIED
              </span>
            )}
          </div>

          {guarantorTwoDataValid ? (
            <>
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: isDark ? "#0b1626" : "#f8fafc",
                  marginBottom: 15,
                }}
              >
                <strong>{guarantorTwo.full_name}</strong>

                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.65,
                    marginTop: 5,
                  }}
                >
                  Member ID: {guarantorTwo.member_number}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.65,
                    marginTop: 3,
                  }}
                >
                  Regime: {guarantorTwo.regime}
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedTwo}
                  onChange={(e) =>
                    setAcceptedTwo(e.target.checked)
                  }
                  style={{ marginTop: 4 }}
                />

                <span>
                  I accept responsibility as guarantor for this
                  loan and agree to the CHSDOSA Cooperative loan
                  guarantor terms.
                </span>
              </label>

              <div style={{ marginTop: 15 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 7,
                  }}
                >
                  Electronic Signature
                </label>

                <input
                  value={signatureTwo}
                  onChange={(e) =>
                    setSignatureTwo(e.target.value)
                  }
                  placeholder="Type your full name"
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.7 }}>
              Guarantor 2 has not been successfully verified.
            </div>
          )}
        </div>

        {/* IMPORTANT NOTICE */}
        <div
          style={{
            ...cardStyle,
            background: isDark ? "#12243a" : "#eff6ff",
            borderColor: isDark ? "#244d73" : "#bfdbfe",
          }}
        >
          <strong>Important</strong>

          <p
            style={{
              margin: "8px 0 0",
              lineHeight: 1.6,
              fontSize: 14,
              opacity: 0.85,
            }}
          >
            Your loan application will not be submitted for
            administrator review until both guarantors have
            accepted and electronically signed.
          </p>
        </div>

        {/* CONTINUE */}
        <button
          onClick={continueApplication}
          disabled={!canContinue || checking}
          style={{
            width: "100%",
            padding: "16px",
            border: "none",
            borderRadius: 14,
            background:
              canContinue && !checking
                ? "#16a34a"
                : isDark
                ? "#26364b"
                : "#d1d5db",
            color:
              canContinue && !checking
                ? "#ffffff"
                : isDark
                ? "#8fa0b7"
                : "#6b7280",
            fontSize: 16,
            fontWeight: 800,
            cursor:
              canContinue && !checking
                ? "pointer"
                : "not-allowed",
          }}
        >
          {checking
            ? "VERIFYING..."
            : "CONTINUE TO SUBMISSION"}
        </button>
      </div>
    </div>
  );
}