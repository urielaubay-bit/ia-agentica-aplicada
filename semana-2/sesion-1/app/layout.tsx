export const metadata = { title: "Mi agente web" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#fff", color: "#111" }}>
        {children}
      </body>
    </html>
  );
}
