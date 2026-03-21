import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Quintelligence",
  description: "AI-Adaptive Onboarding Engine",
};

export default function RootLayout({ children }) {
  return (
    <html className="dark" lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
