import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OffersProvider } from "@/contexts/OffersContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import RouteLoader from "@/components/RouteLoader";

export const metadata: Metadata = {
  title: "KDSL Clothing — Luxury Fashion Brand",
  description: "Discover KDSL Clothing — a luxury fashion brand redefining modern style with premium collections designed for the bold and the refined.",
  keywords: ["KDSL Clothing", "luxury fashion", "premium clothing", "modern streetwear", "designer brand"],
  openGraph: {
    title: "KDSL Clothing — Luxury Fashion Brand",
    description: "Discover KDSL Clothing — redefining modern luxury fashion.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OffersProvider>
            <ProductsProvider>
              <CartProvider>
                <WatchlistProvider>
                  <RouteLoader />
                  {children}
                </WatchlistProvider>
              </CartProvider>
            </ProductsProvider>
          </OffersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
