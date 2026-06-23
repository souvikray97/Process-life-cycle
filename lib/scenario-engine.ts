"use client"

import { SimulationEngine } from "./simulation-engine"

export interface ScenarioConfig {
  id: number
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  timeLimit: number
  objectives: string[]
  initialProcesses: Array<{
    id: number
    arrivalTime: number
    burstTime: number
    priority?: number
  }>
  expectedOutcome: {
    minTerminated: number
    maxInvalidAttempts: number
    requiredActions: string[]
  }
  scoringCriteria: {
    timeBonus: number
    accuracyWeight: number
    completionWeight: number
    transitionWeight: number
  }
}

export interface ScenarioResult {
  scenarioId: number
  score: number
  maxScore: number
  timeSpent: number
  timeLimit: number
  completed: boolean
  metrics: {
    validTransitions: number
    invalidAttempts: number
    terminatedProcesses: number
    actionsPerformed: string[]
  }
  feedback: {
    strengths: string[]
    improvements: string[]
    detailedAnalysis: string
  }
  timestamp: Date
}

export class ScenarioEngine {
  private simulationEngine: SimulationEngine
  private currentScenario: ScenarioConfig | null = null
  private startTime: Date | null = null
  private actionLog: string[] = []
  private isRunning = false

  constructor() {
    this.simulationEngine = new SimulationEngine()
  }

  startScenario(scenario: ScenarioConfig): void {
    this.currentScenario = scenario
    this.startTime = new Date()
    this.actionLog = []
    this.isRunning = true
    this.simulationEngine.reset()
    this.initializeScenarioProcesses(scenario)
  }

  private initializeScenarioProcesses(scenario: ScenarioConfig): void {
    // Scenario 9 uses mixed initial states
    if (scenario.id === 9) {
      this.simulationEngine.loadScenario([
        { name: "P0", initialState: "ready", burstTime: 6 },
        { name: "P1", initialState: "running", burstTime: 4 },
        { name: "P2", initialState: "blocked", burstTime: 8 },
      ])
    }
    // Other scenarios start all processes in Ready (default engine behaviour handles this)
  }

  logAction(action: string): void {
    if (this.isRunning) {
      this.actionLog.push(action)
    }
  }

  getSimulationEngine(): SimulationEngine {
    return this.simulationEngine
  }

  completeScenario(): ScenarioResult | null {
    if (!this.currentScenario || !this.startTime || !this.isRunning) {
      return null
    }

    const endTime = new Date()
    const timeSpent = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000)
    const simulationState = this.simulationEngine.getState()

    const hasPerformedActions =
      this.actionLog.length > 0 &&
      this.actionLog.some(
        (action) =>
          action.includes("moved") ||
          action.includes("created") ||
          action.includes("terminated"),
      )

    const terminatedCount = simulationState.processes.filter((p) => p.state === "terminated").length

    if (!hasPerformedActions || terminatedCount === 0) {
      const result: ScenarioResult = {
        scenarioId: this.currentScenario.id,
        score: 0,
        maxScore: 100,
        timeSpent,
        timeLimit: this.currentScenario.timeLimit,
        completed: true,
        metrics: {
          validTransitions: simulationState.metrics.validTransitions,
          invalidAttempts: simulationState.metrics.invalidAttempts,
          terminatedProcesses: 0,
          actionsPerformed: this.actionLog,
        },
        feedback: {
          strengths: [],
          improvements: [
            "No meaningful actions were performed during the scenario",
            "Complete the required objectives to receive a proper score",
            "Review the scenario objectives and try again",
          ],
          detailedAnalysis:
            "No performance to analyze - scenario was marked complete without completing any objectives.",
        },
        timestamp: endTime,
      }
      this.isRunning = false
      return result
    }

    const scoreResult = this.calculateScore(this.currentScenario, simulationState, timeSpent)
    const feedback = this.generateFeedback(this.currentScenario, simulationState, scoreResult)

    const result: ScenarioResult = {
      scenarioId: this.currentScenario.id,
      score: scoreResult.totalScore,
      maxScore: 100,
      timeSpent,
      timeLimit: this.currentScenario.timeLimit,
      completed: true,
      metrics: {
        validTransitions: simulationState.metrics.validTransitions,
        invalidAttempts: simulationState.metrics.invalidAttempts,
        terminatedProcesses: terminatedCount,
        actionsPerformed: this.actionLog,
      },
      feedback,
      timestamp: endTime,
    }

    this.isRunning = false
    return result
  }

  private calculateScore(
    scenario: ScenarioConfig,
    simulationState: any,
    timeSpent: number,
  ): {
    totalScore: number
    timeScore: number
    accuracyScore: number
    completionScore: number
    transitionScore: number
  } {
    const { expectedOutcome, scoringCriteria, timeLimit } = scenario
    const { metrics } = simulationState

    // Time score (0-25 points)
    const timeRatio = Math.min(timeSpent / timeLimit, 1)
    const timeScore = timeSpent < timeLimit ? Math.max(0, 25 * (1 - timeRatio) * scoringCriteria.timeBonus) : 0

    // Accuracy score (0-25 points) - penalize invalid attempts
    const invalidRatio = metrics.invalidAttempts / Math.max(expectedOutcome.maxInvalidAttempts, 1)
    const accuracyScore = Math.max(0, 25 * (1 - Math.min(invalidRatio, 1)) * scoringCriteria.accuracyWeight)

    // Completion score (0-25 points) - must terminate processes
    const terminatedCount = simulationState.processes.filter((p: any) => p.state === "terminated").length
    const completionRatio = terminatedCount / Math.max(expectedOutcome.minTerminated, 1)
    const completionScore = Math.min(completionRatio, 1) * 25 * scoringCriteria.completionWeight

    // Transition score (0-25 points) - reward valid transitions
    const transitionScore = Math.min(metrics.validTransitions / 10, 1) * 25 * scoringCriteria.transitionWeight

    const totalScore = Math.round(timeScore + accuracyScore + completionScore + transitionScore)

    return {
      totalScore: Math.max(0, totalScore),
      timeScore: Math.round(Math.max(0, timeScore)),
      accuracyScore: Math.round(Math.max(0, accuracyScore)),
      completionScore: Math.round(Math.max(0, completionScore)),
      transitionScore: Math.round(Math.max(0, transitionScore)),
    }
  }

  private generateFeedback(
    scenario: ScenarioConfig,
    simulationState: any,
    scoreResult: any,
  ): {
    strengths: string[]
    improvements: string[]
    detailedAnalysis: string
  } {
    const strengths: string[] = []
    const improvements: string[] = []

    if (scoreResult.timeScore > 15) {
      strengths.push("Excellent time management - completed scenario efficiently")
    } else if (scoreResult.timeScore < 10) {
      improvements.push("Work on completing tasks more quickly within the time limit")
    }

    if (scoreResult.accuracyScore > 15) {
      strengths.push("High accuracy with minimal invalid transition attempts")
    } else {
      improvements.push("Focus on understanding valid state transitions to reduce errors")
    }

    if (scoreResult.completionScore > 15) {
      strengths.push("Successfully completed process life cycles")
    } else {
      improvements.push("Ensure all processes are properly terminated from Ready state")
    }

    if (scoreResult.transitionScore > 15) {
      strengths.push("Good understanding of event-driven state transitions")
    } else {
      improvements.push("Practice more state transitions to demonstrate life cycle understanding")
    }

    let detailedAnalysis = `Performance Analysis for ${scenario.title}:\n\n`
    detailedAnalysis += `Overall Score: ${scoreResult.totalScore}/100\n`
    detailedAnalysis += `- Time Management: ${scoreResult.timeScore}/25\n`
    detailedAnalysis += `- Accuracy: ${scoreResult.accuracyScore}/25\n`
    detailedAnalysis += `- Completion: ${scoreResult.completionScore}/25\n`
    detailedAnalysis += `- Transitions: ${scoreResult.transitionScore}/25\n\n`

    if (scoreResult.totalScore >= 85) {
      detailedAnalysis += "Excellent performance — this result reflects mastery of process life cycle concepts."
    } else if (scoreResult.totalScore >= 70) {
      detailedAnalysis += "Good performance, with room for improvement in specific areas."
    } else if (scoreResult.totalScore >= 55) {
      detailedAnalysis += "Fair performance. The concepts and additional scenarios may warrant another look."
    } else {
      detailedAnalysis += "Significant improvement is needed. The tutorial and guided scenarios cover the fundamentals."
    }

    return {
      strengths,
      improvements,
      detailedAnalysis,
    }
  }

  isScenarioRunning(): boolean {
    return this.isRunning
  }

  getCurrentScenario(): ScenarioConfig | null {
    return this.currentScenario
  }

  getElapsedTime(): number {
    if (!this.startTime || !this.isRunning) return 0
    return Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000)
  }
}

// Predefined scenarios focused on Process Life Cycle Management (9 scenarios)
// These are used in unguided mode (Evaluation tab) — same logic, no hints.
export const PREDEFINED_SCENARIOS: ScenarioConfig[] = [
  {
    id: 1,
    title: "Single Process – Normal Execution",
    description: "Move a single process through a valid life cycle: Ready → CPU → Terminated.",
    difficulty: "beginner",
    timeLimit: 180,
    objectives: [
      "Allocate CPU to the ready process",
      "Wait for the terminate event to appear while the process runs on CPU",
      "Terminate the process from CPU (Running) state",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 4 },
    ],
    expectedOutcome: {
      minTerminated: 1,
      maxInvalidAttempts: 1,
      requiredActions: ["move_to_cpu", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 1.0,
      accuracyWeight: 1.5,
      completionWeight: 1.0,
      transitionWeight: 0.8,
    },
  },
  {
    id: 2,
    title: "CPU Exclusivity with Two Processes",
    description: "Two processes compete for the CPU. Only one may execute at a time.",
    difficulty: "beginner",
    timeLimit: 240,
    objectives: [
      "Move the first process to CPU",
      "Observe that the second process is blocked from entering CPU",
      "Free the CPU (via I/O or preemption) before dispatching the second process",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 4 },
      { id: 1, arrivalTime: 0, burstTime: 4 },
    ],
    expectedOutcome: {
      minTerminated: 1,
      maxInvalidAttempts: 2,
      requiredActions: ["move_to_cpu", "demonstrate_exclusivity"],
    },
    scoringCriteria: {
      timeBonus: 1.0,
      accuracyWeight: 1.2,
      completionWeight: 1.0,
      transitionWeight: 1.0,
    },
  },
  {
    id: 3,
    title: "I/O Blocking and Return",
    description: "Complete the full I/O life cycle: Ready → CPU → I/O → Ready → CPU → Terminated.",
    difficulty: "intermediate",
    timeLimit: 300,
    objectives: [
      "Allocate CPU to the process",
      "Move the process to I/O when io_needed appears",
      "Complete I/O and return the process to Ready",
      "Allocate CPU again, then terminate the process from CPU",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 8 },
    ],
    expectedOutcome: {
      minTerminated: 1,
      maxInvalidAttempts: 2,
      requiredActions: ["move_to_cpu", "move_to_io", "io_completion", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 1.0,
      accuracyWeight: 1.2,
      completionWeight: 1.2,
      transitionWeight: 1.0,
    },
  },
  {
    id: 4,
    title: "Invalid Transition Exploration",
    description: "Explore which transitions are invalid and understand why they are rejected.",
    difficulty: "beginner",
    timeLimit: 240,
    objectives: [
      "Attempt to move a Ready process directly to I/O (invalid)",
      "Attempt to terminate a process from Ready state (invalid)",
      "Observe rejection messages for each invalid attempt",
      "Complete the process via the correct path: Ready → CPU → Terminated",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 6 },
    ],
    expectedOutcome: {
      minTerminated: 1,
      maxInvalidAttempts: 4,
      requiredActions: ["test_invalid_transitions", "move_to_cpu", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 0.8,
      accuracyWeight: 0.5,
      completionWeight: 1.5,
      transitionWeight: 1.0,
    },
  },
  {
    id: 5,
    title: "Multiple Processes with I/O Interleaving",
    description: "Manage three processes with independent life cycles and concurrent I/O.",
    difficulty: "intermediate",
    timeLimit: 420,
    objectives: [
      "Move one process to I/O while another uses CPU",
      "Demonstrate that I/O does not block other processes",
      "Terminate all three processes from CPU state",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 6 },
      { id: 1, arrivalTime: 0, burstTime: 4 },
      { id: 2, arrivalTime: 0, burstTime: 8 },
    ],
    expectedOutcome: {
      minTerminated: 3,
      maxInvalidAttempts: 3,
      requiredActions: ["move_to_cpu", "move_to_io", "io_completion", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 0.8,
      accuracyWeight: 1.0,
      completionWeight: 1.2,
      transitionWeight: 1.0,
    },
  },
  {
    id: 6,
    title: "Invalid Event Triggering",
    description: "Events are state-dependent: triggering I/O completion while not in I/O is invalid.",
    difficulty: "intermediate",
    timeLimit: 240,
    objectives: [
      "Observe that I/O completion only works for processes in I/O state",
      "Attempt to trigger events on processes in wrong states",
      "Complete the process via the correct event sequence, terminating from CPU",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 6 },
    ],
    expectedOutcome: {
      minTerminated: 1,
      maxInvalidAttempts: 3,
      requiredActions: ["test_invalid_events", "move_to_cpu", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 0.8,
      accuracyWeight: 0.8,
      completionWeight: 1.2,
      transitionWeight: 1.0,
    },
  },
  {
    id: 7,
    title: "Extended Ready State Waiting",
    description: "One process waits in Ready while the other executes on CPU.",
    difficulty: "beginner",
    timeLimit: 240,
    objectives: [
      "Move one process to CPU while the other remains in Ready",
      "Observe that Ready means waiting for CPU allocation",
      "Terminate both processes from CPU state",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 4 },
      { id: 1, arrivalTime: 0, burstTime: 4 },
    ],
    expectedOutcome: {
      minTerminated: 2,
      maxInvalidAttempts: 2,
      requiredActions: ["move_to_cpu", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 1.0,
      accuracyWeight: 1.2,
      completionWeight: 1.2,
      transitionWeight: 0.8,
    },
  },
  {
    id: 8,
    title: "Different Lifecycle Lengths",
    description: "Two processes with different life cycle paths: one terminates from CPU early, the other performs I/O first.",
    difficulty: "intermediate",
    timeLimit: 360,
    objectives: [
      "Terminate the first process directly from CPU (short life cycle)",
      "Move the second process through I/O before terminating from CPU",
      "Observe lifecycle variability between processes",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 3 },
      { id: 1, arrivalTime: 0, burstTime: 8 },
    ],
    expectedOutcome: {
      minTerminated: 2,
      maxInvalidAttempts: 2,
      requiredActions: ["move_to_cpu", "move_to_io", "io_completion", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 1.0,
      accuracyWeight: 1.2,
      completionWeight: 1.2,
      transitionWeight: 1.0,
    },
  },
  {
    id: 9,
    title: "Free Exploration (Mixed Actions)",
    description: "Three processes in mixed initial states. Explore valid and invalid actions freely.",
    difficulty: "advanced",
    timeLimit: 480,
    objectives: [
      "Explore all valid transitions from various starting states",
      "Handle processes already in Ready, CPU, and I/O states",
      "Terminate all processes from CPU state",
    ],
    initialProcesses: [
      { id: 0, arrivalTime: 0, burstTime: 6 },
      { id: 1, arrivalTime: 0, burstTime: 4 },
      { id: 2, arrivalTime: 0, burstTime: 8 },
    ],
    expectedOutcome: {
      minTerminated: 3,
      maxInvalidAttempts: 5,
      requiredActions: ["move_to_cpu", "move_to_io", "io_completion", "terminate_process"],
    },
    scoringCriteria: {
      timeBonus: 0.8,
      accuracyWeight: 1.0,
      completionWeight: 1.0,
      transitionWeight: 1.0,
    },
  },
]
