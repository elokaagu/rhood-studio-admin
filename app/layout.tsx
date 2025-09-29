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
  title: "R/HOOD Studio",
  description: "Music community platform for DJs and producers",
  icons: {
    icon: "/rhood_logo.webp",
    shortcut: "/rhood_logo.webp",
    apple: "/rhood_logo.webp",
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
