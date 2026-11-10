/**
 * Tournament Header — Server Component
 */
export default function TournamentHeader() {
  return (
    <header className="relative px-4 pt-10 pb-8 overflow-hidden">
      {/* Top Divider */}
      <div className="flex items-center gap-3 justify-center mb-10">
        <div
          className="h-px flex-1 max-w-20"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(245,158,11,0.4))",
          }}
        />

        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
            color: "#fbbf24",
            fontFamily: "var(--font-accent)",
            textTransform: "uppercase",
          }}
        >
          <span>🏆</span> Season 2026
        </div>

        <div
          className="h-px flex-1 max-w-20"
          style={{
            background:
              "linear-gradient(to left, transparent, rgba(245,158,11,0.4))",
          }}
        />
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        
        {/* LEFT SIDE — LOGO */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative">
            
            {/* Glow */}
            <div
              className="absolute inset-0 blur-3xl opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)",
              }}
            />

            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo1.jpg"
              alt="Tournament Logo"
              className="relative w-72 rounded-full sm:w-80 md:w-[420px] object-cover animate-float drop-shadow-2xl"
            />
          </div>
        </div>

        {/* RIGHT SIDE — TEXT CONTENT */}
        <div className="text-center lg:text-left">
          
          {/* Main title */}
          <div className="relative inline-block">
            <h1
              className="text-4xl sm:text-6xl md:text-5xl font-bold tracking-widest"
              style={{
                fontFamily: "var(--font-display)",
                background:
                  "linear-gradient(135deg, #e8f5e9 0%, #ffffff 40%, #e8f5e9 70%, #a7f3d0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.05,
              }}
            >
              Maheshwari
            </h1>

            <div
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.4em] text-gold-shimmer"
              style={{
                fontFamily: "var(--font-display)",
              }}
            >
              Premier League
            </div>
          </div>

          {/* Bat Icon */}
          <div className="text-5xl my-5 animate-float inline-block">
            🏏
          </div>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg max-w-xl mx-auto lg:mx-0"
            style={{
              color: "rgba(232,245,233,0.55)",
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              lineHeight: 1.7,
            }}
          >
            This time with more fun, more madness, more power and more
            cricket.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center lg:justify-start gap-10 mt-8">
            {[
              { value: "₹2700", label: "Entry Fee (Members)" },
              { value: "₹2500", label: "Entry Fee (Non-Members)" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center lg:items-start gap-1"
              >
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#fbbf24",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stat.value}
                </span>

                <span
                  className="text-xs uppercase tracking-widest"
                  style={{
                    color: "var(--color-text-dim)",
                    fontFamily: "var(--font-accent)",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Divider */}
      <div
        className="mt-14 h-px max-w-4xl mx-auto"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(34,197,94,0.2), rgba(245,158,11,0.2), rgba(34,197,94,0.2), transparent)",
        }}
      />
    </header>
  );
}