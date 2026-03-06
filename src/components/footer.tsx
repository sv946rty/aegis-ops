"use client";

import { Github } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 py-4 px-4 sm:px-6">
        <p className="text-center text-xs sm:text-sm leading-relaxed text-muted-foreground">
          © {currentYear} Aegis Ops. All rights reserved.
        </p>
        <Link
          href="https://github.com/sv946rty/aegis-ops"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>GitHub</span>
        </Link>
      </div>
    </footer>
  );
}
