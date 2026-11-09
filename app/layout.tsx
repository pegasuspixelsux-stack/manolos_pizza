import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProvider } from "@/src/context/ClientContext";
import { CartProvider } from "@/src/context/CartContext";
import { BusinessProvider } from "@/src/context/BusinessContext";
import { HeroImagesProvider } from "@/src/context/HeroImagesContext";
import { getBusinessSettings } from "@/src/services/businessService";
import { listHeroImages } from "@/src/lib/heroImages";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Manolo's Pizza";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getBusinessSettings();
  return {
    title: businessName || DEFAULT_TITLE,
    description:
      "Frutas y verduras frescas directo del productor, para minoristas y mayoristas.",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [business, heroImages] = await Promise.all([getBusinessSettings(), listHeroImages()]);
  return (
    <html
      lang="es-UY"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BusinessProvider initial={business}>
          <HeroImagesProvider images={heroImages}>
            <ClientProvider>
              <CartProvider>{children}</CartProvider>
            </ClientProvider>
          </HeroImagesProvider>
        </BusinessProvider>
      </body>
    </html>
  );
}
