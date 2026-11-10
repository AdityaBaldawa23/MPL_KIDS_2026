'use client';

/**
 * Reusable Input Component
 * Styled for cricket tournament theme
 */
export default function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon,
  hint,
  maxLength,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'rgba(232,245,233,0.7)', fontFamily: 'var(--font-accent)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px' }}>
        {icon && <span className="text-base">{icon}</span>}
        {label}
        {required && <span style={{ color: '#f59e0b' }}>*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className="input-field w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.5)';
            e.target.style.boxShadow = error
              ? '0 0 0 3px rgba(239,68,68,0.1)'
              : '0 0 0 3px rgba(34,197,94,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{hint}</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs flex items-center gap-1 animate-fade-in" style={{ color: '#f87171' }}>
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
