import { Navbar } from "./Navbar";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </>
  );
}
