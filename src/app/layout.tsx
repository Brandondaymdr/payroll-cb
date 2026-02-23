import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Alchemy Payroll — Crowded Barrel",
  description: "Weekly payroll calculator for Alchemy bar at Crowded Barrel Distillery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🥃</span>
                <span className="font-bold text-lg text-gray-900">Alchemy Payroll</span>
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">
                  Dashboard
                </Link>
                <Link href="/payroll/new" className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">
                  New Week
                </Link>
                <Link href="/employees" className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">
                  Employees
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
