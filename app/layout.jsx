import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorker } from "./service-worker";

export const metadata = {
  title: "Ignition Fitness | Kettlebell Training in Rancho Cucamonga",
  description:
    "Small-group kettlebell training in Rancho Cucamonga. 15+ years of expert coaching, ten people max. Forge your strength at Ignition Fitness.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ignition Fitness",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#e02d24",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
