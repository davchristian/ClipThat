import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { AppProvider } from "@/components/provider";
import { Shell } from "@/components/shell";
export const metadata: Metadata = { title: "ClipThat — Ruang belajarmu", description: "Ikuti kelas. Simpan momen penting. Pahami dengan ritmemu." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body><AppProvider><Shell>{children}</Shell></AppProvider></body></html>; }
