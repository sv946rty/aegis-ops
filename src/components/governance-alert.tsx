"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { GovernanceDecision } from "@/lib/governance/types";

interface GovernanceAlertProps {
  decision: GovernanceDecision;
}

export function GovernanceAlert({ decision }: GovernanceAlertProps) {
  if (decision.allowed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Request Blocked
        <Badge variant="destructive">{decision.riskLevel} Risk</Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p className="font-medium">{decision.reason}</p>
        {decision.flags.length > 0 && (
          <div className="mt-3 border-l-2 border-destructive/50 pl-3">
            <p className="text-sm font-semibold mb-1">Detection Details:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {decision.flags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-3 text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
          <p className="font-semibold mb-1">Why This Matters:</p>
          <p>
            Enterprise operations platforms must prevent accidental data loss
            and security compromises. This request was blocked because it
            matches patterns associated with high-risk operations. If this
            action is truly needed, please refine your request with specific,
            limited scope, or contact your administrator for manual approval.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
