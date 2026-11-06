import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "A mente · Il tuo taccuino",
  description: "Ogni pensiero, un po’ più a fuoco.",
  appleWebApp: { capable: true, title: "A mente", statusBarStyle: "default" },
  icons: { icon: basePath + "/icon-192.png", apple: basePath + "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="it"><body>{children}</body></html>;
}
