import { Footer } from "./footer";
import { Header } from "./header";

export * from "./popup-menu";

export function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative box-border min-h-screen pb-16">
      <Header />
      {children}
      <div className="absolute w-full left-0 bottom-0">
        <Footer />
      </div>
    </div>
  );
}
