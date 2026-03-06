"use client";

import { useState, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, X, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AuditEvent {
  id: string;
  timestamp: string;
  input: string;
  governanceDecision: {
    allowed: boolean;
    riskLevel: string;
    reason: string;
    flags: string[];
  };
  plan?: unknown;
  toolExecutions?: unknown[];
  finalResponse?: string;
  metadata: {
    provider?: string;
    model?: string;
    totalDurationMs?: number;
  };
}

interface AuditViewerProps {
  initialEvents: AuditEvent[];
}

export function AuditViewer({ initialEvents }: AuditViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isClearing, setIsClearing] = useState(false);

  const riskFilter = searchParams.get("risk") || "all";
  const statusFilter = searchParams.get("status") || "all";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/logs?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/logs");
  };

  const clearAllLogs = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL audit logs? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsClearing(true);

    try {
      const response = await fetch("/api/audit/clear", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully deleted ${data.deletedCount} audit log(s)`);
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(`Failed to clear logs: ${data.error}`);
      }
    } catch (error) {
      alert(`Error clearing logs: ${(error as Error).message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const hasFilters = riskFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium whitespace-nowrap">Risk Level:</label>
          <Select value={riskFilter} onValueChange={(v) => updateFilter("risk", v)}>
            <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="READ_ONLY">Read Only</SelectItem>
              <SelectItem value="OPERATIONAL">Operational</SelectItem>
              <SelectItem value="DESTRUCTIVE">Destructive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium whitespace-nowrap">Status:</label>
          <Select value={statusFilter} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="w-28 sm:w-40 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="allowed">Allowed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs sm:text-sm">
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Clear Filters</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}

        <div className="ml-auto">
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllLogs}
            disabled={isClearing || isPending || initialEvents.length === 0}
            className="text-xs sm:text-sm"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{isClearing ? "Clearing..." : "Clear All Logs"}</span>
            <span className="sm:hidden">{isClearing ? "Clearing..." : "Clear"}</span>
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing last 100 audit events
        {hasFilters && " (filtered)"}
      </p>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 sm:w-48 text-xs sm:text-sm">Timestamp</TableHead>
              <TableHead className="text-xs sm:text-sm">Request</TableHead>
              <TableHead className="w-24 sm:w-32 text-xs sm:text-sm">Risk Level</TableHead>
              <TableHead className="w-20 sm:w-24 text-xs sm:text-sm">Status</TableHead>
              <TableHead className="w-12 sm:w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No audit events found
                  {hasFilters && " matching filters"}
                </TableCell>
              </TableRow>
            ) : (
              initialEvents.map((event) => (
                <Fragment key={event.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      setExpandedId(expandedId === event.id ? null : event.id)
                    }
                  >
                    <TableCell className="font-mono text-[10px] sm:text-xs whitespace-nowrap">
                      {format(new Date(event.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="max-w-[150px] sm:max-w-md truncate text-xs sm:text-sm">
                      {event.input}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.governanceDecision.riskLevel === "READ_ONLY"
                            ? "secondary"
                            : event.governanceDecision.riskLevel === "OPERATIONAL"
                            ? "default"
                            : "destructive"
                        }
                        className="text-[10px] sm:text-xs whitespace-nowrap"
                      >
                        {event.governanceDecision.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.governanceDecision.allowed
                            ? "outline"
                            : "destructive"
                        }
                        className="text-[10px] sm:text-xs"
                      >
                        {event.governanceDecision.allowed ? "Allowed" : "Blocked"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expandedId === event.id ? (
                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedId === event.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/30">
                        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                          <div>
                            <h4 className="font-semibold text-xs sm:text-sm mb-2">
                              Full Request:
                            </h4>
                            <p className="text-xs sm:text-sm break-words">{event.input}</p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-xs sm:text-sm mb-2">
                              Governance Decision:
                            </h4>
                            <p className="text-xs sm:text-sm break-words">
                              {event.governanceDecision.reason}
                            </p>
                            {event.governanceDecision.flags.length > 0 && (
                              <ul className="text-xs sm:text-sm mt-2 space-y-1 list-disc list-inside">
                                {event.governanceDecision.flags.map((flag, i) => (
                                  <li key={i} className="break-words">{flag}</li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {event.finalResponse && (
                            <div>
                              <h4 className="font-semibold text-xs sm:text-sm mb-2">
                                Response:
                              </h4>
                              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{event.finalResponse}</p>
                            </div>
                          )}

                          {event.metadata && (
                            <div>
                              <h4 className="font-semibold text-xs sm:text-sm mb-2">
                                Metadata:
                              </h4>
                              <div className="text-[10px] sm:text-xs space-y-1">
                                {event.metadata.provider && (
                                  <p className="break-words">Provider: {event.metadata.provider}</p>
                                )}
                                {event.metadata.model && (
                                  <p className="break-words">Model: {event.metadata.model}</p>
                                )}
                                {event.metadata.totalDurationMs && (
                                  <p>Duration: {event.metadata.totalDurationMs}ms</p>
                                )}
                              </div>
                            </div>
                          )}

                          <details className="text-xs sm:text-sm">
                            <summary className="cursor-pointer font-semibold mb-2">
                              Full Execution Trace (JSON)
                            </summary>
                            <ScrollArea className="h-64 w-full rounded-md border">
                              <pre className="p-3 sm:p-4 text-[10px] sm:text-xs overflow-x-auto break-words whitespace-pre-wrap">
                                {JSON.stringify(event, null, 2)}
                              </pre>
                            </ScrollArea>
                          </details>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
