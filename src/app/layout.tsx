import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProcrastiMate",
  description: "Автоматизируй свою прокрастинацию",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
