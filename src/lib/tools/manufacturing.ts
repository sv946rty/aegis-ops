import { z } from "zod";
import { ToolDefinition } from "./types";

/**
 * Simulates realistic tool execution latency
 */
async function simulateLatency(): Promise<void> {
  const delay = Math.random() * 1000 + 500; // 500-1500ms
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Manufacturing Operations Tools
 *
 * Demonstrates enterprise platform thinking with multi-system integration:
 * - MES (Manufacturing Execution System) - SAP
 * - SCADA (Supervisory Control and Data Acquisition) - Rockwell FactoryTalk
 * - ERP (Enterprise Resource Planning) - Oracle
 * - QMS (Quality Management System) - TrackWise
 * - CMMS (Computerized Maintenance Management System) - IBM Maximo
 *
 * Contrasts with simple IT helpdesk automation (e.g., Slack access provisioning)
 */

// Schemas
const checkProductionMetricsSchema = z.object({
  lineId: z.string().describe("Production line identifier (e.g., 'line-3')"),
  timeRange: z.string().describe("Time range for metrics (e.g., '2h', '24h')"),
});

const analyzeMaterialBatchSchema = z.object({
  batchId: z.string().describe("Material batch identifier"),
});

const checkEquipmentSensorsSchema = z.object({
  lineId: z.string().describe("Production line identifier"),
});

const rerouteProductionSchema = z.object({
  fromLine: z.string().describe("Source production line to reroute from"),
  toLines: z.array(z.string()).describe("Target production lines to reroute to"),
  orderCount: z.number().describe("Number of orders to reroute"),
});

const scheduleEquipmentMaintenanceSchema = z.object({
  lineId: z.string().describe("Production line identifier"),
  maintenanceType: z
    .enum(["calibration", "repair", "inspection", "preventive"])
    .describe("Type of maintenance to schedule"),
  urgency: z
    .enum(["immediate", "scheduled"])
    .describe("Urgency level for maintenance"),
});

export const manufacturingTools: ToolDefinition[] = [
  {
    name: "checkProductionMetrics",
    description:
      "Query MES (Manufacturing Execution System) for real-time production line metrics",
    category: "manufacturing",
    riskLevel: "READ_ONLY",
    schema: checkProductionMetricsSchema,
    execute: async (args) => {
      await simulateLatency();
      const validated = checkProductionMetricsSchema.parse(args);

      // Simulate different states based on line ID
      const isLine3 = validated.lineId === "line-3";

      return {
        success: true,
        system: "SAP Manufacturing Execution System (MES)",
        timestamp: new Date().toISOString(),
        data: {
          lineId: validated.lineId,
          lineName: isLine3 ? "Assembly Line 3" : "Assembly Line 1",
          timeRange: validated.timeRange,
          metrics: {
            defectRate: isLine3 ? 4.2 : 0.8, // % (elevated on line-3, normal elsewhere)
            throughput: isLine3 ? 142 : 178, // units/hour (below target 180 on line-3)
            targetThroughput: 180,
            oee: isLine3 ? 68.3 : 94.5, // Overall Equipment Effectiveness %
            scrapRate: isLine3 ? 3.1 : 0.6, // %
          },
          currentBatch: isLine3 ? "BATCH-2024-0215-A3" : "BATCH-2024-0214-B1",
          workOrders: isLine3
            ? ["WO-2024-0215-001", "WO-2024-0215-002", "WO-2024-0215-003"]
            : ["WO-2024-0214-101"],
          shiftInfo: {
            shift: "Day Shift A",
            supervisor: isLine3 ? "Maria Rodriguez" : "James Chen",
            operators: 4,
          },
          lastCalibration: isLine3
            ? "2024-01-20T08:00:00Z"
            : "2024-02-10T08:00:00Z",
          status: isLine3
            ? "DEGRADED - Quality issues detected"
            : "NORMAL - Operating within parameters",
          trend: isLine3 ? "worsening" : "stable",
        },
      };
    },
  },

  {
    name: "analyzeMaterialBatch",
    description:
      "Query ERP and QMS for material batch quality data and lot traceability",
    category: "manufacturing",
    riskLevel: "READ_ONLY",
    schema: analyzeMaterialBatchSchema,
    execute: async (args) => {
      await simulateLatency();
      const validated = analyzeMaterialBatchSchema.parse(args);

      // Simulate problematic batch
      const isProblematicBatch = validated.batchId === "BATCH-2024-0215-A3";

      return {
        success: true,
        erpSystem: "Oracle ERP Cloud",
        qmsSystem: "TrackWise QMS",
        timestamp: new Date().toISOString(),
        data: {
          batchId: validated.batchId,
          supplier: {
            name: isProblematicBatch
              ? "Acme Materials Co"
              : "Premium Supplies Inc",
            vendorId: isProblematicBatch ? "VEND-00234" : "VEND-00189",
            rating: isProblematicBatch ? "B (Declining)" : "A+ (Excellent)",
          },
          qualityMetrics: {
            overallScore: isProblematicBatch ? 87.3 : 96.2, // (spec minimum: 95.0)
            status: isProblematicBatch
              ? "REJECTED - Below quality threshold"
              : "APPROVED",
            testResults: isProblematicBatch
              ? [
                  {
                    parameter: "Moisture Content",
                    measured: "8.2%",
                    specification: "<5.0%",
                    status: "FAIL",
                  },
                  {
                    parameter: "Particle Size Distribution",
                    measured: "±12 μm",
                    specification: "±5 μm",
                    status: "FAIL",
                  },
                  {
                    parameter: "Purity",
                    measured: "97.8%",
                    specification: ">98.0%",
                    status: "MARGINAL",
                  },
                ]
              : [
                  {
                    parameter: "Moisture Content",
                    measured: "2.8%",
                    specification: "<5.0%",
                    status: "PASS",
                  },
                  {
                    parameter: "Particle Size Distribution",
                    measured: "±3 μm",
                    specification: "±5 μm",
                    status: "PASS",
                  },
                  {
                    parameter: "Purity",
                    measured: "99.2%",
                    specification: ">98.0%",
                    status: "PASS",
                  },
                ],
          },
          traceability: {
            lotNumber: isProblematicBatch
              ? "LOT-20240214-003"
              : "LOT-20240213-102",
            receivedDate: isProblematicBatch
              ? "2024-02-14T09:15:00Z"
              : "2024-02-13T08:30:00Z",
            inspectionDate: isProblematicBatch
              ? "2024-02-14T11:30:00Z"
              : "2024-02-13T10:00:00Z",
            inspector: "Quality Team Delta",
            certificateOfAnalysis: isProblematicBatch
              ? "COA-2024-0214-003"
              : "COA-2024-0213-102",
          },
          disposition: isProblematicBatch
            ? "QUARANTINE - Quality hold pending supplier review"
            : "RELEASED - Approved for production use",
          impactedWorkOrders: isProblematicBatch
            ? ["WO-2024-0215-001", "WO-2024-0215-002", "WO-2024-0215-003"]
            : [],
        },
      };
    },
  },

  {
    name: "checkEquipmentSensors",
    description:
      "Query SCADA/PLC systems for equipment sensor readings and control parameters",
    category: "manufacturing",
    riskLevel: "READ_ONLY",
    schema: checkEquipmentSensorsSchema,
    execute: async (args) => {
      await simulateLatency();
      const validated = checkEquipmentSensorsSchema.parse(args);

      const isLine3 = validated.lineId === "line-3";

      return {
        success: true,
        system: "Rockwell Automation FactoryTalk (SCADA)",
        timestamp: new Date().toISOString(),
        data: {
          equipmentId: isLine3 ? "PRESS-003" : "PRESS-001",
          equipmentName: isLine3
            ? "Hydraulic Press PRESS-003"
            : "Hydraulic Press PRESS-001",
          lineId: validated.lineId,
          sensors: {
            temperature: {
              current: isLine3 ? 187.2 : 182.5, // °C
              specification: "180-185°C",
              status: isLine3
                ? "DRIFT DETECTED - Above specification"
                : "NORMAL",
              trend: isLine3 ? "Increasing over last 4 hours" : "Stable",
            },
            pressure: {
              current: isLine3 ? 142 : 138, // PSI
              specification: "135-150 PSI",
              status: "NORMAL",
            },
            vibration: {
              current: isLine3 ? 0.8 : 0.3, // mm/s
              baseline: 0.3, // mm/s
              status: isLine3
                ? "ELEVATED - Possible bearing wear"
                : "NORMAL",
              trend: isLine3
                ? "Gradual increase over 2 weeks"
                : "Within baseline",
            },
            cycleTime: {
              current: isLine3 ? 8.2 : 7.5, // seconds
              target: 7.5, // seconds
              status: isLine3
                ? "SLOW - Contributing to throughput loss"
                : "ON TARGET",
            },
          },
          controllerStatus: "ONLINE",
          plcStatus: "RUNNING",
          lastMaintenance: isLine3
            ? "2024-01-20T14:30:00Z"
            : "2024-02-08T10:00:00Z",
          nextScheduledMaintenance: isLine3
            ? "2024-02-25T06:00:00Z"
            : "2024-03-08T06:00:00Z",
          alarms: isLine3
            ? [
                {
                  code: "TEMP-001",
                  severity: "WARNING",
                  message: "Temperature approaching upper limit",
                  timestamp: "2024-02-15T12:15:00Z",
                },
                {
                  code: "VIB-003",
                  severity: "CAUTION",
                  message: "Vibration above baseline",
                  timestamp: "2024-02-15T11:45:00Z",
                },
              ]
            : [],
          diagnosticFlags: isLine3
            ? [
                "Temperature drift detected",
                "Vibration elevated",
                "Calibration overdue",
              ]
            : [],
        },
      };
    },
  },

  {
    name: "getProductionCapacity",
    description:
      "Query MES for real-time production capacity and utilization across all lines",
    category: "manufacturing",
    riskLevel: "READ_ONLY",
    schema: z.object({}),
    execute: async () => {
      await simulateLatency();

      return {
        success: true,
        system: "SAP Manufacturing Execution System (MES)",
        timestamp: new Date().toISOString(),
        facility: "Plant 1 - Main Manufacturing",
        data: {
          lines: [
            {
              id: "line-1",
              name: "Assembly Line 1",
              status: "RUNNING",
              currentUtilization: 78, // %
              capacity: 180, // units/hour
              currentThroughput: 140, // units/hour
              availableCapacity: 40, // units/hour
              currentProduct: "Widget Model A",
              shift: "Day Shift A",
              supervisor: "Maria Rodriguez",
            },
            {
              id: "line-2",
              name: "Assembly Line 2",
              status: "RUNNING",
              currentUtilization: 95,
              capacity: 180,
              currentThroughput: 171,
              availableCapacity: 9,
              currentProduct: "Widget Model B",
              shift: "Day Shift B",
              supervisor: "Thomas Park",
            },
            {
              id: "line-3",
              name: "Assembly Line 3",
              status: "DEGRADED",
              currentUtilization: 103, // over capacity due to backlog
              capacity: 180,
              currentThroughput: 142, // reduced due to quality issues
              availableCapacity: -5, // negative = backlog
              backlog: 45, // units
              currentProduct: "Widget Model A",
              shift: "Day Shift A",
              supervisor: "Maria Rodriguez",
              issues: ["High defect rate", "Equipment temperature drift"],
            },
            {
              id: "line-4",
              name: "Assembly Line 4",
              status: "RUNNING",
              currentUtilization: 65,
              capacity: 180,
              currentThroughput: 117,
              availableCapacity: 63,
              currentProduct: "Widget Model A",
              shift: "Day Shift C",
              supervisor: "James Chen",
              nextScheduledDowntime: "2024-02-16T22:00:00Z",
            },
          ],
          totalAvailableCapacity: 112, // units/hour across all lines
          recommendation:
            "Lines 1 and 4 have sufficient capacity to absorb line-3 backlog (combined 103 units/hour available)",
        },
      };
    },
  },

  {
    name: "rerouteProduction",
    description:
      "Execute MES work order rescheduling to shift production between lines",
    category: "manufacturing",
    riskLevel: "OPERATIONAL",
    schema: rerouteProductionSchema,
    execute: async (args) => {
      await simulateLatency();
      const validated = rerouteProductionSchema.parse(args);

      // Distribute orders across target lines
      const ordersPerLine = Math.ceil(
        validated.orderCount / validated.toLines.length
      );
      const distribution: Record<string, number> = {};

      validated.toLines.forEach((line: string, index: number) => {
        const remaining = validated.orderCount - index * ordersPerLine;
        distribution[line] = Math.min(ordersPerLine, remaining);
      });

      return {
        success: true,
        system: "SAP Manufacturing Execution System (MES)",
        erpSystem: "Oracle ERP Cloud",
        timestamp: new Date().toISOString(),
        operation: "Work Order Rescheduling",
        data: {
          workOrdersRerouted: [
            "WO-2024-0215-001",
            "WO-2024-0215-002",
            "WO-2024-0215-003",
          ],
          reroutedCount: validated.orderCount,
          fromLine: validated.fromLine,
          toLines: validated.toLines,
          newSchedule: {
            "line-1": {
              addedOrders: distribution["line-1"] || 0,
              newUtilization: 92, // %
              estimatedCompletion: "2024-02-15T16:30:00Z",
            },
            "line-4": {
              addedOrders: distribution["line-4"] || 0,
              newUtilization: 87, // %
              estimatedCompletion: "2024-02-15T17:00:00Z",
            },
          },
          impact: {
            totalDelay: "45 minutes average",
            customerOrders: validated.orderCount,
            affectedCustomers: Math.floor(validated.orderCount * 0.7), // ~70% unique
            priorityOrders: Math.floor(validated.orderCount * 0.15), // ~15% priority
            customerNotificationsRequired: 3,
            inventoryAdjustments: "Auto-updated in ERP",
          },
          notificationsQueued: [
            "Line 1 Supervisor - Maria Rodriguez",
            "Line 4 Supervisor - James Chen",
            "Production Manager - Sarah Johnson",
            "Quality Team Lead - Dr. Lisa Wong",
            "Fulfillment Coordinator - Mike Davis",
          ],
        },
      };
    },
  },

  {
    name: "scheduleEquipmentMaintenance",
    description:
      "Create CMMS work order for equipment maintenance or calibration",
    category: "manufacturing",
    riskLevel: "OPERATIONAL",
    schema: scheduleEquipmentMaintenanceSchema,
    execute: async (args) => {
      await simulateLatency();
      const validated = scheduleEquipmentMaintenanceSchema.parse(args);

      const isImmediate = validated.urgency === "immediate";
      const scheduledTime = isImmediate
        ? new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const maintenanceTypeMap = {
        calibration: "Corrective Maintenance - Recalibration",
        repair: "Corrective Maintenance - Repair",
        inspection: "Preventive Maintenance - Inspection",
        preventive: "Preventive Maintenance",
      };

      return {
        success: true,
        system: "IBM Maximo (CMMS)",
        timestamp: new Date().toISOString(),
        data: {
          workOrder: {
            id: `MAINT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
            type: maintenanceTypeMap[validated.maintenanceType],
            priority: isImmediate ? "URGENT" : "NORMAL",
            equipmentId: validated.lineId === "line-3" ? "PRESS-003" : "PRESS-001",
            equipmentName:
              validated.lineId === "line-3"
                ? "Hydraulic Press PRESS-003"
                : "Hydraulic Press PRESS-001",
            lineId: validated.lineId,
          },
          rootCause:
            validated.maintenanceType === "calibration"
              ? "Temperature sensor drift detected via SCADA - reading 187.2°C vs spec 180-185°C. Vibration also elevated indicating possible bearing wear."
              : "Scheduled preventive maintenance",
          workScope:
            validated.maintenanceType === "calibration"
              ? [
                  "Recalibrate temperature sensors",
                  "Inspect and replace temperature probe if necessary",
                  "Check bearing condition",
                  "Verify pressure and vibration sensors",
                  "Update equipment baseline parameters in SCADA",
                ]
              : [
                  "Perform standard inspection",
                  "Check all sensors and calibration",
                  "Lubricate moving parts",
                  "Test safety systems",
                ],
          assignedTo: {
            team: isImmediate
              ? "Maintenance Team Alpha (On-Call)"
              : "Maintenance Team Bravo",
            technician: isImmediate ? "Mike Thompson (Lead)" : "Sarah Martinez",
            contactNumber: isImmediate ? "x5432" : "x5433",
          },
          scheduling: {
            requestedBy: "AI Operations Platform",
            urgency: validated.urgency,
            scheduledFor: scheduledTime.toISOString(),
            estimatedDuration:
              validated.maintenanceType === "calibration"
                ? "2 hours"
                : "4 hours",
            completionTarget: new Date(
              scheduledTime.getTime() +
                (validated.maintenanceType === "calibration" ? 2 : 4) *
                  60 *
                  60 *
                  1000
            ).toISOString(),
          },
          partsRequired:
            validated.maintenanceType === "calibration"
              ? [
                  {
                    partNumber: "TMP-200",
                    description: "K-Type Temperature Sensor",
                    quantity: 2,
                    availability: "IN STOCK",
                  },
                  {
                    partNumber: "CAL-KIT-01",
                    description: "Temperature Calibration Kit",
                    quantity: 1,
                    availability: "IN STOCK",
                  },
                  {
                    partNumber: "BRG-150",
                    description: "Replacement Bearing Set",
                    quantity: 1,
                    availability: "ORDER IF NEEDED",
                  },
                ]
              : [
                  {
                    partNumber: "CAL-KIT-01",
                    description: "Calibration Kit",
                    quantity: 1,
                    availability: "IN STOCK",
                  },
                ],
          downtime: {
            estimatedDowntime:
              validated.maintenanceType === "calibration"
                ? "2 hours"
                : "4 hours",
            productionImpact: isImmediate
              ? "Minimal - Work scheduled during shift change"
              : "Scheduled during off-hours",
            alternativeProduction:
              validated.lineId === "line-3"
                ? "Orders already rerouted to Lines 1 and 4"
                : "No rerouting needed",
            affectedCapacity: 180, // units/hour
          },
          approval: {
            required: false, // OPERATIONAL risk, no approval needed
            autoApproved: isImmediate
              ? "Production Manager (auto-approved for safety)"
              : null,
            notification: "Production Manager notified automatically",
          },
        },
      };
    },
  },
];
