import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function VerifyCode() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    localStorage.getItem("chsdosa-verification-email") ||
    "";

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const [resendSeconds, setResendSeconds] = useState(0);
  const [statusLoading, setStatusLoading] = useState(true);
  const [cooldownMode, setCooldownMode] = useState(false);

  const timerRef = useRef(null);

  const formatTime = (seconds) => {
    const cleanSeconds = Math.max(
      0,
      Number(seconds) || 0
    );

    const minutes = Math.floor(cleanSeconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (cleanSeconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  };

  /*
   * Apply server-controlled countdown.
   */
  const updateCountdown = (
    seconds,
    cooldown = false
  ) => {
    const cleanSeconds = Math.max(
      0,
      Number(seconds) || 0
    );

    setResendSeconds(cleanSeconds);
    setCooldownMode(
      Boolean(cooldown && cleanSeconds > 0)
    );
  };

  /*
   * Ask the server for the current verification
   * status every time this page is opened.
   *
   * The server is the authority.
   */
  const loadVerificationStatus = async () => {
    if (!email) {
      setStatusLoading(false);
      return;
    }

    setStatusLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "verification-status",
          {
            body: {
              email: email.trim().toLowerCase(),
            },
          }
        );

      if (error) {
        console.error(
          "Verification status error:",
          error
        );

        /*
         * Do not show a scary error immediately.
         * The user can still remain on the page.
         */
        setResendSeconds(0);
        setCooldownMode(false);
        return;
      }

      if (!data?.success) {
        setResendSeconds(0);
        setCooldownMode(false);
        return;
      }

      updateCountdown(
        data.remaining_seconds,
        data.cooldown
      );
    } catch (error) {
      console.error(
        "Verification status error:",
        error
      );

      setResendSeconds(0);
      setCooldownMode(false);
    } finally {
      setStatusLoading(false);
    }
  };

  /*
   * Load server countdown when page opens.
   */
  useEffect(() => {
    loadVerificationStatus();
  }, [email]);

  /*
   * Local one-second countdown.
   *
   * IMPORTANT:
   * This only counts down what the server already told us.
   * It does NOT create or restart a new 10-minute period.
   */
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (resendSeconds <= 0) {
      setResendSeconds(0);

      if (cooldownMode) {
        setCooldownMode(false);
      }

      return;
    }

    timerRef.current = setInterval(() => {
      setResendSeconds((previous) => {
        if (previous <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          setCooldownMode(false);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resendSeconds > 0]);

  /*
   * Verify the entered code.
   */
  const handleVerify = async () => {
    setMessage("");
    setMessageType("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.replace(/\D/g, "");

    if (!cleanEmail) {
      setMessage(
        "Verification email was not found. Please return to registration."
      );
      setMessageType("error");
      return;
    }

    if (cleanCode.length !== 6) {
      setMessage(
        "Please enter the 6-digit verification code."
      );
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "verify-member-code",
          {
            body: {
              email: cleanEmail,
              code: cleanCode,
            },
          }
        );

      if (error) {
        console.error(
          "Verification error:",
          error
        );

        /*
         * Supabase Edge Functions may return a non-2xx
         * response for an invalid/expired code.
         */
        let serverMessage = "";

        try {
          if (error.context) {
            const response = error.context;

            if (typeof response.json === "function") {
              const body = await response.json();

              serverMessage =
                body?.error ||
                body?.message ||
                "";
            }
          }
        } catch {
          // Ignore JSON parsing failure.
        }

        setMessage(
          serverMessage ||
            "The verification code could not be accepted. Please check the code and try again."
        );

        setMessageType("error");
        return;
      }

      if (!data?.success) {
        setMessage(
          data?.error ||
            "Verification failed. Please check your code and try again."
        );

        setMessageType("error");
        return;
      }

      /*
       * Verification succeeded.
       */
      localStorage.removeItem(
        "chsdosa-verification-email"
      );

      setCode("");

      setMessage(
        "Your email has been verified successfully."
      );

      setMessageType("success");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            verified: true,
            email: cleanEmail,
          },
        });
      }, 1200);
    } catch (error) {
      console.error(
        "Verification error:",
        error
      );

      setMessage(
        "Something went wrong while verifying your account. Please try again."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /*
   * Request a NEW verification code.
   *
   * This button only becomes available when the
   * current server-controlled timer reaches zero.
   */
  const handleResend = async () => {
    if (
      resendSeconds > 0 ||
      loading ||
      statusLoading
    ) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage(
        "Verification email was not found. Please register again."
      );

      setMessageType("error");
      return;
    }

    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "resend-verification-code",
          {
            body: {
              email: cleanEmail,
            },
          }
        );

      /*
       * The resend function can intentionally return
       * HTTP 429 while a code is still valid or during
       * the 30-minute resend protection period.
       */
      if (error) {
        console.error(
          "Resend error:",
          error
        );

        let serverData = null;

        try {
          if (error.context) {
            const response = error.context;

            if (typeof response.json === "function") {
              serverData = await response.json();
            }
          }
        } catch {
          // Ignore parsing errors.
        }

        /*
         * Existing code is still valid.
         */
        if (serverData?.waiting) {
          updateCountdown(
            serverData.remaining_seconds,
            false
          );

          setMessage(
            `Your current code is still valid. Please wait ${formatTime(
              serverData.remaining_seconds
            )} before requesting another code.`
          );

          setMessageType("info");
          return;
        }

        /*
         * 30-minute protection period.
         */
        if (serverData?.cooldown) {
          updateCountdown(
            serverData.remaining_seconds,
            true
          );

          setMessage(
            `Resend is temporarily locked. Please wait ${formatTime(
              serverData.remaining_seconds
            )}.`
          );

          setMessageType("info");
          return;
        }

        setMessage(
          serverData?.error ||
            "Unable to resend the verification code. Please try again."
        );

        setMessageType("error");
        return;
      }

      /*
       * Some backend versions may return waiting/cooldown
       * with a successful HTTP response.
       */
      if (data?.waiting) {
        updateCountdown(
          data.remaining_seconds,
          false
        );

        setMessage(
          `Your current code is still valid. Please wait ${formatTime(
            data.remaining_seconds
          )}.`
        );

        setMessageType("info");
        return;
      }

      if (data?.cooldown) {
        updateCountdown(
          data.remaining_seconds,
          true
        );

        setMessage(
          `Resend is temporarily locked. Please wait ${formatTime(
            data.remaining_seconds
          )}.`
        );

        setMessageType("info");
        return;
      }

      if (!data?.success) {
        setMessage(
          data?.error ||
            "Unable to resend the verification code."
        );

        setMessageType("error");
        return;
      }

      /*
       * SUCCESSFUL RESEND
       *
       * The server should return 600 seconds.
       */
      const newWaitingSeconds =
        Number(data.waiting_seconds) || 600;

      updateCountdown(
        newWaitingSeconds,
        false
      );

      setCode("");

      setMessage(
        "A new verification code has been sent to your email."
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Resend error:",
        error
      );

      setMessage(
        "Something went wrong while requesting a new code. Please try again."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const resendAvailable =
    !statusLoading &&
    resendSeconds <= 0 &&
    !cooldownMode;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundHelp}>
        VERIFY
      </div>

      <div style={styles.circleOne}></div>
      <div style={styles.circleTwo}></div>

      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate("/register")}
        disabled={loading}
        aria-label="Back to registration"
      >
        ←
      </button>

      <div style={styles.container}>
        <div style={styles.logoArea}>
          <img
            src={`${import.meta.env.BASE_URL}chsdosa-icon.png`}
            alt="CHSDOSA Cooperative Society"
            style={styles.logo}
          />
        </div>

        <div style={styles.brand}>
          CHSDOSA
        </div>

        <div style={styles.badge}>
          EMAIL VERIFICATION
        </div>

        <h1 style={styles.title}>
          Verify Your Account
        </h1>

        <p style={styles.subtitle}>
          We sent a 6-digit verification code to
        </p>

        <div style={styles.emailBox}>
          {email || "your email address"}
        </div>

        <div style={styles.card}>
          <label style={styles.label}>
            Verification Code
          </label>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            style={styles.codeInput}
            disabled={loading}
          />

          <p style={styles.helper}>
            Enter the 6-digit code from your CHSDOSA
            verification email.
          </p>

          <button
            type="button"
            onClick={handleVerify}
            disabled={
              loading ||
              statusLoading ||
              code.length !== 6
            }
            style={{
              ...styles.verifyButton,
              opacity:
                loading ||
                statusLoading ||
                code.length !== 6
                  ? 0.65
                  : 1,
            }}
          >
            {loading
              ? "PLEASE WAIT..."
              : "VERIFY ACCOUNT"}
          </button>

          {message && (
            <div
              style={{
                ...styles.message,
                ...(messageType === "success"
                  ? styles.successMessage
                  : messageType === "info"
                  ? styles.infoMessage
                  : styles.errorMessage),
              }}
            >
              {message}
            </div>
          )}

          {/* 
            CURRENT CODE TIMER

            While this timer is running:
            - Resend is NOT shown.
            - Current code remains valid.
          */}
          {!resendAvailable && (
            <div
              style={
                cooldownMode
                  ? styles.cooldownBox
                  : styles.countdownBox
              }
            >
              <div style={styles.lockIcon}>
                🔒
              </div>

              <div style={styles.countdownText}>
                {statusLoading
                  ? "Checking verification status..."
                  : cooldownMode
                  ? "Resend temporarily locked"
                  : "Resend available in"}
              </div>

              {!statusLoading && (
                <div style={styles.countdownTime}>
                  {formatTime(resendSeconds)}
                </div>
              )}

              <div style={styles.countdownHint}>
                {statusLoading
                  ? "Please wait..."
                  : cooldownMode
                  ? "Please wait before requesting another code."
                  : "A new code can be requested when the timer reaches zero."}
              </div>
            </div>
          )}

          {/* 
            RESEND ONLY APPEARS AFTER 00:00
          */}
          {resendAvailable && (
            <div style={styles.resendArea}>
              <div style={styles.readyIcon}>
                ✓
              </div>

              <div style={styles.readyText}>
                Your verification code has expired.
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  ...styles.resendButton,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? "SENDING NEW CODE..."
                  : "RESEND VERIFICATION CODE"}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          style={styles.loginLink}
          onClick={() => navigate("/login")}
          disabled={loading}
        >
          Already verified? Sign in
        </button>

        <p style={styles.footer}>
          CHSDOSA Cooperative Society
        </p>

        <p style={styles.motto}>
          Leadership with Integrity, Unity and Progress
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "linear-gradient(145deg, #f7f9fc 0%, #edf3f8 55%, #e1ebf4 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "35px 20px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },

  backgroundHelp: {
    position: "absolute",
    top: "12%",
    right: "-35px",
    color: "rgba(23,59,99,0.035)",
    fontSize: "58px",
    fontWeight: "900",
    letterSpacing: "3px",
    transform: "rotate(-18deg)",
    pointerEvents: "none",
    userSelect: "none",
  },

  circleOne: {
    position: "absolute",
    width: "220px",
    height: "220px",
    borderRadius: "50%",
    background: "rgba(244,206,112,0.10)",
    top: "-90px",
    left: "-90px",
    pointerEvents: "none",
  },

  circleTwo: {
    position: "absolute",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background: "rgba(23,59,99,0.045)",
    bottom: "-130px",
    right: "-100px",
    pointerEvents: "none",
  },

  backButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    border: "1px solid #d8e0e8",
    background: "#ffffff",
    color: "#173b63",
    fontSize: "22px",
    cursor: "pointer",
    boxShadow:
      "0 5px 15px rgba(23,59,99,0.10)",
    zIndex: 5,
  },

  container: {
    width: "100%",
    maxWidth: "430px",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  },

  logoArea: {
    width: "88px",
    height: "88px",
    margin: "0 auto 10px",
    borderRadius: "25px",
    background: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "7px",
    boxSizing: "border-box",
    boxShadow:
      "0 10px 28px rgba(23,59,99,0.14)",
    border: "1px solid #e1e8ef",
  },

  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "18px",
  },

  brand: {
    color: "#173b63",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  badge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "6px 11px",
    borderRadius: "20px",
    background: "#fff1cf",
    color: "#8a621c",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.8px",
  },

  title: {
    margin: "20px 0 7px",
    color: "#18212f",
    fontSize: "27px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "0 0 9px",
    color: "#647181",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  emailBox: {
    display: "inline-block",
    maxWidth: "90%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#173b63",
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "20px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "25px 20px",
    boxShadow:
      "0 15px 40px rgba(23,59,99,0.12)",
    border: "1px solid #e5ebf1",
    textAlign: "left",
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#263548",
    fontSize: "13px",
    fontWeight: "700",
    textAlign: "center",
  },

  codeInput: {
    width: "100%",
    height: "62px",
    border: "2px solid #d7e0e8",
    borderRadius: "14px",
    background: "#f9fbfd",
    outline: "none",
    boxSizing: "border-box",
    textAlign: "center",
    fontSize: "29px",
    fontWeight: "900",
    letterSpacing: "9px",
    color: "#173b63",
  },

  helper: {
    margin: "11px 0 19px",
    color: "#7a8795",
    fontSize: "12px",
    lineHeight: "1.5",
    textAlign: "center",
  },

  verifyButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, #173b63, #245d8f)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(23,59,99,0.20)",
  },

  message: {
    marginTop: "15px",
    padding: "11px",
    borderRadius: "10px",
    fontSize: "13px",
    lineHeight: "1.5",
    textAlign: "center",
  },

  errorMessage: {
    background: "#fff0f0",
    color: "#b4232c",
  },

  successMessage: {
    background: "#ecfdf3",
    color: "#087443",
  },

  infoMessage: {
    background: "#eef6ff",
    color: "#245d8f",
  },

  countdownBox: {
    marginTop: "17px",
    padding: "16px 12px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #f4f8fc, #edf4fa)",
    border: "1px solid #d9e5ef",
    textAlign: "center",
  },

  cooldownBox: {
    marginTop: "17px",
    padding: "16px 12px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #fff7e6, #fff1d0)",
    border: "1px solid #f0d89b",
    textAlign: "center",
  },

  lockIcon: {
    fontSize: "22px",
    marginBottom: "5px",
  },

  countdownText: {
    color: "#526579",
    fontSize: "12px",
    fontWeight: "700",
  },

  countdownTime: {
    marginTop: "5px",
    color: "#173b63",
    fontSize: "27px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  countdownHint: {
    marginTop: "5px",
    color: "#7b8997",
    fontSize: "10px",
    lineHeight: "1.4",
  },

  resendArea: {
    marginTop: "17px",
    padding: "15px 12px",
    borderRadius: "14px",
    background: "#ecfdf3",
    border: "1px solid #b7e4ca",
    textAlign: "center",
  },

  readyIcon: {
    width: "30px",
    height: "30px",
    margin: "0 auto 7px",
    borderRadius: "50%",
    background: "#087443",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "17px",
    fontWeight: "900",
  },

  readyText: {
    color: "#087443",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.4",
  },

  resendButton: {
    display: "block",
    margin: "12px auto 0",
    padding: "11px 16px",
    border: "1px solid #245d8f",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#245d8f",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  loginLink: {
    marginTop: "20px",
    border: "none",
    background: "transparent",
    color: "#173b63",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  footer: {
    margin: "22px 0 4px",
    color: "#667485",
    fontSize: "12px",
    fontWeight: "700",
  },

  motto: {
    margin: 0,
    color: "#8995a3",
    fontSize: "10px",
  },
};

export default VerifyCode;