import type { Metadata } from "next";

import { SessionProvider } from "@/lib/auth/SessionProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SmartAWARE — Tax, Accounting & Compliance Advisory",
    template: "%s | SmartAWARE",
  },
  description:
    "Professional tax, accounting and compliance advisory services for individuals and businesses in the United Kingdom, India, the UAE and Oman.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
