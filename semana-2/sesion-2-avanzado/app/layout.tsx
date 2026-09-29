import "./globals.css";
import { AI } from "./ai";

export const metadata = { title: "NeuronBank · RSC generativo (avanzado)" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AI>{children}</AI>
      </body>
    </html>
  );
}
