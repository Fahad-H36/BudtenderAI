import type React from "react"
import "@/app/globals.css"
import { DM_Sans, Lato } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from '@clerk/nextjs'

// Headline font
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

// Body font
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  variable: "--font-lato",
})

export const metadata = {
  title: "BudtenderAI",
  description: "Your personal AI budtender for cannabis guidance and recommendations",
  keywords: "cannabis, ai, budtender, recommendations, weed, marijuana",
  favicon: '/budtender_logo.svg'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <link rel="icon" href="/budtender_logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />

        <body className={`${dmSans.variable} ${lato.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

import './globals.css'
