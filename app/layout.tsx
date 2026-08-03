import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Antigravity Supermarket POS Cloud',
  description: 'Enterprise Cloud POS & Supermarket Management Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {/*
          Refresh-lock boot script — runs synchronously before React hydrates.
          On a page refresh, the AuthContext pagehide listener will have written
          'terminal_page_alive' to sessionStorage just before the page unloaded.
          We read and immediately delete that sentinel here; if it was present we
          clear all terminal session keys so AuthContext cannot restore a stale
          terminal session after refresh.  This is intentionally a raw <script>
          because it must execute before any React code runs.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=sessionStorage;var alive=s.getItem('terminal_page_alive');s.removeItem('terminal_page_alive');if(alive==='true'){s.removeItem('terminal_unlocked');s.removeItem('terminal_unlocked_user');s.removeItem('terminal_active_employee_data');}}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
