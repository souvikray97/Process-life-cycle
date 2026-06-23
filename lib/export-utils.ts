"use client"

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
}

const META = {
  experiment: "Process Life Cycle Management",
  schemaVersion: 1,
  exportedAt: "",
}

// ── Action Logs ──────────────────────────────────────────────────────
export function exportActionLogCSV(
  logs: Array<{ time: number; message: string; type: string }>,
) {
  const header = "Time,Type,Message"
  const rows = logs.map(
    (l) => `${l.time},${l.type},"${l.message.replace(/"/g, '""')}"`,
  )
  const csv = [header, ...rows].join("\n")
  downloadFile(csv, `action-log-${timestamp()}.csv`, "text/csv")
}

export function exportActionLogJSON(
  logs: Array<{ time: number; message: string; type: string }>,
) {
  const payload = {
    ...META,
    exportedAt: new Date().toISOString(),
    type: "action-log",
    data: logs,
  }
  downloadFile(JSON.stringify(payload, null, 2), `action-log-${timestamp()}.json`, "application/json")
}

// ── System State History ─────────────────────────────────────────────
export function exportStateHistoryJSON(
  processes: Array<{
    name: string
    state: string
    history: string[]
    stateTime: Record<string, number>
  }>,
) {
  const payload = {
    ...META,
    exportedAt: new Date().toISOString(),
    type: "state-history",
    data: processes.map((p) => ({
      process: p.name,
      currentState: p.state,
      transitionHistory: p.history,
      stateTime: p.stateTime,
    })),
  }
  downloadFile(JSON.stringify(payload, null, 2), `state-history-${timestamp()}.json`, "application/json")
}

export function exportStateHistoryCSV(
  processes: Array<{
    name: string
    state: string
    history: string[]
    stateTime: Record<string, number>
  }>,
) {
  const header = "Process,CurrentState,History,ReadyTime,RunningTime,BlockedTime"
  const rows = processes.map(
    (p) =>
      `${p.name},${p.state},"${p.history.join(" -> ")}",${p.stateTime?.ready ?? 0},${p.stateTime?.running ?? 0},${p.stateTime?.blocked ?? 0}`,
  )
  const csv = [header, ...rows].join("\n")
  downloadFile(csv, `state-history-${timestamp()}.csv`, "text/csv")
}

// ── Evaluation Results ───────────────────────────────────────────────
export function exportEvaluationResultsCSV(
  results: Array<{
    scenarioId: number
    score: number
    maxScore: number
    timeSpent: number
    metrics: {
      validTransitions: number
      invalidAttempts: number
      terminatedProcesses: number
    }
    feedback: {
      strengths: string[]
      improvements: string[]
    }
  }>,
  scenarios: Array<{ id: number; title: string }>,
) {
  const header =
    "ScenarioID,Title,Score,MaxScore,TimeSpent(s),ValidTransitions,InvalidAttempts,TerminatedProcesses,Strengths,Improvements"
  const rows = results.map((r) => {
    const scenario = scenarios.find((s) => s.id === r.scenarioId)
    return `${r.scenarioId},"${scenario?.title ?? ""}",${r.score},${r.maxScore},${r.timeSpent},${r.metrics.validTransitions},${r.metrics.invalidAttempts},${r.metrics.terminatedProcesses},"${r.feedback.strengths.join("; ")}","${r.feedback.improvements.join("; ")}"`
  })
  const csv = [header, ...rows].join("\n")
  downloadFile(csv, `evaluation-results-${timestamp()}.csv`, "text/csv")
}

export function exportEvaluationResultsJSON(
  results: Array<any>,
  scenarios: Array<{ id: number; title: string }>,
) {
  const payload = {
    ...META,
    exportedAt: new Date().toISOString(),
    type: "evaluation-results",
    data: results.map((r) => ({
      ...r,
      scenarioTitle: scenarios.find((s) => s.id === r.scenarioId)?.title ?? "",
    })),
  }
  downloadFile(JSON.stringify(payload, null, 2), `evaluation-results-${timestamp()}.json`, "application/json")
}
