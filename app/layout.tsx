import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const tsBlock = localFont({
  src: "../public/TS Block Bold.ttf",
  variable: "--font-ts-block",
  display: "swap",
});

export const metadata: Metadata = {
  title: "R/HOOD Portal",
  description: "Music community platform for DJs and producers",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/rhood_logo.webp", type: "image/webp" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${tsBlock.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
