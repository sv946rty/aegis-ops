import { NextResponse } from "next/server";
import { clearAllAuditEvents } from "@/lib/audit/store";

export async function POST() {
  try {
    const result = await clearAllAuditEvents();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} audit log(s)`,
        deletedCount: result.deletedCount,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to clear audit logs",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
