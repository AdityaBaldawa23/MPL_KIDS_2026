"use client";

/**
 * PlayingStyle Component
 * Multi-select checkboxes with max 2 selection limit
 */
const STYLES = [
  { value: "Right Arm Batting", icon: "🏏", desc: "Pure stroke maker" },
  { value: "Right Arm Balling", icon: "⚡", desc: "Attack the stumps" },
  { value: "Left Arm Batting", icon: "🏏", desc: "Graceful Playmaker" },
  { value: "Left Arm Balling", icon: "⚡", desc: "Pure Carnage with ball" },
];

export default function PlayingStyleSelector({ selected, onChange, error }) {
  const handleToggle = (value) => {
    const isBatting =
      value === "Right Arm Batting" || value === "Left Arm Batting";

    const isBowling =
      value === "Right Arm Balling" || value === "Left Arm Balling";

    // Remove if already selected
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
      return;
    }

    let updated = [...selected];

    // If selecting batting style
    if (isBatting) {
      updated = updated.filter(
        (s) => s !== "Right Arm Batting" && s !== "Left Arm Batting",
      );
    }

    // If selecting bowling style
    if (isBowling) {
      updated = updated.filter(
        (s) => s !== "Right Arm Balling" && s !== "Left Arm Balling",
      );
    }

    updated.push(value);

    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label
          className="flex items-center gap-2"
          style={{
            color: "rgba(232,245,233,0.7)",
            fontFamily: "var(--font-accent)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontSize: "11px",
          }}
        >
          <span>🏅</span> Playing Style{" "}
          <span style={{ color: "#f59e0b" }}>*</span>
        </label>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background:
              selected.length === 2
                ? "rgba(245,158,11,0.2)"
                : "rgba(255,255,255,0.06)",
            color: selected.length === 2 ? "#fbbf24" : "rgba(232,245,233,0.4)",
            fontFamily: "var(--font-accent)",
          }}
        >
          {selected.length}/2 selected
        </span>
      </div>

      {/* Warning */}
      {selected.length === 2 && (
        <p
          className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
            color: "#fbbf24",
          }}
        >
          <span>⚠️</span> Maximum 2 playing styles selected
        </p>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {STYLES.map((style) => {
          const isSelected = selected.includes(style.value);
          const isDisabled = !isSelected && selected.length >= 2;

          return (
            <button
              key={style.value}
              type="button"
              onClick={() => !isDisabled && handleToggle(style.value)}
              className="relative flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
              style={{
                background: isSelected
                  ? "rgba(34,197,94,0.1)"
                  : isDisabled
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(255,255,255,0.04)",
                border: isSelected
                  ? "1px solid rgba(34,197,94,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                transform: isSelected ? "scale(1.01)" : "scale(1)",
              }}
            >
              {/* Icon */}
              <span className="text-xl flex-shrink-0">{style.icon}</span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{
                    color: isSelected
                      ? "var(--color-green)"
                      : "var(--color-text)",
                    fontFamily: "var(--font-accent)",
                  }}
                >
                  {style.value}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  {style.desc}
                </p>
              </div>

              {/* Checkbox */}
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: isSelected ? "var(--color-green)" : "transparent",
                  border: `2px solid ${isSelected ? "var(--color-green)" : "rgba(255,255,255,0.2)"}`,
                }}
              >
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p
          className="text-xs flex items-center gap-1 animate-fade-in"
          style={{ color: "#f87171" }}
        >
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
