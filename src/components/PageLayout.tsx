import { Navbar } from "./Navbar";
import { BottomTabBar } from "./BottomTabBar";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-14 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomTabBar />
    </>
  );
}
