'use client';

/**
 * Role Selector Component
 * Single-select radio-style buttons for player role
 */
const ROLES = [
  {
    value: 'Batsman',
    icon: '🏏',
    desc: 'Master of the bat',
    color: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.4)',
    textColor: '#fbbf24',
  },
  {
    value: 'Bowler',
    icon: '⚡',
    desc: 'Strike weapon',
    color: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.4)',
    textColor: '#f87171',
  },
  {
    value: 'All Rounder',
    icon: '⭐',
    desc: 'Complete package',
    color: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.4)',
    textColor: '#4ade80',
  },
];

export default function RoleSelector({ selected, onChange, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label className="flex items-center gap-2" style={{ color: 'rgba(232,245,233,0.7)', fontFamily: 'var(--font-accent)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px' }}>
        <span>🎖️</span> Player Role <span style={{ color: '#f59e0b' }}>*</span>
      </label>

      {/* Role Options */}
      <div className="grid grid-cols-3 gap-2.5">
        {ROLES.map((role) => {
          const isSelected = selected === role.value;

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200"
              style={{
                background: isSelected ? role.color : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? role.borderColor : 'rgba(255,255,255,0.08)'}`,
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isSelected ? `0 8px 24px ${role.color}` : 'none',
              }}
            >
              <span className="text-2xl">{role.icon}</span>
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: isSelected ? role.textColor : 'var(--color-text)', fontFamily: 'var(--font-accent)', letterSpacing: '0.03em' }}>
                  {role.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)', fontSize: '10px' }}>
                  {role.desc}
                </p>
              </div>
              {/* Selection indicator */}
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: role.textColor }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs flex items-center gap-1 animate-fade-in" style={{ color: '#f87171' }}>
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
