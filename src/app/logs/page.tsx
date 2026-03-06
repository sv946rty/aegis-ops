import { AuditViewer } from "@/components/audit-viewer";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ThemeToggle } from "@/components/theme-toggle";
import { readAuditEvents } from "@/lib/audit/store";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

// Disable caching to always show latest audit logs
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ risk?: string; status?: string }>;
}) {
  const params = await searchParams;

  const filter: {
    riskLevel?: string;
    status?: "allowed" | "blocked";
    limit: number;
  } = {
    limit: 100,
  };

  if (params.risk && params.risk !== "all") {
    filter.riskLevel = params.risk;
  }

  if (params.status && params.status !== "all") {
    filter.status = params.status as "allowed" | "blocked";
  }

  const events = await readAuditEvents(filter);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Chat</span>
            <Home className="h-4 w-4 sm:hidden" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pt-14">
        <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Complete execution history with governance decisions
            </p>
          </div>

          <AuditViewer initialEvents={events} />
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
