import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "@/styles/globals.css";
import { AppProvider } from "@/state/app-provider";
import { Shell } from "@/components/layout/app-shell";
export const metadata: Metadata = {
  title: "ClipThat — Ruang belajarmu",
  description: "Ikuti kelas. Simpan momen penting. Pahami dengan ritmemu.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
