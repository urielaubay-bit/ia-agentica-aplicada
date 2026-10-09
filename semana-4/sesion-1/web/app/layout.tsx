import "./globals.css";

export const metadata = { title: "RAG NeuronBank · UI generativa" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
