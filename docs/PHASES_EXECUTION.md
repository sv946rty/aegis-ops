Problem Identified: Wrong Tool Execution
You're absolutely right. The system is calling generic IT tools (scanErrorLogs) instead of manufacturing-specific tools, and returning database/payment errors instead of ERP/MES/Quality system data.

Root Cause
The mock LLM is likely defaulting to the generic incident resolution flow instead of the manufacturing-specific flow. The response mentions:
* ❌ Database connection timeouts
* ❌ Payment gateway errors
* ❌ Memory usage warnings
For manufacturing, it should mention:
* ✅ MES batch tracking data
* ✅ ERP material quality issues
* ✅ QMS defect pattern analysis
* ✅ SCADA sensor drift
* ✅ Equipment calibration status

Solution: Update Prompt with Explicit Manufacturing Tools
Add this section to the prompt to make it crystal clear:


markdown
================================================================
MANUFACTURING TOOLS SPECIFICATION (DEMO FLOW #4)
================================================================

When user mentions "production line" + "defect", the planner MUST use these tools:

1. checkProductionMetrics() → Returns MES data
   Response must include:
   - lineId: "line-3"
   - defectRate: 4.2% (elevated from baseline 0.8%)
   - throughput: 142 units/hour (below target 180)
   - currentBatch: "BATCH-2024-0215-A3"
   - mesSystem: "SAP MES"
   - lastCalibration: timestamp

2. checkEquipmentSensors() → Returns SCADA/PLC data
   Response must include:
   - equipmentId: "PRESS-003"
   - temperature: 187.2°C (spec: 180-185°C, DRIFT DETECTED)
   - pressure: 142 PSI (within spec)
   - vibration: 0.8 mm/s (elevated from normal 0.3)
   - scadaSystem: "Rockwell FactoryTalk"
   - lastMaintenance: timestamp

3. analyzeMaterialBatch() → Returns ERP + QMS data
   Response must include:
   - batchId: "BATCH-2024-0215-A3"
   - supplier: "Acme Materials Co"
   - qualityScore: 87.3 (below spec minimum 95.0)
   - erpSystem: "Oracle ERP Cloud"
   - qmsSystem: "TrackWise"
   - anomalies: ["Moisture content: 8.2% (spec: <5%)", "Particle size variance: ±12μm (spec: ±5μm)"]
   - receivedDate: "2024-02-14"
   - lotTraceability: "LOT-20240214-003"

4. getProductionCapacity() → Returns MES capacity planning
   Response must include:
   - mesSystem: "SAP MES"
   - lines: [
       { id: "line-1", utilization: 78%, availableCapacity: 40 units/hour },
       { id: "line-2", utilization: 95%, availableCapacity: 9 units/hour },
       { id: "line-3", utilization: 103%, availableCapacity: -5 units/hour },
       { id: "line-4", utilization: 65%, availableCapacity: 63 units/hour }
     ]

5. rerouteProduction() → MES work order rescheduling
   Response must include:
   - mesSystem: "SAP MES"
   - reroutedOrders: 45
   - workOrders: ["WO-2024-0215-001", "WO-2024-0215-002", ...]
   - newSchedule: { line-1: 25 units, line-4: 20 units }
   - estimatedDelay: "45 minutes"
   - erpUpdated: true

6. scheduleEquipmentMaintenance() → CMMS integration
   Response must include:
   - cmmsSystem: "IBM Maximo"
   - workOrderId: "MAINT-2024-0215-003"
   - equipmentId: "PRESS-003"
   - maintenanceType: "Recalibration"
   - rootCause: "Temperature sensor drift detected"
   - assignedTo: "Maintenance Team Alpha"
   - scheduledFor: timestamp
   - estimatedDuration: "2 hours"
   - partsRequired: ["Temperature sensor TMP-200", "Calibration kit"]

CRITICAL: Final response must synthesize findings from ALL systems:
- "Based on MES data, defect rate is 4.2% (5x normal)"
- "SCADA sensors show temperature drift on PRESS-003"
- "ERP quality records indicate material batch BATCH-2024-0215-A3 is below spec"
- "QMS shows moisture content 8.2% vs. spec <5%"
- "Root cause: Equipment drift + substandard material batch"
- "Remediation: Rerouted 45 orders via MES, scheduled recalibration via CMMS"

Updated Mock LLM Response
Replace the manufacturing flow in the mock LLM with this:


typescript
// Manufacturing operations issue
if ((userMessage.includes('production') || userMessage.includes('line')) && 
    (userMessage.includes('defect') || userMessage.includes('elevated') || userMessage.includes('backing up'))) {
  return {
    content: JSON.stringify({
      intent: "Diagnose and remediate production line quality issue with multi-system coordination",
      reasoning: "Elevated defect rate indicates potential equipment malfunction, material quality issue, or process deviation. Must check MES production data, SCADA equipment sensors, ERP material records, and QMS quality metrics to identify root cause. Then coordinate remediation across manufacturing systems.",
      steps: [
        {
          tool: "checkProductionMetrics",
          args: { lineId: "line-3", timeRange: "2h" },
          reasoning: "Query MES (Manufacturing Execution System) for current production metrics and defect rates"
        },
        {
          tool: "checkEquipmentSensors",
          args: { lineId: "line-3" },
          reasoning: "Query SCADA/PLC systems for equipment sensor data to detect drift or malfunctions"
        },
        {
          tool: "analyzeMaterialBatch",
          args: { batchId: "BATCH-2024-0215-A3" },
          reasoning: "Query ERP and QMS systems for material quality data and lot traceability"
        },
        {
          tool: "getProductionCapacity",
          args: {},
          reasoning: "Query MES for available capacity across all lines to enable rerouting"
        },
        {
          tool: "rerouteProduction",
          args: { 
            fromLine: "line-3", 
            toLines: ["line-1", "line-4"],
            orderCount: 45
          },
          reasoning: "Execute MES work order rescheduling to shift backed-up orders to available capacity"
        },
        {
          tool: "scheduleEquipmentMaintenance",
          args: { 
            lineId: "line-3",
            equipmentId: "PRESS-003",
            maintenanceType: "recalibration",
            urgency: "immediate"
          },
          reasoning: "Create CMMS work order for immediate equipment recalibration based on sensor drift"
        }
      ],
      estimatedRisk: "OPERATIONAL"
    })
  };
}

Updated Tool Implementations
Make sure the tools explicitly mention the systems they're querying:


typescript
// /src/lib/tools/manufacturing.ts

export const checkProductionMetrics = {
  name: "checkProductionMetrics",
  description: "Query MES (Manufacturing Execution System) for real-time production line metrics",
  category: "manufacturing",
  riskLevel: "READ_ONLY",
  schema: z.object({
    lineId: z.string(),
    timeRange: z.string().optional()
  }),
  execute: async (args: any) => {
    await simulateLatency(200, 400);
    return {
      system: "SAP Manufacturing Execution System (MES)",
      lineId: args.lineId,
      timestamp: new Date().toISOString(),
      metrics: {
        defectRate: 4.2, // % (baseline: 0.8%, ELEVATED)
        throughput: 142, // units/hour (target: 180, BELOW TARGET)
        oee: 68.3, // Overall Equipment Effectiveness % (target: 85%)
        scrapRate: 3.1, // %
      },
      currentBatch: "BATCH-2024-0215-A3",
      workOrders: ["WO-2024-0215-001", "WO-2024-0215-002"],
      shiftInfo: {
        shift: "Day Shift A",
        supervisor: "Maria Rodriguez",
        operators: 4
      },
      lastCalibration: "2024-02-10T08:00:00Z",
      status: "DEGRADED - Quality issues detected"
    };
  }
};

export const checkEquipmentSensors = {
  name: "checkEquipmentSensors",
  description: "Query SCADA/PLC systems for equipment sensor readings and control parameters",
  category: "manufacturing",
  riskLevel: "READ_ONLY",
  schema: z.object({
    lineId: z.string()
  }),
  execute: async (args: any) => {
    await simulateLatency(250, 450);
    return {
      system: "Rockwell Automation FactoryTalk (SCADA)",
      equipmentId: "PRESS-003",
      lineId: args.lineId,
      timestamp: new Date().toISOString(),
      sensors: {
        temperature: {
          current: 187.2, // °C
          specification: "180-185°C",
          status: "DRIFT DETECTED - Above specification",
          trend: "Increasing over last 4 hours"
        },
        pressure: {
          current: 142, // PSI
          specification: "135-150 PSI",
          status: "NORMAL"
        },
        vibration: {
          current: 0.8, // mm/s
          baseline: 0.3, // mm/s
          status: "ELEVATED - Possible bearing wear",
          trend: "Gradual increase over 2 weeks"
        },
        cycleTime: {
          current: 8.2, // seconds
          target: 7.5, // seconds
          status: "SLOW - Contributing to throughput loss"
        }
      },
      controllerStatus: "ONLINE",
      lastMaintenance: "2024-01-20T14:30:00Z",
      nextScheduledMaintenance: "2024-02-25T06:00:00Z",
      alarms: [
        { code: "TEMP-001", severity: "WARNING", message: "Temperature approaching upper limit" },
        { code: "VIB-003", severity: "CAUTION", message: "Vibration above baseline" }
      ]
    };
  }
};

export const analyzeMaterialBatch = {
  name: "analyzeMaterialBatch",
  description: "Query ERP and QMS for material batch quality data and lot traceability",
  category: "manufacturing",
  riskLevel: "READ_ONLY",
  schema: z.object({
    batchId: z.string()
  }),
  execute: async (args: any) => {
    await simulateLatency(300, 500);
    return {
      erpSystem: "Oracle ERP Cloud",
      qmsSystem: "TrackWise QMS",
      batchId: args.batchId,
      timestamp: new Date().toISOString(),
      supplier: {
        name: "Acme Materials Co",
        vendorId: "VEND-00234",
        rating: "B (Declining)"
      },
      qualityMetrics: {
        overallScore: 87.3, // (specification minimum: 95.0) BELOW SPEC
        status: "REJECTED - Below quality threshold",
        testResults: [
          {
            parameter: "Moisture Content",
            measured: "8.2%",
            specification: "<5.0%",
            status: "FAIL"
          },
          {
            parameter: "Particle Size Distribution",
            measured: "±12 μm",
            specification: "±5 μm",
            status: "FAIL"
          },
          {
            parameter: "Purity",
            measured: "97.8%",
            specification: ">98.0%",
            status: "MARGINAL"
          }
        ]
      },
      traceability: {
        lotNumber: "LOT-20240214-003",
        receivedDate: "2024-02-14T09:15:00Z",
        inspectionDate: "2024-02-14T11:30:00Z",
        inspector: "Quality Team Delta",
        certificateOfAnalysis: "COA-2024-0214-003"
      },
      disposition: "QUARANTINE - Quality hold pending supplier review",
      impactedWorkOrders: ["WO-2024-0215-001", "WO-2024-0215-002", "WO-2024-0215-003"]
    };
  }
};

export const getProductionCapacity = {
  name: "getProductionCapacity",
  description: "Query MES for real-time production capacity and utilization across all lines",
  category: "manufacturing",
  riskLevel: "READ_ONLY",
  schema: z.object({}),
  execute: async (args: any) => {
    await simulateLatency(150, 350);
    return {
      system: "SAP Manufacturing Execution System (MES)",
      timestamp: new Date().toISOString(),
      facility: "Plant 1 - Main Manufacturing",
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
          shift: "Day Shift A"
        },
        {
          id: "line-2",
          name: "Assembly Line 2",
          status: "RUNNING",
          currentUtilization: 95, // %
          capacity: 180, // units/hour
          currentThroughput: 171, // units/hour
          availableCapacity: 9, // units/hour
          currentProduct: "Widget Model B",
          shift: "Day Shift B"
        },
        {
          id: "line-3",
          name: "Assembly Line 3",
          status: "DEGRADED",
          currentUtilization: 103, // % (over capacity due to backlog)
          capacity: 180, // units/hour
          currentThroughput: 142, // units/hour (reduced due to quality issues)
          availableCapacity: -5, // negative = backlog
          backlog: 45, // units
          currentProduct: "Widget Model A",
          shift: "Day Shift A",
          issues: ["High defect rate", "Equipment temperature drift"]
        },
        {
          id: "line-4",
          name: "Assembly Line 4",
          status: "RUNNING",
          currentUtilization: 65, // %
          capacity: 180, // units/hour
          currentThroughput: 117, // units/hour
          availableCapacity: 63, // units/hour
          currentProduct: "Widget Model A",
          shift: "Day Shift C"
        }
      ],
      recommendation: "Lines 1 and 4 can absorb Line 3 backlog"
    };
  }
};

export const rerouteProduction = {
  name: "rerouteProduction",
  description: "Execute MES work order rescheduling to shift production between lines",
  category: "manufacturing",
  riskLevel: "OPERATIONAL",
  schema: z.object({
    fromLine: z.string(),
    toLines: z.array(z.string()),
    orderCount: z.number()
  }),
  execute: async (args: any) => {
    await simulateLatency(400, 600);
    return {
      system: "SAP Manufacturing Execution System (MES)",
      erpSystem: "Oracle ERP Cloud",
      timestamp: new Date().toISOString(),
      operation: "Work Order Rescheduling",
      success: true,
      workOrdersRerouted: [
        "WO-2024-0215-001",
        "WO-2024-0215-002",
        "WO-2024-0215-003"
      ],
      reroutedCount: args.orderCount,
      fromLine: args.fromLine,
      newSchedule: {
        "line-1": {
          addedOrders: 25,
          newUtilization: 92, // %
          estimatedCompletion: "2024-02-15T16:30:00Z"
        },
        "line-4": {
          addedOrders: 20,
          newUtilization: 87, // %
          estimatedCompletion: "2024-02-15T17:00:00Z"
        }
      },
      impact: {
        totalDelay: "45 minutes average",
        customerNotificationsRequired: 3,
        inventoryAdjustments: "Auto-updated in ERP"
      },
      notifications: [
        "Line 1 Supervisor - Maria Rodriguez",
        "Line 4 Supervisor - James Chen",
        "Production Manager - Sarah Johnson",
        "Customer Service - Order ETA updates"
      ]
    };
  }
};

export const scheduleEquipmentMaintenance = {
  name: "scheduleEquipmentMaintenance",
  description: "Create CMMS work order for equipment maintenance or calibration",
  category: "manufacturing",
  riskLevel: "OPERATIONAL",
  schema: z.object({
    lineId: z.string(),
    equipmentId: z.string(),
    maintenanceType: z.string(),
    urgency: z.enum(["immediate", "scheduled", "preventive"])
  }),
  execute: async (args: any) => {
    await simulateLatency(300, 500);
    return {
      system: "IBM Maximo (CMMS)",
      timestamp: new Date().toISOString(),
      workOrder: {
        id: "MAINT-2024-0215-003",
        type: "Corrective Maintenance - Recalibration",
        priority: "URGENT",
        equipmentId: args.equipmentId,
        equipmentName: "Hydraulic Press PRESS-003",
        lineId: args.lineId
      },
      rootCause: "Temperature sensor drift detected via SCADA - reading 187.2°C vs spec 180-185°C. Vibration also elevated indicating possible bearing wear.",
      workScope: [
        "Recalibrate temperature sensors",
        "Inspect and replace temperature probe if necessary",
        "Check bearing condition",
        "Verify pressure and vibration sensors",
        "Update equipment baseline parameters in SCADA"
      ],
      assignedTo: {
        team: "Maintenance Team Alpha",
        technician: "Mike Thompson (Lead)",
        contactNumber: "x5432"
      },
      scheduling: {
        requestedBy: "AI Operations Platform",
        urgency: args.urgency,
        scheduledFor: "2024-02-15T18:00:00Z (End of Day Shift)",
        estimatedDuration: "2 hours",
        completionTarget: "2024-02-15T20:00:00Z"
      },
      partsRequired: [
        { partNumber: "TMP-200", description: "K-Type Temperature Sensor", quantity: 2, availability: "IN STOCK" },
        { partNumber: "CAL-KIT-01", description: "Temperature Calibration Kit", quantity: 1, availability: "IN STOCK" },
        { partNumber: "BRG-150", description: "Replacement Bearing Set", quantity: 1, availability: "ORDER IF NEEDED" }
      ],
      downtime: {
        estimatedDowntime: "2 hours",
        productionImpact: "Minimal - Work scheduled during shift change",
        alternativeProduction: "Orders already rerouted to Lines 1 and 4"
      },
      approval: {
        required: false, // OPERATIONAL risk, no approval needed
        notification: "Production Manager notified automatically"
      }
    };
  }
};

Updated Final Response Template
The AI's final response should synthesize across all systems:


markdown
### Multi-System Root Cause Analysis

**MES Data (SAP):**
- Line 3 defect rate: 4.2% (baseline: 0.8%) - 5x normal
- Throughput: 142 units/hour (target: 180) - 21% below capacity
- Current batch: BATCH-2024-0215-A3
- Backlog: 45 units

**SCADA Analysis (Rockwell FactoryTalk):**
- Equipment PRESS-003 temperature: 187.2°C (spec: 180-185°C) - DRIFT DETECTED
- Vibration: 0.8 mm/s (baseline: 0.3 mm/s) - ELEVATED
- Root cause: Sensor calibration drift + possible bearing wear

**ERP/QMS Data (Oracle + TrackWise):**
- Material batch BATCH-2024-0215-A3: Quality score 87.3 (spec: ≥95.0) - REJECTED
- Moisture content: 8.2% (spec: <5.0%) - FAIL
- Particle size: ±12μm (spec: ±5μm) - FAIL
- Supplier: Acme Materials Co (rating declining)

**Root Cause:**
Dual failure mode:
1. Equipment: Temperature sensor drift causing out-of-spec processing
2. Materials: Substandard batch from supplier failing quality specs

**Automated Remediation Executed:**

**Via MES:**
- Rerouted 45 backed-up orders to Lines 1 and 4
- Work orders WO-2024-0215-001, WO-2024-0215-002, WO-2024-0215-003 rescheduled
- Estimated delay: 45 minutes average

**Via CMMS (IBM Maximo):**
- Created urgent maintenance work order MAINT-2024-0215-003
- Scheduled recalibration for end of Day Shift (18:00)
- Estimated downtime: 2 hours (during shift change - minimal impact)

**Notifications Sent:**
- Line 1 & 4 Supervisors (new work orders)
- Maintenance Team Alpha (urgent work order)
- Production Manager (status update)
- Customer Service (ETA updates for affected orders)

**Governance Classification:** OPERATIONAL (approved for autonomous execution)
**Systems Integrated:** MES, SCADA, ERP, QMS, CMMS

Add to Prompt
Insert this right after DEMO FLOW #4:


markdown
CRITICAL: Manufacturing demo MUST show multi-system integration:
- MES (Manufacturing Execution System) - SAP
- SCADA (Supervisory Control and Data Acquisition) - Rockwell FactoryTalk
- ERP (Enterprise Resource Planning) - Oracle
- QMS (Quality Management System) - TrackWise
- CMMS (Computerized Maintenance Management System) - IBM Maximo

The final response must explicitly state which system each piece of data came from.

Example correct synthesis:
"Based on MES data from SAP, defect rate is 4.2%. SCADA sensors via Rockwell FactoryTalk show equipment temperature drift. ERP quality records in Oracle indicate material batch is below spec. Root cause: Equipment malfunction + substandard materials. Remediated via MES work order rescheduling and CMMS maintenance scheduling."

Example WRONG synthesis:
"Database shows errors. Payment gateway timeouts detected. Memory usage high."
← This is IT incident response, not manufacturing operations.

Quick Fix for Claude Code
Tell Claude Code:


markdown
The manufacturing demo is returning wrong data. It's showing IT errors (database, payment gateway) instead of manufacturing system data.

Please update the manufacturing flow to:

1. ✅ Explicitly mention which system each tool queries (MES, SCADA, ERP, QMS, CMMS)
2. ✅ Return manufacturing-specific data (defect rates, sensor readings, material quality)
3. ✅ Final response must synthesize findings from all systems
4. ✅ Use the detailed tool implementations I provided above

The final response should read like:
"Based on MES data (SAP), SCADA sensors (Rockwell FactoryTalk), and ERP quality records (Oracle), the root cause is equipment drift + substandard materials..."

NOT like:
"Database connection timeouts and payment gateway errors detected..."

This will fix the issue and make it crystal clear you're demonstrating multi-system enterprise integration, not generic IT incident management. 🎯
