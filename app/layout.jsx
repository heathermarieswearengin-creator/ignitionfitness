import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Ignition Fitness | Kettlebell Training in Rancho Cucamonga",
  description:
    "Small-group kettlebell training in Rancho Cucamonga. 15+ years of expert coaching, ten people max. Forge your strength at Ignition Fitness.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
