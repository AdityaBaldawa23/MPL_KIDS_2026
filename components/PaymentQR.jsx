"use client";

/**
 * PaymentQR Component
 * Displays payment QR code with instructions
 */
export default function PaymentQR() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)",
        border: "1px solid rgba(245,158,11,0.2)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{
          background: "rgba(245,158,11,0.1)",
          borderBottom: "1px solid rgba(245,158,11,0.15)",
        }}
      >
        <span className="text-lg">💳</span>
        <span
          className="font-semibold text-sm tracking-wider"
          style={{
            color: "#fbbf24",
            fontFamily: "var(--font-accent)",
            textTransform: "uppercase",
          }}
        >
          Registration Fee Payment
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
        {/* QR Code */}
        <div className="flex-shrink-0">
          <div
            className="relative p-3 rounded-2xl"
            style={{
              background: "#ffffff",
              boxShadow: "0 0 40px rgba(245,158,11,0.2)",
            }}
          >
            {/* Actual QR Code SVG — replace src with your payment QR image */}
            <div
              className="w-72 h-72 flex items-center justify-center rounded-xl overflow-hidden"
              style={{ background: "#f8f8f8" }}
            >
              {/* Sample QR pattern using SVG */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/QR.jpeg" alt="Payment QR Code" />
            </div>

            {/* Animated ring */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                border: "2px solid rgba(245,158,11,0.4)",
                animation: "pulseGold 2s ease-in-out infinite",
              }}
            />
          </div>

          {/* UPI ID */}
          <div className="mt-2 text-center">
            <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
              UPI ID
            </p>
            <p
              className="text-sm font-mono font-semibold"
              style={{ color: "#fbbf24" }}
            >
              sangliurban.0060043010000738@icici
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Amount */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <span
              className="text-sm"
              style={{ color: "rgba(232,245,233,0.7)" }}
            >
              Registration Fee (For Members)
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: "#4ade80", fontFamily: "var(--font-accent)" }}
            >
              ₹2700
            </span>
          </div>
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <span
              className="text-sm"
              style={{ color: "rgba(232,245,233,0.7)" }}
            >
              Registration Fee (For Non-Members)
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: "#4ade80", fontFamily: "var(--font-accent)" }}
            >
              ₹2500
            </span>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2">
            {[
              { step: "1", text: "Scan QR with any UPI app", icon: "📱" },
              { step: "2", text: "Pay registration fee", icon: "💸" },
              { step: "3", text: "Save payment screenshot", icon: "📸" },
              {
                step: "4",
                text: "Upload screenshot & enter Transaction ID below",
                icon: "✅",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: "rgba(245,158,11,0.2)",
                    color: "#fbbf24",
                    fontFamily: "var(--font-accent)",
                  }}
                >
                  {item.step}
                </div>
                <span
                  className="text-xs"
                  style={{ color: "rgba(232,245,233,0.7)" }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Warning */}
          {/* <div
            className="flex items-start gap-2 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
          >
            <span className="flex-shrink-0">⚠️</span>
            <span>
              <strong>Complete payment BEFORE submitting the form.</strong> Registrations without valid payment proof will be rejected.
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
