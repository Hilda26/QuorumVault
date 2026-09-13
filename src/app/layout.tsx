import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Quorum Vault | Consensus Amendment Control",
  description: "A GenLayer control plane for auditable, consensus-reviewed intelligent-contract amendments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={fontVariables}><body><WalletProvider>{children}</WalletProvider></body></html>;
}
