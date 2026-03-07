import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Cool Golf Method - Reinventez votre entrainement de golf",
  description:
    "Bien plus qu'une app. Une nouvelle forme de jeu independante du parcours. 7 modules, gamification, competition live.",
  keywords: ["golf", "practice", "entrainement", "gamification", "competition", "modules", "cool golf method"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className={`${inter.className} noise`}>{children}</body>
    </html>
  );
}
