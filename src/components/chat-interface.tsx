"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GovernanceAlert } from "@/components/governance-alert";
import {
  Send,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Database,
  FileText,
  Settings,
  Zap,
  Shield,
  Clock,
  UserCheck,
  RefreshCw,
  Info,
  X,
  Factory,
} from "lucide-react";
import { RiskLevel } from "@/lib/ai/types";

interface ToolExecution {
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
  durationMs?: number;
  status: "pending" | "running" | "success" | "error";
  error?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  displayedContent?: string;
  status?: string;
  intent?: string;
  reasoning?: string;
  governanceBlocked?: boolean;
  requiresApproval?: boolean;
  governanceDecision?: {
    allowed: boolean;
    riskLevel: RiskLevel;
    reason: string;
    flags: string[];
  };
  toolExecutions?: ToolExecution[];
  isStreaming?: boolean;
}

const EXAMPLE_PROMPTS = [
  "Orders are failing. Database is slow.",
  "Check database health",
  "Scan error logs for payment-service",
  "Production line 3 showing elevated defect rate. Orders backing up.",
  "Purchase a new laptop for the team",
  "Clean up last quarter's data",
];

const getToolIcon = (tool: string) => {
  if (tool.includes("database") || tool.includes("Database")) return Database;
  if (tool.includes("log") || tool.includes("Log") || tool.includes("error"))
    return FileText;
  if (tool.includes("service") || tool.includes("Service")) return Settings;
  if (
    tool.includes("Production") ||
    tool.includes("production") ||
    tool.includes("Equipment") ||
    tool.includes("equipment") ||
    tool.includes("Material") ||
    tool.includes("material") ||
    tool.includes("Maintenance") ||
    tool.includes("maintenance") ||
    tool.includes("Capacity") ||
    tool.includes("capacity") ||
    tool.includes("reroute")
  )
    return Factory;
  return Zap;
};

function ExamplePrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <Card className="p-4 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50">
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Zap className="h-4 w-4 text-blue-600" />
        Try these examples
      </h3>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() => onSelect(prompt)}
            className="text-xs hover:bg-blue-50 hover:border-blue-300 whitespace-normal h-auto py-2 text-left"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function InfoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 max-w-3xl w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8"
        >
          <X className="h-6 w-6" />
        </Button>

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          About Aegis Ops Demo
        </h2>

        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-semibold text-lg mb-2">What This Demonstrates</h3>
            <p className="text-muted-foreground">
              This is a technical demonstration of AI-native enterprise operations,
              showcasing intelligent incident orchestration with governance-first design.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Test Cases Explained</h3>
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                <p className="font-semibold text-green-900">✅ "Orders are failing. Database is slow."</p>
                <p className="text-green-700 text-xs mt-1">
                  <strong>Expected:</strong> READ_ONLY risk level. System will diagnose the issue
                  by checking database health, scanning slow queries, and analyzing connections.
                  Real-time execution with visual progress indicators.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                <p className="font-semibold text-blue-900">✅ "Check database health"</p>
                <p className="text-blue-700 text-xs mt-1">
                  <strong>Expected:</strong> READ_ONLY risk level. Runs diagnostic tools to assess
                  database status, connections, and performance metrics.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50">
                <p className="font-semibold text-purple-900">✅ "Scan error logs for payment-service"</p>
                <p className="text-purple-700 text-xs mt-1">
                  <strong>Expected:</strong> READ_ONLY risk level. Analyzes application logs to
                  identify errors and patterns.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50">
                <p className="font-semibold text-orange-900">🏭 "Production line 3 showing elevated defect rate. Orders backing up."</p>
                <p className="text-orange-700 text-xs mt-1">
                  <strong>Expected:</strong> OPERATIONAL risk level. <strong>Platform Differentiation!</strong> Demonstrates
                  multi-system orchestration (manufacturing + quality + maintenance), diagnoses root cause
                  (sensor drift + material quality), and coordinates remediation (reroute orders + schedule calibration).
                  Contrasts with Run.so's "Slack access provisioning" - this is true enterprise operations platform thinking.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50">
                <p className="font-semibold text-yellow-900">⏸️ "Purchase a new laptop for the team"</p>
                <p className="text-yellow-700 text-xs mt-1">
                  <strong>Expected:</strong> REQUIRES APPROVAL (yellow alert). Purchasing decisions
                  require budget approval and stakeholder sign-off. Request is paused pending approval.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                <p className="font-semibold text-red-900">🚫 "Clean up last quarter's data"</p>
                <p className="text-red-700 text-xs mt-1">
                  <strong>Expected:</strong> DESTRUCTIVE risk level. Bulk data cleanup operations
                  are blocked to prevent irreversible data loss. Red alert with detailed explanation.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Key Features</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Real-time Streaming:</strong> Watch each step execute live with visual feedback</li>
              <li><strong>Governance First:</strong> Destructive operations blocked automatically</li>
              <li><strong>Human-in-the-Loop:</strong> Approval required for purchasing/hiring/budget changes</li>
              <li><strong>Complete Audit Trail:</strong> Every action logged (view /logs)</li>
              <li><strong>Clear Chat:</strong> Start fresh anytime with the clear button</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Color Coding</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded" />
                <span>Green = Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-blue-500 rounded" />
                <span>Blue = Running/Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-yellow-500 rounded" />
                <span>Yellow = Approval Required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-500 rounded" />
                <span>Red = Blocked/Destructive</span>
              </div>
            </div>
          </section>
        </div>

        <Button onClick={onClose} className="w-full mt-6">
          Got it, let's start!
        </Button>
      </Card>
    </div>
  );
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingInterval = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamingInterval.current) {
        clearInterval(streamingInterval.current);
      }
    };
  }, []);

  const streamText = (fullText: string, messageIndex: number) => {
    const words = fullText.split(" ");
    let currentIndex = 0;

    if (streamingInterval.current) {
      clearInterval(streamingInterval.current);
    }

    streamingInterval.current = setInterval(() => {
      if (currentIndex < words.length) {
        const displayedText = words.slice(0, currentIndex + 1).join(" ");
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex].displayedContent = displayedText;
          }
          return updated;
        });
        currentIndex++;
      } else {
        if (streamingInterval.current) {
          clearInterval(streamingInterval.current);
          streamingInterval.current = null;
        }
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[messageIndex]) {
            updated[messageIndex].isStreaming = false;
          }
          return updated;
        });
      }
    }, 50);
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Clear previous messages automatically
    setMessages([{ role: "user", content: userMessage }]);
    setIsLoading(true);

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      displayedContent: "",
      status: "Starting...",
      toolExecutions: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    const messageIndex = 1; // Assistant message is always at index 1 after clearing

    try {
      const response = await fetch("/api/agent-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);

            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[messageIndex];

              if (event.type === "status") {
                lastMsg.status = event.message;
              } else if (event.type === "plan") {
                lastMsg.intent = event.data.intent;
                lastMsg.reasoning = event.data.reasoning;
                lastMsg.governanceDecision = {
                  allowed: true,
                  riskLevel: event.data.estimatedRisk,
                  reason: "",
                  flags: [],
                };
                lastMsg.toolExecutions = event.data.steps.map(
                  (step: { tool: string; args: Record<string, unknown> }) => ({
                    tool: step.tool,
                    args: step.args,
                    status: "pending" as const,
                  })
                );
              } else if (event.type === "governance") {
                lastMsg.governanceDecision = event.data;
                const requiresApproval = event.data.flags?.some((f: string) =>
                  f.includes("approval")
                );
                if (requiresApproval) {
                  lastMsg.requiresApproval = true;
                }
              } else if (event.type === "blocked") {
                const requiresApproval = event.data.reason?.includes("REQUIRES APPROVAL");
                lastMsg.governanceBlocked = !requiresApproval;
                lastMsg.requiresApproval = requiresApproval;
                lastMsg.content = event.data.reason;
                lastMsg.displayedContent = event.data.reason;
                lastMsg.isStreaming = false;
              } else if (event.type === "tool-start") {
                const toolIdx = lastMsg.toolExecutions?.findIndex(
                  (t) => t.tool === event.data.tool && t.status === "pending"
                );
                if (toolIdx !== undefined && toolIdx !== -1 && lastMsg.toolExecutions) {
                  lastMsg.toolExecutions[toolIdx].status = "running";
                }
              } else if (event.type === "tool-complete") {
                const toolIdx = lastMsg.toolExecutions?.findIndex(
                  (t) => t.tool === event.data.tool && t.status === "running"
                );
                if (toolIdx !== undefined && toolIdx !== -1 && lastMsg.toolExecutions) {
                  lastMsg.toolExecutions[toolIdx] = {
                    ...event.data,
                    status: event.data.status,
                  };
                }
              } else if (event.type === "complete") {
                lastMsg.content = event.data.response;
                lastMsg.displayedContent = "";
                lastMsg.status = undefined;
                // Start word-by-word streaming
                setTimeout(() => {
                  streamText(event.data.response, messageIndex);
                }, 100);
              } else if (event.type === "error") {
                lastMsg.content = event.data.message;
                lastMsg.displayedContent = event.data.message;
                lastMsg.status = undefined;
                lastMsg.isStreaming = false;
              }

              return updated;
            });
          } catch (e) {
            console.error("Failed to parse event:", e);
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[messageIndex];
        lastMsg.content = "Failed to process request. Please try again.";
        lastMsg.displayedContent = "Failed to process request. Please try again.";
        lastMsg.isStreaming = false;
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <InfoDialog open={showInfo} onClose={() => setShowInfo(false)} />

      <div className="flex flex-col h-screen w-full max-w-full sm:max-w-[95%] lg:max-w-[85%] mx-auto p-4 sm:p-6">
        <header className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
                Aegis Ops
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                AI-Native Enterprise Operations Platform
              </p>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="flex items-center gap-2 ml-2 flex-shrink-0"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Clear Chat</span>
                <span className="sm:hidden text-xs">Clear</span>
              </Button>
            )}
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 p-0 h-auto text-xs sm:text-sm break-words"
          >
            <Info className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="break-words">What is this demo? Click here to learn more</span>
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <Card className="p-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Welcome to Aegis Ops
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  This platform demonstrates AI-driven incident orchestration with
                  enterprise governance. Try the examples below or describe an
                  operational issue.
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(prompt)}
                      className="text-xs hover:bg-blue-50 hover:border-blue-300 whitespace-normal h-auto py-2 text-left"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <Card className="max-w-full sm:max-w-3xl p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                    <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.content}</p>
                  </Card>
                </div>
              ) : (
                <>
                  <div className="flex justify-start">
                    <Card className="w-full p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-md border-l-4 border-l-blue-500">
                      {msg.requiresApproval && msg.governanceDecision && (
                        <Alert className="border-yellow-500 bg-yellow-50">
                          <UserCheck className="h-4 w-4 text-yellow-600" />
                          <AlertTitle className="text-yellow-900 font-semibold">
                            Human-in-the-Loop Approval Required
                          </AlertTitle>
                          <AlertDescription className="mt-2 space-y-2">
                            <p className="text-sm text-yellow-800">
                              {msg.displayedContent || msg.content}
                            </p>
                            {msg.governanceDecision.flags.length > 0 && (
                              <div className="mt-3 border-l-2 border-yellow-500 pl-3">
                                <p className="text-sm font-semibold text-yellow-900 mb-1">
                                  Approval Details:
                                </p>
                                <ul className="text-sm space-y-1 list-disc list-inside text-yellow-800">
                                  {msg.governanceDecision.flags.map((flag, idx) => (
                                    <li key={idx}>{flag}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="mt-3 text-sm bg-yellow-100 p-3 rounded-md border border-yellow-300">
                              <p className="font-semibold mb-1 text-yellow-900">
                                What happens next:
                              </p>
                              <p className="text-yellow-800">
                                This request has been paused and forwarded to the appropriate stakeholders for approval. You will be notified once a decision has been made. For urgent requests, please contact your manager directly.
                              </p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {msg.governanceBlocked && msg.governanceDecision && !msg.requiresApproval && (
                        <GovernanceAlert decision={msg.governanceDecision} />
                      )}

                      {!msg.governanceBlocked && !msg.requiresApproval && (
                        <>
                          {msg.status && (
                            <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              <span className="font-medium text-blue-900">
                                {msg.status}
                              </span>
                            </div>
                          )}

                          {msg.intent && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-purple-600" />
                                <span className="font-semibold text-sm text-purple-900">
                                  Intent
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{msg.intent}</p>
                            </div>
                          )}

                          {msg.governanceDecision && (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  msg.governanceDecision.riskLevel === "READ_ONLY"
                                    ? "secondary"
                                    : msg.governanceDecision.riskLevel === "OPERATIONAL"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {msg.governanceDecision.riskLevel === "READ_ONLY" && (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                {msg.governanceDecision.riskLevel === "OPERATIONAL" && (
                                  <Settings className="h-3 w-3 mr-1" />
                                )}
                                {msg.governanceDecision.riskLevel === "DESTRUCTIVE" && (
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                )}
                                {msg.governanceDecision.riskLevel}
                              </Badge>
                            </div>
                          )}

                          {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 mb-3">
                                <Settings className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold text-sm">
                                  Execution Plan
                                </span>
                              </div>
                              <div className="space-y-2">
                                {msg.toolExecutions.map((exec, j) => {
                                  const Icon = getToolIcon(exec.tool);
                                  return (
                                    <div
                                      key={j}
                                      className={`flex items-center gap-3 p-3 rounded-md transition-all ${
                                        exec.status === "success"
                                          ? "bg-green-50 border border-green-200"
                                          : exec.status === "running"
                                          ? "bg-blue-50 border border-blue-200 animate-pulse"
                                          : exec.status === "error"
                                          ? "bg-red-50 border border-red-200"
                                          : "bg-white border border-gray-200"
                                      }`}
                                    >
                                      <div className="flex-shrink-0">
                                        {exec.status === "success" && (
                                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        )}
                                        {exec.status === "running" && (
                                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                        )}
                                        {exec.status === "pending" && (
                                          <Clock className="h-5 w-5 text-gray-400" />
                                        )}
                                        {exec.status === "error" && (
                                          <AlertTriangle className="h-5 w-5 text-red-600" />
                                        )}
                                      </div>
                                      <Icon className="h-4 w-4 text-gray-600" />
                                      <div className="flex-1 min-w-0">
                                        <span className="font-mono text-xs font-medium">
                                          {exec.tool}()
                                        </span>
                                      </div>
                                      {exec.durationMs && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs font-mono"
                                        >
                                          {exec.durationMs}ms
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {(msg.displayedContent || msg.content) && (
                            <div className="prose prose-sm max-w-none">
                              <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                                <p className="whitespace-pre-wrap break-words text-xs sm:text-sm text-gray-800 leading-relaxed overflow-wrap-anywhere">
                                  {msg.displayedContent || msg.content}
                                  {msg.isStreaming && msg.displayedContent && (
                                    <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </Card>
                  </div>
                  {!msg.isStreaming && (
                    <div className="mt-4">
                      <ExamplePrompts onSelect={handleExampleClick} />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe an incident or operational issue... (Enter to send, Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none text-sm sm:text-base break-words"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
