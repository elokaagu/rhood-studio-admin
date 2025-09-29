import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const tsBlock = localFont({
  src: "../public/TS Block Bold.ttf",
  variable: "--font-ts-block",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rhood Studio",
  description: "Music community platform for DJs and producers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${tsBlock.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
