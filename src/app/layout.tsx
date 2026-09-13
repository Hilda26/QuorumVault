import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Quorum Vault | Nothing installs without a second opinion",
  description: "A panel of independent validators reads every proposed code change before it can install, with a fixed window for anyone to object first.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={fontVariables}><body><WalletProvider>{children}</WalletProvider></body></html>;
}
