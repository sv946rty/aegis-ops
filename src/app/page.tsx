import { ChatInterface } from "@/components/chat-interface";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg font-semibold hidden sm:block">Aegis Ops</h1>
          <h1 className="text-base font-semibold sm:hidden">Aegis Ops</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/logs"
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Audit Logs</span>
              <span className="sm:hidden">Logs</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 pt-14">
        <ChatInterface />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
