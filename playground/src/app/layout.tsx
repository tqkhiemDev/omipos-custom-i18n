import type { Metadata } from "next";
import type { ReactNode } from "react";

import { I18nProvider } from "../i18n-client";
import { getServerLocale } from "../server-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "@khiemtq/i18n playground",
  description: "Next.js development playground for @khiemtq/i18n",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
