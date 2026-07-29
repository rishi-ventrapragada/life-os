import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Life OS",
  description: "Personal life tracking",
};

/**
 * Runs synchronously in <head>, before the browser paints anything, so a saved
 * mono theme is already on <html> for the first frame — no flash of amethyst
 * that then swaps.
 *
 * This is a STRING, not a module: it executes before any bundle loads, so it
 * cannot import from lib/theme.ts. The key name and the "mono" value are
 * therefore duplicated from THEME_STORAGE_KEY / Theme by necessity — change one,
 * change the other.
 *
 * Only "mono" is acted on. A missing, "amethyst", or corrupted value all fall
 * through to the default cascade, so bad storage can never produce a
 * half-themed page. localStorage ACCESS itself throws when storage is disabled
 * (Safari private mode), hence the try/catch — without it the whole document
 * would fail to render.
 */
const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("theme")==="mono"){document.documentElement.setAttribute("data-theme","mono")}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The boot script sets data-theme on this element before React hydrates,
      // so the server-rendered <html> and the client's differ by that attribute
      // alone. Scoped to <html>'s own attributes — it does not suppress
      // mismatch warnings anywhere in the subtree.
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
