"use client";

import { useEffect } from "react";

/**
 * Success Modal
 * Shown after successful registration
 * Strictly displays fields supported by the Player model
 */
export default function SuccessModal({ player, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease-out",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(145deg, #0d1f12, #0a1508)",
          border: "1px solid rgba(34,197,94,0.3)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,197,94,0.1)",
        }}
      >
        {/* Top green glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(34,197,94,0.5) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative p-6 sm:p-8 flex flex-col items-center text-center gap-5">
          {/* Success Icon */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "2px solid rgba(34,197,94,0.3)",
                boxShadow: "0 0 40px rgba(34,197,94,0.2)",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              🏏
            </div>
            {/* Check badge */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "#22c55e",
                boxShadow: "0 4px 12px rgba(34,197,94,0.5)",
              }}
            >
              <svg width="12" height="10" viewBox="0 0 14 11" fill="none">
                <path
                  d="M1 5.5L5 9.5L13 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              YOU&apos;RE IN!
            </h2>
            <p
              className="text-xs sm:text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Registration submitted successfully
            </p>
          </div>

          {/* Player Details Card */}
          {player && (
            <div
              className="w-full rounded-2xl p-4 text-left flex flex-col gap-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-3">
                {player.playerPhoto && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={player.playerPhoto}
                    alt={player.name}
                    className="w-14 h-14 rounded-xl object-cover"
                    style={{ border: "2px solid rgba(34,197,94,0.4)" }}
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p
                      className="font-bold text-base"
                      style={{
                        color: "var(--color-text)",
                        fontFamily: "var(--font-accent)",
                      }}
                    >
                      {player.name}
                    </p>
                    {player.playerID && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-mono font-bold">
                        #{player.playerID}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {player.role} &nbsp;·&nbsp; Standard {player.standard}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                <DetailRow
                  label="Transaction ID"
                  value={player.transactionId}
                  highlight
                />
                <DetailRow
                  label="Status"
                  value={
                    player.status === "approved"
                      ? "Approved"
                      : player.status === "rejected"
                        ? "Rejected"
                        : "Pending Review"
                  }
                  statusPending={player.status === "pending"}
                />
                <DetailRow
                  label="Playing Style"
                  value={
                    Array.isArray(player.playingStyle)
                      ? player.playingStyle.join(", ")
                      : player.playingStyle
                  }
                />
                <DetailRow
                  label="Jersey"
                  value={
                    player.tShirtName
                      ? `#${player.tShirtNumber} (${player.tShirtName})`
                      : `#${player.tShirtNumber}`
                  }
                />
                <DetailRow
                  label="T-Shirt Size"
                  value={`Size: ${player.tShirtSize || "—"}`}
                />
                <DetailRow
                  label="Practice Days"
                  value={`${player.practice ?? 23} days`}
                />
                <DetailRow
                  label="Payment Method"
                  value={player.paymentMethod || "Online"}
                />
                <DetailRow
                  label="Standard"
                  value={`Standard ${player.standard}`}
                />
              </div>
            </div>
          )}

          {/* Info */}
          <p
            className="text-xs px-4"
            style={{ color: "var(--color-text-dim)", lineHeight: 1.6 }}
          >
            Your registration is under review. We&apos;ll contact you on your registered
            mobile number once approved.
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-98"
            style={{
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff",
              fontFamily: "var(--font-accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
            }}
          >
            Register Another Player
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight, statusPending }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs"
        style={{
          color: "var(--color-text-dim)",
          fontFamily: "var(--font-accent)",
          textTransform: "uppercase",
          fontSize: "9px",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      <span
        className="text-xs font-medium truncate"
        style={{
          color: highlight
            ? "#fbbf24"
            : statusPending
              ? "#fb923c"
              : "var(--color-text)",
          fontFamily: highlight ? "monospace" : "inherit",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}
