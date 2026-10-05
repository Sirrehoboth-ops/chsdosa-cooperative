import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

const slides = [
  {
    title: "GET UP TO",
    amount: "₦5,000,000",
    text: "Access a CHSDOSA loan based on your eligible savings.",
    icon: "💰",
  },
  {
    title: "YOUR SAVINGS",
    amount: "× 2",
    text: "Your maximum eligible loan will be calculated from your savings.",
    icon: "📈",
  },
  {
    title: "FLEXIBLE REPAYMENT",
    amount: "8–10 MONTHS",
    text: "Choose a repayment period that works best for you.",
    icon: "📅",
  },
  {
    title: "BORROW WITH CONFIDENCE",
    amount: "2 GUARANTORS",
    text: "Complete your agreement and receive approval from your guarantors before administrator review.",
    icon: "🤝",
  },
];

export default function Loan() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chsdosa-dark-mode");
    setDarkMode(saved === "true");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkMode
          ? "linear-gradient(180deg, #071a12 0%, #03100b 100%)"
          : "linear-gradient(180deg, #f4fff8 0%, #ffffff 100%)",
        color: darkMode ? "#ffffff" : "#102018",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "none",
            background: darkMode ? "#123326" : "#e8f5ed",
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
              fontSize: 13,
              opacity: 0.65,
              fontWeight: 600,
            }}
          >
            CHSDOSA COOPERATIVE
          </div>

          <h2
            style={{
              margin: "2px 0 0",
              fontSize: 24,
            }}
          >
            Loans
          </h2>
        </div>
      </div>

      {/* Animated slide */}
      <div
        key={currentSlide}
        style={{
          animation: "loanSlideIn 650ms ease",
        }}
      >
        <div
          style={{
            minHeight: 500,
            borderRadius: 30,
            padding: "34px 24px",
            background: darkMode
              ? "linear-gradient(145deg, #0c3b27, #092719)"
              : "linear-gradient(145deg, #0c8f55, #075f39)",
            color: "#fff",
            boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              top: -80,
              right: -70,
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              bottom: -60,
              left: -60,
            }}
          />

          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              position: "relative",
              zIndex: 2,
            }}
          >
            <img
              src={LOGO}
              alt="CHSDOSA"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                objectFit: "cover",
                background: "#fff",
              }}
            />

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: 0.85,
                }}
              >
                CHSDOSA
              </div>

              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                Cooperative
              </div>
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              textAlign: "center",
              padding: "35px 0",
            }}
          >
            <div
              style={{
                fontSize: 58,
                marginBottom: 18,
                animation: "loanFloat 2.5s ease-in-out infinite",
              }}
            >
              {slide.icon}
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2,
                opacity: 0.85,
              }}
            >
              {slide.title}
            </div>

            <div
              style={{
                fontSize: 42,
                lineHeight: 1.1,
                fontWeight: 900,
                marginTop: 10,
              }}
            >
              {slide.amount}
            </div>

            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                opacity: 0.9,
                maxWidth: 310,
                margin: "18px auto 0",
              }}
            >
              {slide.text}
            </p>
          </div>

          {/* Apply */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
            }}
          >
            <button
              onClick={() => navigate("/loan/apply")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 18,
                padding: "17px 20px",
                background: "#ffffff",
                color: "#087544",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            >
              Apply for Loan →
            </button>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 7,
          marginTop: 20,
        }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              width: index === currentSlide ? 26 : 8,
              height: 8,
              borderRadius: 20,
              border: "none",
              padding: 0,
              background:
                index === currentSlide
                  ? "#0b8a50"
                  : darkMode
                  ? "#365347"
                  : "#c9ddd2",
              transition: "all 300ms ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* Information */}
      <div
        style={{
          marginTop: 24,
          padding: 18,
          borderRadius: 20,
          background: darkMode ? "#0d2119" : "#f0f8f3",
          fontSize: 13,
          lineHeight: 1.6,
          opacity: 0.9,
        }}
      >
        <strong>Important:</strong> Your actual loan eligibility depends on
        your eligible savings and CHSDOSA loan requirements. The maximum
        advertised amount is ₦5,000,000.
      </div>

      <style>{`
        @keyframes loanSlideIn {
          from {
            opacity: 0;
            transform: translateX(55px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes loanFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}