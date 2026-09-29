import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { LanguageProvider } from '@/lib/i18n/language-context'
import './globals.css'

export const metadata: Metadata = {
  title:
    'PranRaksha | AI-Powered Emergency Response Intelligence Platform for Disaster Management and Relief Operations',

  description:
    'AI-Powered Emergency Response Intelligence Platform for Disaster Management and Relief Operations',

  generator: 'PranRaksha Intelligence Grid',

  icons: {
    icon: '/pwa-512x512.png',
    apple: '/pwa-512x512.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b1220',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme') || 'system';
                  var isDark =
                    t === 'dark' ||
                    (t === 'system' &&
                      window.matchMedia('(prefers-color-scheme: dark)').matches);

                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}