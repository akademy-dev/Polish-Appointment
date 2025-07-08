import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Polish Lounge",
  description: "The Polish Lounge",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={` ${lexend.variable} antialiased lexend_abe6586a-module__pyLM9W__variable`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="pink"
            themes={[
              "light",
              "red",
              "rose",
              "orange",
              "green",
              "blue",
              "yellow",
              "violet",
              "pink",
            ]}
          >
            {children}
          </ThemeProvider>
          <Toaster richColors />
        </body>
      </html>
    </SessionProvider>
  );
}
