import "./globals.css";

export const metadata = {
  title: "Quintelligence",
  description: "AI-Adaptive Onboarding Engine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
