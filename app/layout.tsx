import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polish Appointment",
  description: "Polish Appointment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={` ${lexend.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
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
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
