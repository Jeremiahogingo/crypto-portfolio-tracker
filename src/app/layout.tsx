import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import Providers from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Runs before React hydration to apply the persisted theme.
 *
 * This must use the same storage key, supported values, default theme,
 * HTML class and data attribute as ThemeContext.
 *
 * It deliberately does not:
 * - Render conditionally based on typeof window.
 * - Modify localStorage.
 * - Manage React state.
 * - Register event listeners.
 *
 * ThemeContext remains the single source of truth for theme state.
 */
const themeBootstrap = `
(function () {
  var root = document.documentElement;
  var theme = "dark";

  try {
    var savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      theme = savedTheme;
    }
  } catch (error) {
    // Keep the application usable when browser storage is unavailable.
  }

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;

  var themeColor = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeColor) {
    themeColor.content =
      theme === "dark" ? "#0B1220" : "#F4F7FC";
  }
})();
`;

export const metadata: Metadata = {
  title: {
    default: "CryptoTracker",
    template: "%s | CryptoTracker",
  },
  description:
    "Track cryptocurrency holdings, monitor market movements and understand your portfolio performance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <meta
          name="theme-color"
          content="#0B1220"
        />
      </head>

      <body className={`${inter.variable} ${inter.className}`}>
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: themeBootstrap,
          }}
        />

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
