/**
 * Registration Page — Server Component
 * Layout and static content rendered on server
 * Only the form is a client component
 */
import TournamentHeader from "../components/TournamentHeader";
import RegistrationForm from '../components/RegistrationForm';

export const metadata = {
  title: 'Player Registration | Maheshwari Premier League 2026',
  description: 'Register for the ultimate cricket tournament. Fill in your details and join the league of champions.',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        
        {/* Radial glow center */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.3) 0%, transparent 70%)' }}
        />
        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-10"
          style={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.4) 0%, transparent 70%)' }}
        />
        {/* Corner accents */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
        <div className="absolute top-40 right-10 w-32 h-32 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
      </div>

      {/* Page content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        {/* Tournament Header */}
        <TournamentHeader />

        {/* Registration Form */}
        <RegistrationForm />

        {/* Footer */}
        <footer className="mt-10 text-center">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-16" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-dim)' }}>🏏</span>
            <div className="h-px w-16" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            Maheshwari Premier League 2026· All rights reserved
          </p>
        </footer>
      </div>
    </main>
  );
}
