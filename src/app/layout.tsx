import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ParticleBackground from "@/components/ParticleBackground";
import { DialogProvider } from "@/contexts/DialogContext";

export const metadata: Metadata = {
  title: "Tak Serwis — Panel zarządzania serwisem",
  description: "Profesjonalny system CRM do zarządzania klientami, zleceniami, mechanikami i magazynem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <ParticleBackground />
        <DialogProvider>
          <AppShell>{children}</AppShell>
        </DialogProvider>
      </body>
    </html>
  );
}
