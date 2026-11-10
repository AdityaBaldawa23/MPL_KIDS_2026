"use client";

/**
 * SelectField Component
 * Custom styled HTML select dropdown consistent with dark tournament theme.
 */
export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error,
  icon,
  hint,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label
        htmlFor={name}
        className="flex items-center gap-2 text-sm font-medium"
        style={{
          color: "rgba(232,245,233,0.7)",
          fontFamily: "var(--font-accent)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontSize: "11px",
        }}
      >
        {icon && <span className="text-base">{icon}</span>}
        {label}
        {required && <span style={{ color: "#f59e0b" }}>*</span>}
      </label>

      {/* Select input */}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 appearance-none cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${
              error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"
            }`,
            color: value ? "var(--color-text)" : "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error
              ? "rgba(239,68,68,0.7)"
              : "rgba(34,197,94,0.5)";
            e.target.style.boxShadow = error
              ? "0 0 0 3px rgba(239,68,68,0.1)"
              : "0 0 0 3px rgba(34,197,94,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error
              ? "rgba(239,68,68,0.5)"
              : "rgba(255,255,255,0.1)";
            e.target.style.boxShadow = "none";
          }}
          {...props}
        >
          <option value="" disabled style={{ background: "#061221", color: "#64748B" }}>
            {placeholder}
          </option>
          {options.map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const text = typeof opt === "object" ? opt.label : opt;
            return (
              <option
                key={val}
                value={val}
                style={{ background: "#061221", color: "#ffffff" }}
              >
                {text}
              </option>
            );
          })}
        </select>

        {/* Custom Arrow Indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400">
          ▼
        </div>
      </div>

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
          {hint}
        </p>
      )}

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
