import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitMaster - Dashboard',
  description: 'Sistema de gestión de gimnasios con IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="overflow-y-scroll">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
