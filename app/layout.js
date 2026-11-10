import { Toaster } from 'react-hot-toast';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: 'Cricket Tournament Registration | Join The League',
  description: 'Register for the premier cricket tournament. Show your skills on the pitch!',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏏</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0d1a0f',
              color: '#e8f5e9',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0d1a0f' },
              style: {
                borderColor: 'rgba(34, 197, 94, 0.4)',
              },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0d1a0f' },
              style: {
                borderColor: 'rgba(239, 68, 68, 0.4)',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
