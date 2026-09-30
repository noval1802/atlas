import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ATLAS Command Center",
  description: "Advanced Tactical Location & Analytics System",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
