import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/contexts/AuthContext"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })

export const metadata: Metadata = {
  title: "AgroVendas - Sistema de Gestão",
  description: "Sistema completo de gestão de vendas para agronegócio",
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#14331f",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {/*
          THESIS: a ledger, not a dashboard. The sales list is the product; it reads as ruled rows with money in tabular figures, and refuses the grid of stat cards.
          OWN-WORLD: green-tinted paper ground (#f6f7f4), ink #171c15, forest green #26683f for actions only, flat deep-green rail #14331f; ochre for warning, brick red for error; Geist + Geist Mono for money; 4-6px radii, hairline rules, no decorative shadow.
          STORY: an older trader on his phone sees today's takings and what is still owed, and taps one large "Nova venda".
          FIRST VIEWPORT: top bar with menu and date; a single summary line (vendas, em aberto, caixas); ruled sale rows; sticky bottom action "Nova venda" on mobile.
          FORM: brief-pinned (operate mode, restrained color), no dice roll.
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
