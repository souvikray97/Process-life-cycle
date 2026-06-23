"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  Users,
  Target,
  Play,
  RotateCcw,
  Info,
  BookOpen,
  ArrowRight,
  Lightbulb,
  ArrowLeft,
  PartyPopper,
  HelpCircle,
} from "lucide-react"
import { ProcessSchedulingSimulation, type SimulationHandle } from "./process-scheduling-simulation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useKeyboardShortcuts, type ShortcutDef, type ShortcutAction } from "@/hooks/use-keyboard-shortcuts"

export const SCENARIO_SHORTCUT_DEFS: ShortcutDef[] = [
  { key: "Enter", label: "Complete Step", description: "Check and complete the current scenario step", category: "Scenarios" },
  { key: "h", label: "Toggle Hint", description: "Show or hide the step hint", category: "Scenarios" },
  { key: "b", label: "Go Back", description: "Return to the scenario list", category: "Scenarios" },
  { key: "r", shift: true, label: "Reset Scenario", description: "Reset and restart the current scenario", category: "Scenarios" },
]

interface GuidedScenario {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: number
  objectives: string[]
  steps: GuidedStep[]
  initialProcesses: Array<{
    id: string
    arrivalTime: number
    burstTime: number
    priority?: number
  }>
}

interface StepQuiz {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface GuidedStep {
  id: string
  title: string
  description: string
  stepObjectives?: string[]
  instruction: string
  instructionBullets?: string[]
  hint?: string
  quiz?: StepQuiz
  cpuIdleBlocked?: boolean
  expectedAction: string
  validation: (state: any) => boolean
  feedback: {
    success: string
    error: string
  }
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

const GUIDED_SCENARIOS: GuidedScenario[] = [
  // ── Scenario 0: Tutorial ─────────────────────────────────────────────────────
  {
    id: "s0-tutorial",
    title: "Scenario 0: Tutorial – Introduction to Process Life Cycle",
    description: "A step-by-step guided introduction to all process states and transitions. Start here.",
    difficulty: "beginner",
    estimatedTime: 10,
    objectives: [
      "This experiment covers the process states Ready, CPU, I/O Wait, and Terminated, plus the New process admission step, and the transitions between them.",
      "A process is created using a create_request event.",
      "A process moves through Ready → CPU → Ready → CPU → I/O → Ready → CPU → Terminated.",
      "A process can be terminated only from the CPU (Running) state.",
    ],
    steps: [
      {
        id: "s0-intro",
        title: "Welcome: Process States",
        description: "Read the state descriptions before you begin",
        stepObjectives: [
          "The process life cycle spans Ready, CPU (Running), I/O Wait, and Terminated, preceded by New process admission.",
          "The simulator interface presents events, process states, and controls in distinct regions.",
          "Each state has a distinct colour used consistently across the simulator.",
        ],
        instruction:
          "The simulation panel shows the process life cycle. A new process becomes Ready when admitted, moves to CPU when scheduled, may block in I/O Wait, and is terminated only from the CPU state. The ‘Check & Complete Step’ button continues to the next step.",
        hint: "No action required — just read the state descriptions in the simulation panel, then click the button below.",
        quiz: {
          question: "After a create_request event is handled, a new process enters which state?",
          options: ["CPU (Running)", "Ready", "I/O Wait", "Terminated"],
          correctIndex: 1,
          explanation: "A newly admitted process always enters the Ready state first, where it waits to be allocated the CPU.",
        },
        expectedAction: "read_intro",
        validation: () => true,
        feedback: {
          success: "The five process states are now covered. The next step creates a process.",
          error: "Click ‘Check & Complete Step’ to continue.",
        },
      },
      {
        id: "s0-create",
        title: "Step 1: Create a Process (New → Ready)",
        description: "Admit a process into the system",
        stepObjectives: [
          "Processes are created by responding to a create_request event.",
          "A new process enters the Ready state after creation.",
          "Event selection precedes any state transition.",
        ],
        instruction: "Advance the clock and use the create_request event to admit a process into the system.",
        instructionBullets: [
          "Click **Advance Clock** 2–3 times until a purple **create_request** event appears in Event Requests.",
          "Click the **create_request** event to select it — it will highlight with a blue ring.",
          "Click **Create Process** in the Controls panel. The process enters the Ready state.",
        ],
        hint: "Look for the purple create_request event in the Event Requests panel. Select it first, then use the action button.",
        quiz: {
          question: "What event triggers a new process to enter the Ready state?",
          options: ["io_done", "io_needed", "create_request", "terminate"],
          correctIndex: 2,
          explanation: "The create_request event signals that a new process should be admitted to the system, placing it in the Ready queue.",
        },
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "The process is now in the Ready state — it is waiting to be assigned to the CPU.",
          error: "Select a create_request event from Event Requests, then click ‘Create Process’.",
        },
      },
      {
        id: "s0-to-cpu",
        title: "Step 2: Allocate CPU (Ready → CPU)",
        description: "Schedule the process for execution",
        stepObjectives: [
          "Ready means ‘waiting for CPU’ — the process is queued, not idle",
          "Practice moving a process from Ready to CPU via CPU dispatch",
          "The CPU accepts only one process at a time",
        ],
        instruction:
          "Advance the clock once so the process spends a cycle in Ready, then select its badge in the Ready queue and click ‘→ CPU’ to dispatch it. A newly created process cannot be dispatched in the same clock cycle it was created.",
        hint: "The process badge appears in the Ready section. Select it to see action buttons.",
        quiz: {
          question: "What does it mean when a process is in the Ready state?",
          options: [
            "The process is currently executing instructions on the CPU",
            "The process is waiting for I/O to complete",
            "The process has finished executing",
            "The process is loaded and waiting to be assigned the CPU",
          ],
          correctIndex: 3,
          explanation: "Ready means the process is fully loaded and eligible to run, but the CPU is not yet assigned to it.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "The process is now on the CPU and executing. Only one process can be on the CPU at a time.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s0-preempt",
        title: "Step 3: Preemption (CPU → Ready)",
        description: "Move the process back to Ready to simulate preemption",
        stepObjectives: [
          "Preemption moves a process from CPU back to Ready without terminating it",
          "The preempted process retains its context and can be dispatched again",
          "Practice the CPU → Ready (preemption) transition",
        ],
        instruction:
          "Select the running process on the CPU, then click ‘→ Ready’ to preempt it back to the Ready queue. In real systems, the OS scheduler can preempt a process to share the CPU with others.",
        hint: "Click the process badge in the CPU section to select it, then use the ‘→ Ready’ button.",
        quiz: {
          question: "What is CPU preemption?",
          options: [
            "A process voluntarily giving up the CPU by calling yield()",
            "The OS forcibly removing a process from the CPU and placing it back in Ready",
            "Moving a process from Ready to I/O Wait",
            "Terminating a process that has been running too long",
          ],
          correctIndex: 1,
          explanation: "Preemption is when the OS forcibly takes the CPU away from a running process and returns it to the Ready queue, without ending the process.",
        },
        expectedAction: "preempt_process",
        validation: (state: any) =>
          state.processes?.some((p: any) => p.state === "ready" && p.history?.includes("running")),
        feedback: {
          success: "The process is back in Ready. It retains its context and can be dispatched to CPU again.",
          error: "Select the running process and click ‘→ Ready’.",
        },
      },
      {
        id: "s0-to-cpu-2",
        title: "Step 4: Allocate CPU Again (Ready → CPU)",
        description: "Dispatch the process back to the CPU for its next burst",
        stepObjectives: [
          "A process can be dispatched to CPU multiple times in its life cycle",
          "Practice re-dispatching a previously preempted process",
          "Reinforce that CPU dispatch always starts from the Ready state",
        ],
        instruction:
          "Select the Ready process and click ‘→ CPU’ to dispatch it again. A process can be dispatched to CPU multiple times during its life cycle.",
        hint: "Same action as Step 2 — select the Ready process, then click ‘→ CPU’.",
        quiz: {
          question: "On a single-core system, how many processes can be in the CPU (Running) state simultaneously?",
          options: [
            "Unlimited, based on process priority",
            "Two — one primary, one reserved",
            "One — CPU is an exclusive single slot",
            "Depends on the scheduler algorithm",
          ],
          correctIndex: 2,
          explanation: "A single-core CPU can only execute one process at a time. This is the fundamental constraint of CPU exclusivity.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "Back on the CPU. Now let’s simulate an I/O request.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s0-to-io",
        title: "Step 5: I/O Request (CPU → I/O Wait)",
        description: "Simulate the process requesting an I/O operation",
        stepObjectives: [
          "I/O is requested via the io_needed event while the process is on the CPU",
          "Moving to I/O Wait frees the CPU for another process",
          "I/O blocking is per-process and does not stop the whole system",
        ],
        instruction: "Advance the clock until io_needed appears, then move the running process to I/O Wait.",
        instructionBullets: [
          "Click **Advance Clock** until an **io_needed** event appears in Event Requests (usually after 2 advances while in CPU).",
          "Click the **io_needed** event to select it — it highlights with a blue ring.",
          "Click **→ I/O** on the running process to move it to I/O Wait. The CPU is now free.",
        ],
        hint: "An io_needed event appears after a few clock advances while the process is on CPU. Select the event first, then move to I/O.",
        quiz: {
          question: "When a process moves from CPU to I/O Wait, what happens to the CPU?",
          options: [
            "The CPU also enters a wait state and halts",
            "The CPU is freed and another process can use it",
            "The CPU continues running the same process in background mode",
            "The system halts until I/O completes",
          ],
          correctIndex: 1,
          explanation: "When a process blocks on I/O, it releases the CPU. The CPU is then free to be allocated to another ready process.",
        },
        expectedAction: "move_to_io",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success: "The process is now waiting for I/O. It cannot use the CPU while blocked in I/O Wait.",
          error: "Wait for an io_needed event, select it, then click ‘→ I/O’.",
        },
      },
      {
        id: "s0-io-done",
        title: "Step 6: I/O Completion (I/O Wait → Ready)",
        description: "Return the process to Ready when I/O finishes",
        stepObjectives: [
          "Io_done signals the end of an I/O wait period",
          "After I/O, the process returns to Ready (not directly to CPU)",
          "Practice the I/O Wait → Ready transition using the io_done event",
        ],
        instruction: "Wait for io_done to appear, then return the blocked process to the Ready queue.",
        instructionBullets: [
          "Click **Advance Clock** until an **io_done** event appears in Event Requests for the blocked process.",
          "Click the **io_done** event to select it.",
          "Click **→ Ready** on the blocked process to return it to the Ready queue. It is now eligible for CPU allocation again.",
        ],
        hint: "io_done signals that the I/O operation has completed. The process can now be scheduled for CPU again.",
        quiz: {
          question: "After an io_done event, where does the blocked process go?",
          options: [
            "Directly to the CPU for immediate execution",
            "Back to the Ready queue to wait for CPU allocation",
            "To Terminated state — I/O completion ends the process",
            "Stays in I/O Wait for final confirmation",
          ],
          correctIndex: 1,
          explanation: "io_done moves the process back to Ready, not directly to CPU. It must be re-scheduled because another process may currently hold the CPU.",
        },
        expectedAction: "move_to_ready",
        validation: (state: any) =>
          state.processes?.some((p: any) => p.state === "ready" && p.history?.includes("blocked")),
        feedback: {
          success: "The process is back in Ready after completing its I/O operation.",
          error: "Wait for io_done event, select it, then click ‘→ Ready’.",
        },
      },
      {
        id: "s0-to-cpu-final",
        title: "Step 7: Allocate CPU for Final Execution (Ready → CPU)",
        description: "Schedule the process for its final CPU burst",
        stepObjectives: [
          "A process must be on the CPU to be terminated — Ready state is not sufficient",
          "Practice a third CPU dispatch for the same process",
          "Prepare for the termination step by getting the process into Running state",
        ],
        instruction:
          "Select the Ready process and click ‘→ CPU’ to dispatch it for its final execution. Important: a process can only be terminated from the CPU state, so it must be on the CPU before it can finish.",
        hint: "Move the process from Ready to CPU one more time. Termination requires the process to be actively running.",
        quiz: {
          question: "A process CANNOT be terminated directly from which state?",
          options: [
            "CPU (Running)",
            "CPU (Running) or I/O Wait — both are valid termination points",
            "Ready state — the process must be on CPU first",
            "Terminated — it is already done",
          ],
          correctIndex: 2,
          explanation: "Termination is only valid from the CPU (Running) state. A process in Ready or I/O Wait must first be dispatched to CPU.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) =>
          state.processes?.some((p: any) => p.state === "running" && p.history?.includes("blocked")),
        feedback: {
          success: "The process is on the CPU for its final execution. Now wait for the terminate event.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s0-terminate",
        title: "Step 8: Terminate (CPU → Terminated)",
        description: "End the process from the CPU state",
        stepObjectives: [
          "Termination requires both a terminate event AND the process being in CPU state",
          "Practice the CPU → Terminated transition",
          "Processes can never be terminated from Ready or I/O Wait",
        ],
        instruction: "Advance the clock until a terminate event appears, then select it and terminate the running process.",
        instructionBullets: [
          "Click **Advance Clock** until a **Terminated** event appears in Event Requests for the running process.",
          "Click the **Terminated** event to select it — it highlights with a blue ring.",
          "Click **Terminate** on the running process in the Controls panel. The process moves to the Terminated state.",
        ],
        hint: "The terminate event appears after the process has been on the CPU long enough. Select it first, then use the Terminate button.",
        quiz: {
          question: "What must be true before you can terminate a process?",
          options: [
            "The process must have completed at least one I/O cycle",
            "The process must have been in Ready state for at least 5 clock ticks",
            "A terminate event must exist AND the process must be in CPU (Running) state",
            "Any active process can be terminated at any time using the terminate button",
          ],
          correctIndex: 2,
          explanation: "Termination requires two conditions: a terminate event must be selected, AND the process must currently be in CPU (Running) state.",
        },
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "The process has been terminated from the CPU state. Full life cycle complete!",
          error: "Wait for the terminate event while the process is on the CPU, select it, then click Terminate.",
        },
      },
      {
        id: "s0-summary",
        title: "Tutorial Complete",
        description: "A recap of the key rules covered",
        stepObjectives: [
          "Consolidate knowledge of all five states and their transitions",
          "Reinforce the key rule: termination is only valid from the CPU (Running) state",
          "Prepare to apply these skills in the guided scenario sequence",
        ],
        instruction:
          "Key rules: (1) Processes enter Ready after creation. (2) Only one process can occupy the CPU at a time. (3) I/O blocks only the requesting process. (4) Processes can ONLY be terminated from the CPU state. Click ‘Check & Complete Step’ to finish the tutorial.",
        hint: "No action required — click ‘Check & Complete Step’ to finish.",
        quiz: {
          question: "Which of the following statements about process scheduling is TRUE?",
          options: [
            "A process can be terminated from Ready, I/O Wait, or CPU states",
            "The CPU should remain idle between process dispatches for stability",
            "When the Ready queue is non-empty, the CPU should stay busy to maximize throughput",
            "Each process owns the CPU exclusively until it terminates naturally",
          ],
          correctIndex: 2,
          explanation: "CPU utilization is maximized by dispatching Ready processes immediately when the CPU is free. Letting the CPU sit idle while processes wait in Ready is wasteful.",
        },
        expectedAction: "read_summary",
        validation: () => true,
        feedback: {
          success: "Tutorial complete! You are ready for the guided scenarios. Proceed to Scenario 1.",
          error: "Click ‘Check & Complete Step’ to finish.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 10 }],
  },

  // ── Scenario 1: Single Process – Normal Execution ─────────────────────────
  {
    id: "s1-single-normal",
    title: "Scenario 1: Single Process – Normal Execution",
    description: "Move a single process through its complete life cycle: Ready → CPU → Terminated",
    difficulty: "beginner",
    estimatedTime: 5,
    objectives: [
      "The CPU is allocated to a ready process.",
      "The process is terminated from CPU state when a terminate event appears.",
    ],
    steps: [
      {
        id: "s1-create",
        title: "Create the Process",
        description: "Admit the process into the system",
        stepObjectives: [
          "Create a process using a create_request event",
          "Observe the process enter Ready state",
          "Process creation is an event-driven action",
        ],
        instruction: "Advance the clock and use a create_request event to admit a process into the system.",
        instructionBullets: [
          "Click **Advance Clock** until a purple **create_request** event appears in Event Requests.",
          "Click the **create_request** event to select it.",
          "Click **Create Process** to admit the process into the Ready state.",
        ],
        hint: "Look for the purple create_request event in Event Requests",
        quiz: {
          question: "After create_request is handled, the process enters which state?",
          options: ["CPU (Running)", "I/O Wait", "Ready", "Terminated"],
          correctIndex: 2,
          explanation: "Every newly created process enters the Ready state, where it waits to be allocated the CPU.",
        },
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "The process is now in the Ready state, waiting for CPU allocation.",
          error: "Select a create_request event and click ‘Create Process’.",
        },
      },
      {
        id: "s1-to-cpu",
        title: "Allocate CPU (Ready → CPU)",
        description: "Dispatch the process to the CPU for execution",
        stepObjectives: [
          "Dispatch a Ready process to the CPU",
          "Understand CPU allocation as the Ready → CPU transition",
          "Only one process can occupy CPU at a time",
        ],
        instruction: "Advance the clock once, then select the process in Ready and click ‘→ CPU’. A newly created process waits at least one cycle in Ready before it can be dispatched.",
        hint: "Click on the process badge in Ready, then use the action button",
        quiz: {
          question: "The transition Ready → CPU is called:",
          options: ["Preemption", "I/O dispatch", "CPU allocation / scheduling dispatch", "Termination"],
          correctIndex: 2,
          explanation: "Moving a process from Ready to CPU is called CPU allocation or dispatch — the scheduler assigns the CPU resource to the waiting process.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "The process is now executing on the CPU.",
          error: "Select the Ready process and move it to CPU.",
        },
      },
      {
        id: "s1-terminate",
        title: "Terminate (CPU → Terminated)",
        description: "End the process from the CPU state using a terminate event",
        stepObjectives: [
          "Terminate a process from CPU state using the terminate event",
          "Complete the shortest valid life cycle: Ready → CPU → Terminated",
          "Reinforce that termination is only possible from CPU (Running) state",
        ],
        instruction: "Advance the clock until a terminate event appears, then select it and terminate the process.",
        instructionBullets: [
          "Click **Advance Clock** twice. After 2 advances, an **io_needed** event appears in Event Requests — the process is signalling it wants to perform I/O.",
          "Continue advancing the clock 2 more times (4 total) without acting on the io_needed event. A **Terminated** event will appear — the OS decides to end the process rather than service the I/O.",
          "Click the **Terminated** event in Event Requests to select it (it highlights with a blue ring).",
          "Click **Terminate** on the running process in the Controls panel. The process moves from CPU to Terminated.",
        ],
        hint: "You will see both an io_needed and a Terminated event in the queue — ignore io_needed and use the Terminated event instead. Both can coexist: you choose which path to take.",
        quiz: {
          question: "Termination is valid only from which process state?",
          options: ["Ready", "I/O Wait", "CPU (Running)", "Any active state"],
          correctIndex: 2,
          explanation: "A process can only be terminated while it is actively executing on the CPU (Running state). Attempting to terminate from Ready or I/O Wait will be rejected.",
        },
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "Excellent! You completed a valid life cycle: Ready → CPU → Terminated.",
          error: "Wait for the terminate event while the process is on the CPU, select it, then terminate.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 4 }],
  },

  // ── Scenario 2: CPU Exclusivity ────────────────────────────────────────────
  {
    id: "s2-cpu-exclusivity",
    title: "Scenario 2: CPU Exclusivity with Two Processes",
    description: "Only one process may occupy the CPU at a time. The second attempt is blocked.",
    difficulty: "beginner",
    estimatedTime: 8,
    objectives: [
      "The CPU is a single exclusive slot.",
      "A second process attempting to enter the CPU is rejected.",
      "The CPU must be freed before another process can be dispatched.",
    ],
    steps: [
      {
        id: "s2-create-two",
        title: "Create Two Processes",
        description: "Admit two processes into the system",
        stepObjectives: [
          "Create two processes to populate the Ready queue",
          "Multiple processes can coexist in Ready",
          "Set up the scenario for demonstrating CPU exclusivity",
        ],
        instruction: "Advance the clock and create two processes from create_request events.",
        instructionBullets: [
          "Click **Advance Clock** until a **create_request** event appears, select it, and click **Create Process**.",
          "Repeat: advance the clock again, select the next **create_request** event, and click **Create Process**.",
          "You should now have 2 processes in the Ready queue.",
        ],
        hint: "You need two processes in Ready to demonstrate exclusivity",
        quiz: {
          question: "On a single-core system with multiple ready processes, what happens?",
          options: [
            "All ready processes run simultaneously on the CPU",
            "The CPU executes one at a time; others wait in the Ready queue",
            "Processes automatically share CPU time in equal slices",
            "The OS selects one process and terminates all others",
          ],
          correctIndex: 1,
          explanation: "A single-core CPU can only execute one process at a time. Other ready processes must wait in the Ready queue until the CPU becomes available.",
        },
        expectedAction: "create_multiple_processes",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state !== "new" && p.state !== "terminated").length ?? 0) >= 2,
        feedback: {
          success: "Two processes are now in Ready.",
          error: "Create at least 2 processes using create_request events.",
        },
      },
      {
        id: "s2-first-cpu",
        title: "Move First Process to CPU",
        description: "Dispatch one process to CPU",
        stepObjectives: [
          "Dispatch the first process to CPU",
          "The second process stays in Ready",
          "CPU is a single exclusive resource on a single-core system",
        ],
        instruction: "Advance the clock once, then select any Ready process and click ‘→ CPU’. A freshly created process must spend at least one cycle in Ready first.",
        hint: "Only one process can be in CPU. Choose either one.",
        quiz: {
          question: "After dispatching one process to CPU, where does the second Ready process go?",
          options: [
            "It also moves to CPU — both can run simultaneously",
            "It moves to I/O Wait automatically",
            "It remains in the Ready queue, waiting for CPU to become free",
            "It is terminated to free memory for the running process",
          ],
          correctIndex: 2,
          explanation: "The second process stays in Ready. It can only move to CPU after the first process leaves — either by preemption, I/O, or termination.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "One process is running on CPU. The other remains in Ready.",
          error: "Select a Ready process and move it to CPU.",
        },
      },
      {
        id: "s2-try-second",
        title: "Attempt Second CPU Allocation (Blocked)",
        description: "Try to move the second process to CPU and observe the rejection",
        stepObjectives: [
          "Observe the error when a second process tries to enter an occupied CPU",
          "The CPU exclusivity rule through a failed transition attempt",
          "The CPU must be freed before another process can be dispatched",
        ],
        instruction:
          "Select the second Ready process and try to move it to CPU. You will see an error because CPU is occupied. This demonstrates CPU exclusivity.",
        hint: "The system will reject the attempt with an error message explaining that only one process can run at a time.",
        quiz: {
          question: "Why does the system reject a second process attempting to enter an occupied CPU?",
          options: [
            "The second process has lower priority than the running process",
            "A single-core CPU can only execute one process at a time",
            "The CPU is reserved only for the OS kernel",
            "Only the first process created is allowed to use the CPU",
          ],
          correctIndex: 1,
          explanation: "CPU exclusivity is a fundamental hardware constraint: one core can execute exactly one instruction stream at a time.",
        },
        expectedAction: "demonstrate_cpu_exclusivity",
        validation: () => true,
        feedback: {
          success:
            "You observed CPU exclusivity. The CPU only accepts one process at a time. Free the CPU first (preempt to Ready or move to I/O) to dispatch another.",
          error: "Try moving the second process to CPU to see the error.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 4 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
    ],
  },

  // ── Scenario 3: I/O Blocking and Return ───────────────────────────────────
  {
    id: "s3-io-blocking",
    title: "Scenario 3: I/O Blocking and Return",
    description: "Complete the full I/O cycle: Ready → CPU → I/O → Ready → CPU → Terminated",
    difficulty: "intermediate",
    estimatedTime: 10,
    objectives: [
      "I/O is a blocking wait state.",
      "io_needed moves a process from CPU to I/O.",
      "io_done returns a process from I/O to Ready.",
      "After I/O completes the CPU is allocated again, then the process terminates from CPU.",
    ],
    steps: [
      {
        id: "s3-create",
        title: "Create the Process",
        description: "Admit a process into the system",
        stepObjectives: [
          "Create a process to begin the I/O life cycle demonstration",
          "Confirm the process enters Ready state",
          "Prepare for the CPU → I/O path",
        ],
        instruction: "Advance the clock and create a process from a create_request event.",
        instructionBullets: [
          "Click **Advance Clock** until a purple **create_request** event appears in Event Requests.",
          "Click the event to select it, then click **Create Process**.",
        ],
        hint: "Look for the purple create_request event",
        quiz: {
          question: "After create_request is handled, the process state is:",
          options: ["Running (CPU)", "Ready", "Blocked (I/O Wait)", "Terminated"],
          correctIndex: 1,
          explanation: "The create_request event admits a process into Ready — it is now queued for CPU allocation.",
        },
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "Process is in Ready state.",
          error: "Create a process using a create_request event.",
        },
      },
      {
        id: "s3-to-cpu",
        title: "Allocate CPU",
        description: "Move the process to CPU",
        stepObjectives: [
          "Dispatch the process to CPU",
          "I/O can only be requested from the CPU (Running) state",
          "Set up the process for an I/O request",
        ],
        instruction: "Advance the clock once, then select the Ready process and click ‘→ CPU’. A newly created process is dispatched on a later cycle, not the cycle it was created.",
        hint: "The process must be in CPU before it can request I/O",
        quiz: {
          question: "Before a process can request I/O (io_needed), it must be in:",
          options: ["Ready state", "CPU (Running) state", "I/O Wait state", "Terminated state"],
          correctIndex: 1,
          explanation: "I/O requests originate from running code — a process can only issue an I/O request while it is executing on the CPU.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "Process is executing on CPU.",
          error: "Move the process from Ready to CPU.",
        },
      },
      {
        id: "s3-to-io",
        title: "I/O Request (CPU → I/O Wait)",
        description: "When the io_needed event appears, move the process to I/O",
        stepObjectives: [
          "Use the io_needed event to move the process from CPU to I/O Wait",
          "I/O Wait blocks only the requesting process",
          "The CPU is freed when a process enters I/O Wait",
        ],
        instruction: "Advance the clock until io_needed appears, then move the process from CPU to I/O Wait.",
        instructionBullets: [
          "Click **Advance Clock** twice. After 2 advances while in CPU, an **io_needed** event appears in Event Requests.",
          "Click the **io_needed** event to select it.",
          "Click **→ I/O** on the running process. It moves to I/O Wait and the CPU is freed.",
        ],
        hint: "io_needed appears after 2 clock advances in CPU. I/O is a blocking state — the process cannot execute while waiting for I/O.",
        quiz: {
          question: "When a process enters I/O Wait, what is true about the CPU?",
          options: [
            "The CPU pauses until the process returns from I/O",
            "The CPU becomes free for another process to use",
            "The CPU continues executing the same process in background",
            "CPU time is shared between the I/O wait and other processes",
          ],
          correctIndex: 1,
          explanation: "Entering I/O Wait releases the CPU. This allows another Ready process to be dispatched, maximizing CPU utilization.",
        },
        expectedAction: "move_to_io",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success: "Process is now waiting for I/O completion. It is blocked and cannot use the CPU.",
          error: "Wait for io_needed event, select it, then move the process to I/O.",
        },
      },
      {
        id: "s3-io-done",
        title: "I/O Completion (I/O Wait → Ready)",
        description: "Return the process to Ready when I/O completes",
        stepObjectives: [
          "Use the io_done event to return the process from I/O Wait to Ready",
          "The process re-enters the scheduling queue after I/O",
          "Reinforce the I/O Wait → Ready transition",
        ],
        instruction: "Advance the clock until io_done appears, then return the process to the Ready queue.",
        instructionBullets: [
          "Click **Advance Clock** until an **io_done** event appears in Event Requests for the blocked process.",
          "Click the **io_done** event to select it.",
          "Click **→ Ready** on the blocked process to move it back to the Ready queue.",
        ],
        hint: "io_done signals that the I/O operation has finished. Select the event first, then use ‘→ Ready’.",
        quiz: {
          question: "After io_done, the process moves to Ready (not directly to CPU). Why?",
          options: [
            "Because io_done removes the process from the system",
            "Because the process must be re-scheduled — another process may currently be using the CPU",
            "Because Ready is a mandatory intermediate for all transitions",
            "Because io_done cancels the process and a new create_request is needed",
          ],
          correctIndex: 1,
          explanation: "The process goes to Ready because the CPU might already be occupied. It must wait its turn in the Ready queue for the next CPU allocation.",
        },
        expectedAction: "move_to_ready",
        validation: (state: any) =>
          state.processes?.some((p: any) => p.history?.includes("blocked") && p.state === "ready"),
        feedback: {
          success: "I/O cycle complete. The process is back in Ready for another CPU allocation.",
          error: "Select the io_done event and move the process from I/O to Ready.",
        },
      },
      {
        id: "s3-to-cpu-again",
        title: "Allocate CPU Again (Ready → CPU)",
        description: "Dispatch the process back to CPU for its final execution",
        stepObjectives: [
          "Dispatch the process back to CPU after I/O completion",
          "Re-dispatch is required after every I/O cycle",
          "Prepare for termination by getting the process back to Running state",
        ],
        instruction:
          "Select the Ready process and click ‘→ CPU’. The process must be on the CPU before it can be terminated.",
        hint: "After I/O, the process returns to Ready. Move it to CPU again for its final burst.",
        quiz: {
          question: "After returning from I/O to Ready, what must happen before termination?",
          options: [
            "The process can be terminated directly from Ready using the terminate event",
            "The process must be dispatched to CPU first — termination is only valid from CPU (Running) state",
            "The process must complete another I/O cycle before being eligible for termination",
            "The process terminates automatically after io_done when no more I/O is pending",
          ],
          correctIndex: 1,
          explanation: "Termination is only valid from the CPU (Running) state. After I/O, the process is back in Ready and must be dispatched to CPU again before it can terminate.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) =>
          state.processes?.some((p: any) => p.state === "running" && p.history?.includes("blocked")),
        feedback: {
          success: "Process is back on the CPU. Now wait for the terminate event.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s3-terminate",
        title: "Terminate (CPU → Terminated)",
        description: "Complete the life cycle by terminating from CPU state",
        stepObjectives: [
          "Terminate the process from CPU state to complete the full I/O life cycle",
          "Observe the full path: Ready → CPU → I/O Wait → Ready → CPU → Terminated",
          "Every termination requires the process to be on the CPU",
        ],
        instruction: "Advance the clock until a terminate event appears, then terminate the running process.",
        instructionBullets: [
          "Click **Advance Clock** until a **Terminated** event appears for the running process.",
          "Click the **Terminated** event to select it.",
          "Click **Terminate** on the running process. The full life cycle — Ready → CPU → I/O → Ready → CPU → Terminated — is now complete.",
        ],
        hint: "The full path was: Ready → CPU → I/O → Ready → CPU → Terminated",
        quiz: {
          question: "Which path represents the complete life cycle in this scenario?",
          options: [
            "Ready → CPU → Terminated (direct, no I/O)",
            "Ready → CPU → I/O Wait → Ready → CPU → Terminated",
            "Ready → I/O Wait → CPU → Terminated",
            "Ready → I/O Wait → CPU → Terminated (I/O before first CPU burst)",
          ],
          correctIndex: 1,
          explanation: "The full I/O life cycle is: Ready → CPU → I/O Wait → Ready → CPU → Terminated. The process returns to Ready after I/O and must be re-dispatched to CPU to terminate.",
        },
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "Excellent! Full I/O life cycle completed: Ready → CPU → I/O → Ready → CPU → Terminated.",
          error: "Select the terminate event and terminate the process from CPU state.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 8 }],
  },

  // ── Scenario 4: Invalid Transition Exploration ─────────────────────────────
  {
    id: "s4-invalid-transitions",
    title: "Scenario 4: Invalid Transition Exploration",
    description: "Discover which transitions are invalid and understand why they are rejected.",
    difficulty: "beginner",
    estimatedTime: 8,
    objectives: [
      "Ready → I/O is attempted and rejected.",
      "Ready → Terminated is attempted and rejected.",
      "The valid transition diagram defines the permitted moves.",
      "The process completes via the correct path (CPU → Terminated).",
    ],
    steps: [
      {
        id: "s4-create",
        title: "Create a Process",
        description: "Admit a process into Ready state",
        stepObjectives: [
          "Create a process to use for testing invalid transitions",
          "Begin with the process in Ready state",
          "Set up the exploration of the transition diagram",
        ],
        instruction: "Create a process so it enters the Ready state.",
        instructionBullets: [
          "Click **Advance Clock** until a **create_request** event appears, select it, and click **Create Process**.",
        ],
        hint: "Advance the clock and use a create_request event",
        quiz: {
          question: "Which of these is a VALID process state transition?",
          options: [
            "Ready → I/O Wait (direct, without CPU)",
            "I/O Wait → CPU (direct)",
            "CPU → I/O Wait (with io_needed event)",
            "Ready → Terminated (direct)",
          ],
          correctIndex: 2,
          explanation: "CPU → I/O Wait is the only valid option here. The others skip required intermediate states — I/O can only be requested from CPU, and termination only happens from CPU.",
        },
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "Process is in Ready. Now try some invalid transitions.",
          error: "Create a process first.",
        },
      },
      {
        id: "s4-try-ready-io",
        title: "Try Ready → I/O (Invalid)",
        description: "Attempt to move a Ready process directly to I/O",
        stepObjectives: [
          "Attempt the invalid Ready → I/O transition",
          "Observe the error message explaining why this transition is rejected",
          "I/O can only be initiated from CPU state",
        ],
        instruction:
          "Select the Ready process and try to move it to I/O. The system will reject this because a process must go through CPU before entering I/O.",
        hint: "Ready → I/O is not a valid transition. A process can only enter I/O from the CPU state.",
        quiz: {
          question: "Why is Ready → I/O an invalid transition?",
          options: [
            "I/O Wait is a protected state that only the OS can enter",
            "A process can only enter I/O Wait from CPU — it must be executing to issue an I/O request",
            "Ready processes do not have I/O device access permissions",
            "I/O Wait requires a special privilege level that Ready processes lack",
          ],
          correctIndex: 1,
          explanation: "I/O requests are code executed by the process while it is running on the CPU. A process in Ready is not executing any code, so it cannot issue an I/O request.",
        },
        expectedAction: "test_invalid_transition",
        validation: () => true,
        feedback: {
          success:
            "You observed that Ready → I/O is invalid. A process must be executing on CPU to request I/O.",
          error: "Try moving the Ready process to I/O to see the error.",
        },
      },
      {
        id: "s4-try-ready-term",
        title: "Try Ready → Terminated (Invalid)",
        description: "Attempt to terminate a process directly from Ready state",
        stepObjectives: [
          "Attempt the invalid Ready → Terminated transition",
          "Observe the error message explaining the CPU requirement for termination",
          "Reinforce that the CPU state is mandatory for process termination",
        ],
        instruction:
          "Select the Ready process and try to terminate it. The system will reject this because termination only happens from the CPU (Running) state, not from Ready.",
        hint: "Ready → Terminated is not a valid transition. A process must be actively executing on the CPU to be terminated.",
        quiz: {
          question: "Why is Ready → Terminated an invalid transition?",
          options: [
            "Only newly created processes can be terminated without using the CPU",
            "A process can only be terminated while it is actively executing on the CPU (Running state)",
            "The terminate event only appears for processes already in I/O Wait",
            "Ready → Terminated is valid but requires a special terminate event",
          ],
          correctIndex: 1,
          explanation: "Termination happens when a process finishes its execution on the CPU. A process that has never run on the CPU (or is just waiting in Ready) cannot be terminated.",
        },
        expectedAction: "test_invalid_transition",
        validation: () => true,
        feedback: {
          success:
            "You observed that Ready → Terminated is invalid. Termination only works from the CPU state.",
          error: "Try terminating the Ready process to see the error.",
        },
      },
      {
        id: "s4-correct-path",
        title: "Complete via Correct Path",
        description: "Now complete the process using valid transitions",
        stepObjectives: [
          "Complete the process using the only valid path: Ready → CPU → Terminated",
          "Demonstrate mastery of valid transitions after exploring invalid ones",
          "Apply the learned transition rules to successfully terminate a process",
        ],
        instruction: "Dispatch the process to CPU, then wait for the terminate event and use it.",
        instructionBullets: [
          "Click the Ready process to select it, then click **→ CPU** to dispatch it.",
          "Click **Advance Clock** until a **Terminated** event appears in Event Requests for the running process.",
          "Click the **Terminated** event to select it, then click **Terminate** to complete the life cycle.",
        ],
        hint: "The valid path is: Ready → CPU → Terminated. Move to CPU first, then wait for the terminate event.",
        quiz: {
          question: "What is the correct path to terminate a process currently in Ready state?",
          options: [
            "Terminate it directly using a terminate event from Ready",
            "Move it to I/O Wait first, then to CPU, then terminate",
            "Dispatch it to CPU first, then wait for and use the terminate event from CPU state",
            "Preempt it to Ready, then terminate it directly from Ready",
          ],
          correctIndex: 2,
          explanation: "The only valid path from Ready to Terminated is: Ready → CPU → Terminated. The process must be dispatched to CPU first.",
        },
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "You completed the process via the correct path: Ready → CPU → Terminated.",
          error: "Move the process to CPU, wait for the terminate event, then terminate.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 6 }],
  },

  // ── Scenario 5: Multiple Processes with I/O Interleaving ──────────────────
  {
    id: "s5-io-interleaving",
    title: "Scenario 5: Multiple Processes with I/O Interleaving",
    description: "Manage three processes with independent life cycles and concurrent I/O.",
    difficulty: "intermediate",
    estimatedTime: 15,
    objectives: [
      "I/O does not block other processes globally.",
      "CPU and I/O are interleaved across multiple processes.",
      "All three process life cycles complete.",
    ],
    steps: [
      {
        id: "s5-create-all",
        title: "Create Three Processes",
        description: "Admit three processes into Ready",
        stepObjectives: [
          "Create three processes to simulate a multi-process environment",
          "Observe all processes entering the Ready queue",
          "Set up the demonstration of parallel I/O and CPU usage",
        ],
        instruction: "Advance the clock and create 3 processes from create_request events.",
        instructionBullets: [
          "Click **Advance Clock** 2–4 times until a **create_request** event appears.",
          "Click the event to select it, then click **Create Process**.",
          "Repeat steps 1–2 until you have admitted 3 processes into the Ready queue.",
        ],
        hint: "create_request events appear every 2–4 clock advances",
        quiz: {
          question: "When the CPU is free and multiple processes are in Ready, what is the correct action?",
          options: [
            "Wait until all processes have been created before dispatching any",
            "Dispatch one process to CPU immediately — the CPU should not sit idle",
            "Move all processes to I/O to avoid CPU conflicts",
            "Terminate excess processes to simplify management",
          ],
          correctIndex: 1,
          explanation: "The CPU should stay busy. When Ready processes exist and the CPU is free, dispatch one immediately. Idle CPU wastes system resources.",
        },
        expectedAction: "create_all_processes",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state !== "new" && p.state !== "terminated").length ?? 0) >= 3,
        feedback: {
          success: "Three processes are active.",
          error: "Continue creating processes until you have 3.",
        },
      },
      {
        id: "s5-io-one",
        title: "Send One Process to I/O",
        description: "Move a process through CPU to I/O while others wait",
        stepObjectives: [
          "Move one process through CPU to I/O Wait",
          "Only the requesting process is blocked, not the entire system",
          "I/O blocking is per-process on a single-core system",
        ],
        instruction: "Dispatch a process to CPU, advance until io_needed appears, then move it to I/O.",
        instructionBullets: [
          "Click a Ready process to select it, then click **→ CPU** to dispatch it.",
          "Click **Advance Clock** twice. An **io_needed** event appears after 2 advances on the CPU.",
          "Click the **io_needed** event to select it, then click **→ I/O**. The process enters I/O Wait and the CPU is freed.",
        ],
        hint: "After this process enters I/O, the CPU is free for another process",
        quiz: {
          question: "When a process enters I/O Wait, which of the following is true?",
          options: [
            "All other processes also pause and wait for I/O to complete",
            "Only the process in I/O Wait is blocked; others can continue using the CPU",
            "The CPU halts until I/O completes",
            "The system generates an error until all I/O operations finish",
          ],
          correctIndex: 1,
          explanation: "I/O blocking is per-process. The requesting process waits, but the CPU is freed for other Ready processes to continue executing.",
        },
        expectedAction: "move_to_io",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success:
            "One process is in I/O. The CPU is now free. I/O is per-process: other processes are not blocked.",
          error: "Move a process to CPU, then to I/O using io_needed.",
        },
      },
      {
        id: "s5-interleave",
        title: "CPU Continues with Another Process",
        description: "Demonstrate that I/O does not block CPU globally",
        stepObjectives: [
          "Dispatch a Ready process to CPU while another is in I/O Wait",
          "Demonstrate that CPU and I/O can operate concurrently for different processes",
          "Understand CPU utilization: the CPU should stay busy when Ready processes exist",
        ],
        instruction:
          "While one process is in I/O, move another Ready process to CPU. This shows that I/O only blocks the requesting process, not the entire system.",
        hint: "Select a different Ready process and move it to CPU",
        quiz: {
          question: "While one process is in I/O Wait, another Ready process should:",
          options: [
            "Also wait in Ready until I/O completes before using the CPU",
            "Be terminated since there is no CPU available",
            "Be dispatched to CPU immediately — I/O only blocks the requesting process",
            "Be moved to I/O as well to synchronize all processes",
          ],
          correctIndex: 2,
          explanation: "I/O Wait only blocks the process that requested I/O. The CPU is free and should be given to another Ready process immediately.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) =>
          state.processes?.some((p: any) => p.state === "running") &&
          state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success: "One process is in I/O, another is on CPU. Each process has an independent life cycle.",
          error: "Move another Ready process to CPU while the first is in I/O.",
        },
      },
      {
        id: "s5-complete",
        title: "Complete All Life Cycles",
        description: "Terminate all three processes",
        stepObjectives: [
          "Terminate all three processes to complete the scenario",
          "Apply the CPU idle rule: always dispatch a Ready process when CPU is free",
          "Demonstrate management of multiple simultaneous process life cycles",
        ],
        instruction: "Manage all three processes through their life cycles until all are terminated.",
        instructionBullets: [
          "When a process returns from I/O (**io_done** → **→ Ready**), immediately dispatch another Ready process to CPU if the CPU is free.",
          "Click **Advance Clock** until **Terminated** events appear for running processes.",
          "Select each **Terminated** event and click **Terminate** on the corresponding process.",
          "Repeat — advancing the clock and handling events — until all 3 processes are in the Terminated state.",
        ],
        hint: "Return I/O processes to Ready using io_done, then dispatch to CPU, then terminate from CPU when terminate events appear",
        quiz: {
          question: "The CPU idle rule for multi-process systems states:",
          options: [
            "CPU must remain idle between process dispatches to prevent race conditions",
            "When the Ready queue is non-empty, the CPU should stay busy dispatching processes",
            "Processes should take turns with equal time slices and voluntary yields",
            "Only the highest-priority process may use the CPU at any time",
          ],
          correctIndex: 1,
          explanation: "CPU utilization is a key scheduling goal. When Ready processes exist, the CPU should be kept busy — idling the CPU with available work is a scheduling error.",
        },
        cpuIdleBlocked: true,
        expectedAction: "terminate_all",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 3,
        feedback: {
          success: "All three processes terminated with independent life cycles!",
          error: "Continue managing processes until all 3 are terminated.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 6 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
      { id: "P2", arrivalTime: 0, burstTime: 8 },
    ],
  },

  // ── Scenario 6: Invalid Event Triggering ──────────────────────────────────
  {
    id: "s6-invalid-events",
    title: "Scenario 6: Invalid Event Triggering",
    description: "Events are state-dependent. Triggering an event on a process in the wrong state fails.",
    difficulty: "intermediate",
    estimatedTime: 8,
    objectives: [
      "Events are tied to specific process states.",
      "I/O completion fails if the process is not in I/O.",
      "The correct event-to-state mapping determines which events apply.",
    ],
    steps: [
      {
        id: "s6-setup",
        title: "Get a Process to CPU",
        description: "Create a process and move it to CPU",
        stepObjectives: [
          "Create a process and dispatch it to CPU",
          "Establish the baseline state for event validity testing",
          "Events are tied to specific process states",
        ],
        instruction: "Create a process and dispatch it to CPU.",
        instructionBullets: [
          "Click **Advance Clock** until a **create_request** event appears, select it, and click **Create Process**.",
          "Click **Advance Clock** once more so the process spends a cycle in Ready (a newly created process cannot be dispatched in the same cycle it was created).",
          "Click the Ready process to select it, then click **→ CPU** to dispatch it.",
        ],
        hint: "Standard flow: create_request, then Ready → CPU",
        quiz: {
          question: "The io_needed event is only valid when the process is in which state?",
          options: ["Ready", "CPU (Running)", "I/O Wait", "Terminated"],
          correctIndex: 1,
          explanation: "io_needed signals that a running process needs to perform I/O. It only applies when the process is executing on the CPU.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "Process is on CPU. Now observe state-dependent event behaviour.",
          error: "Create a process and move it to CPU.",
        },
      },
      {
        id: "s6-wrong-event",
        title: "Attempt Wrong Event",
        description: "Try to trigger io_done on a running process",
        stepObjectives: [
          "Io_done only applies to processes in I/O Wait state",
          "The event-to-state mapping: io_needed→CPU, io_done→I/O Wait, terminate→CPU",
          "Observe why mismatched events cause transition failures",
        ],
        instruction:
          "If an io_done event were available, trying to use it on a running process would fail because the process is not in I/O state. Events only work when the process is in the matching state.",
        hint: "io_done only applies to processes in I/O state. io_needed only applies to processes in CPU state.",
        quiz: {
          question: "The io_done event is designed to transition a process from:",
          options: [
            "Ready → CPU",
            "CPU → I/O Wait",
            "I/O Wait → Ready",
            "CPU → Terminated",
          ],
          correctIndex: 2,
          explanation: "io_done signals that an I/O operation has completed. It moves the process from I/O Wait back to Ready for re-scheduling.",
        },
        expectedAction: "test_invalid_event",
        validation: () => true,
        feedback: {
          success:
            "Events are state-dependent — each event only applies to a specific process state.",
          error: "Observe how events are tied to specific states.",
        },
      },
      {
        id: "s6-correct",
        title: "Use Correct Events",
        description: "Complete the process using proper event sequence",
        stepObjectives: [
          "Use the correct events in the right states to complete the life cycle",
          "Practice proper event-driven state transitions",
          "Demonstrate mastery of event-to-state mapping",
        ],
        instruction: "Use io_needed to send the process to I/O, io_done to return it, then terminate from CPU.",
        instructionBullets: [
          "Advance 2 times. When **io_needed** appears, select it and click **→ I/O** to move the process to I/O Wait.",
          "Advance until **io_done** appears. Select it and click **→ Ready** to return the process.",
          "Click the Ready process to select it, then click **→ CPU** to dispatch it.",
          "Advance until a **Terminated** event appears. Select it and click **Terminate**.",
        ],
        hint: "Wait for the correct event to appear and select it before performing the transition",
        quiz: {
          question: "Which event sequence correctly handles a process through an I/O cycle?",
          options: [
            "io_done first, then io_needed (I/O completes before it starts)",
            "io_needed (while in CPU) → io_done (while in I/O Wait), then re-dispatch to CPU → terminate",
            "terminate → io_needed → io_done (in any order)",
            "create_request → io_needed → io_done → terminate (all from Ready)",
          ],
          correctIndex: 1,
          explanation: "The correct order: io_needed fires while on CPU (entering I/O), then io_done fires while in I/O Wait (exiting I/O), then re-dispatch to CPU, then terminate.",
        },
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "Process completed with correct event usage.",
          error: "Use the correct events to complete the life cycle.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 6 }],
  },

  // ── Scenario 7: Extended Ready State Waiting ──────────────────────────────
  {
    id: "s7-ready-waiting",
    title: "Scenario 7: Extended Ready State Waiting",
    description: "One process waits in Ready while another executes. Ready = waiting for CPU.",
    difficulty: "beginner",
    estimatedTime: 8,
    objectives: [
      "Ready means ‘waiting for CPU allocation’.",
      "A process stays in Ready while another runs.",
      "Both processes are terminated from CPU state.",
    ],
    steps: [
      {
        id: "s7-create-two",
        title: "Create Two Processes",
        description: "Get two processes into Ready state",
        stepObjectives: [
          "Create two processes to observe concurrent Ready state waiting",
          "The Ready queue as a waiting area for CPU allocation",
          "Set up the scenario for observing one process wait while another runs",
        ],
        instruction: "Advance the clock and create 2 processes using create_request events.",
        instructionBullets: [
          "Click **Advance Clock** until a **create_request** event appears, then select it and click **Create Process**.",
          "Repeat: advance until another **create_request** event appears, select it, and click **Create Process**.",
          "You should now have 2 processes in the Ready queue.",
        ],
        hint: "Both processes will enter Ready and wait for CPU",
        quiz: {
          question: "The Ready state means:",
          options: [
            "The process is currently executing instructions",
            "The process is blocked waiting for I/O",
            "The process is loaded into memory and waiting for CPU allocation",
            "The process has completed execution",
          ],
          correctIndex: 2,
          explanation: "Ready means the process is fully prepared to run but is waiting for the scheduler to allocate the CPU to it.",
        },
        expectedAction: "create_two",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state === "ready").length ?? 0) >= 2,
        feedback: {
          success: "Two processes in Ready. Only one can go to CPU.",
          error: "Create two processes using create_request events.",
        },
      },
      {
        id: "s7-first-runs",
        title: "Dispatch First Process",
        description: "One process runs while the other waits in Ready",
        stepObjectives: [
          "One process can run while another waits in Ready",
          "Understand Ready as active waiting, not a dormant/idle state",
          "See the CPU’s role as an exclusive single resource",
        ],
        instruction:
          "Move one process to CPU. The other stays in Ready — it is waiting for CPU allocation. Ready is not idle; the process is queued and waiting.",
        hint: "The waiting process remains in Ready until the CPU is free and you dispatch it",
        quiz: {
          question: "When one process is running on CPU and another is in Ready, the Ready process:",
          options: [
            "Also gets some CPU time via automatic time-sharing",
            "Is blocked in I/O Wait until the running process finishes",
            "Waits in the Ready queue until the CPU becomes available",
            "Is automatically terminated after a timeout period",
          ],
          correctIndex: 2,
          explanation: "The Ready process actively waits in the Ready queue. It will be dispatched to CPU only after the current process leaves the CPU.",
        },
        expectedAction: "move_to_cpu",
        validation: (state: any) =>
          state.processes?.some((p: any) => p.state === "running") &&
          state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "One process runs on CPU. The other waits in Ready. Ready = waiting for CPU.",
          error: "Move one process to CPU while the other stays in Ready.",
        },
      },
      {
        id: "s7-terminate-both",
        title: "Terminate Both Processes from CPU",
        description: "Dispatch and terminate both processes from the CPU state",
        stepObjectives: [
          "Apply the CPU idle rule: dispatch and terminate both processes sequentially",
          "Terminate each process from CPU state using terminate events",
          "Every process must visit the CPU before it can terminate",
        ],
        instruction: "Terminate the running process, then dispatch and terminate the waiting process.",
        instructionBullets: [
          "Click **Advance Clock** until a **Terminated** event appears for the running process. Select it and click **Terminate**.",
          "Click the waiting Ready process to select it, then click **→ CPU** to dispatch it.",
          "Click **Advance Clock** until a **Terminated** event appears for this process. Select it and click **Terminate**.",
        ],
        hint: "Termination only works from the CPU state. Each process must be dispatched to CPU, then terminated using the terminate event.",
        quiz: {
          question: "When Ready processes exist and the CPU is idle, the OS scheduler should:",
          options: [
            "Wait for new processes to arrive before dispatching existing ones",
            "Let the CPU idle to preserve energy and prevent overheating",
            "Dispatch a Ready process to the CPU immediately",
            "Discard Ready processes and recreate them each cycle",
          ],
          correctIndex: 2,
          explanation: "CPU utilization is maximized by dispatching immediately. Leaving the CPU idle while processes wait in Ready is a scheduling inefficiency.",
        },
        cpuIdleBlocked: true,
        expectedAction: "terminate_all",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 2,
        feedback: {
          success:
            "Both processes terminated from CPU state. Each had to be dispatched to CPU before it could be terminated.",
          error: "Dispatch processes to CPU and terminate them using terminate events.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 4 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
    ],
  },

  // ── Scenario 8: Different Lifecycle Lengths ────────────────────────────────
  {
    id: "s8-different-lifecycles",
    title: "Scenario 8: Different Lifecycle Lengths",
    description:
      "Two processes with different life cycle paths: one terminates directly from CPU, the other uses I/O first.",
    difficulty: "intermediate",
    estimatedTime: 12,
    objectives: [
      "One process terminates directly from CPU (short life cycle).",
      "The other moves through I/O before terminating from CPU (long life cycle).",
      "Processes can have varying life cycle lengths.",
    ],
    steps: [
      {
        id: "s8-create",
        title: "Create Both Processes",
        description: "Admit two processes into the system",
        stepObjectives: [
          "Create two processes that will follow different life cycle paths",
          "Process life cycles vary in length based on I/O needs",
          "Set up the comparison between short and long life cycles",
        ],
        instruction: "Create two processes using create_request events.",
        instructionBullets: [
          "Click **Advance Clock** until a **create_request** event appears, select it, and click **Create Process**.",
          "Repeat until you have 2 processes in the Ready queue.",
        ],
        hint: "These two processes will follow different life cycle paths",
        quiz: {
          question: "What distinguishes a ‘long’ life cycle from a ‘short’ life cycle?",
          options: [
            "Long processes have higher priority and therefore use more CPU time",
            "Long processes include one or more I/O cycles before termination; short ones go Ready → CPU → Terminated",
            "Short processes skip the Ready state entirely",
            "Long processes can be terminated from Ready state to save time",
          ],
          correctIndex: 1,
          explanation: "A short life cycle is Ready → CPU → Terminated. A long life cycle includes I/O: Ready → CPU → I/O Wait → Ready → CPU → Terminated (or more cycles).",
        },
        expectedAction: "create_two",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state !== "new" && p.state !== "terminated").length ?? 0) >= 2,
        feedback: {
          success: "Two processes ready. They will take different paths.",
          error: "Create 2 processes.",
        },
      },
      {
        id: "s8-short-terminate",
        title: "Short Life Cycle: Terminate from CPU",
        description: "Move the first process to CPU and terminate it directly",
        stepObjectives: [
          "Complete the shortest possible life cycle: Ready → CPU → Terminated",
          "Some processes complete without any I/O",
          "Practice terminating from CPU state without an I/O detour",
        ],
        instruction: "Dispatch the first process to CPU and terminate it directly — no I/O detour.",
        instructionBullets: [
          "Click a Ready process to select it, then click **→ CPU** to dispatch it.",
          "Click **Advance Clock** until a **Terminated** event appears (ignore any **io_needed** event that appears first — the terminate event will follow at tick 4).",
          "Click the **Terminated** event to select it, then click **Terminate**.",
        ],
        hint: "Ready → CPU → Terminated is the short path. The terminate event appears for running processes.",
        quiz: {
          question: "The shortest valid life cycle sequence is:",
          options: [
            "Ready → Terminated (direct, no CPU)",
            "Ready → CPU → Terminated",
            "Ready → I/O Wait → CPU → Terminated",
            "Ready → CPU → I/O Wait → Terminated (terminate from I/O)",
          ],
          correctIndex: 1,
          explanation: "The shortest path after process creation is Ready → CPU → Terminated. The New → Ready transition happens during creation and is not a separate manual step.",
        },
        cpuIdleBlocked: true,
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success:
            "First process terminated directly from CPU. Now the second will take a longer path through I/O.",
          error: "Move to CPU, wait for the terminate event, then terminate from CPU.",
        },
      },
      {
        id: "s8-long-io",
        title: "Long Life Cycle: I/O Detour then Terminate from CPU",
        description: "Move the second process through I/O before terminating",
        stepObjectives: [
          "Guide the second process through a full I/O cycle before termination",
          "Observe how I/O extends the overall life cycle length",
          "Compare the long path (Ready → CPU → I/O → Ready → CPU → Terminated) with the short path",
        ],
        instruction: "Guide the second process through the full I/O path before terminating.",
        instructionBullets: [
          "Click the remaining Ready process, then click **→ CPU**.",
          "Advance twice — an **io_needed** event appears. Select it and click **→ I/O**.",
          "Advance until **io_done** appears. Select it and click **→ Ready**.",
          "Click the Ready process and click **→ CPU** again, then advance until **Terminated** appears. Select it and click **Terminate**.",
        ],
        hint: "Follow: Ready → CPU → I/O → Ready → CPU → Terminated",
        quiz: {
          question: "After I/O completes (io_done) and the process returns to Ready, what is required before termination?",
          options: [
            "The terminate event can be used from Ready state after I/O completes",
            "The process terminates automatically after io_done when no more I/O is pending",
            "The process must be dispatched to CPU again — termination only happens from CPU (Running) state",
            "Move back to I/O Wait first, then use the terminate event from I/O Wait",
          ],
          correctIndex: 2,
          explanation: "Even after I/O, the process must return to CPU for termination. Ready → Terminated is never a valid transition.",
        },
        cpuIdleBlocked: true,
        expectedAction: "complete_io_cycle",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 2,
        feedback: {
          success:
            "Both processes completed with different lifecycle lengths. Process life cycles vary depending on I/O needs.",
          error: "Complete the second process through the I/O cycle, then terminate from CPU.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 3 },
      { id: "P1", arrivalTime: 0, burstTime: 8 },
    ],
  },

  // ── Scenario 9: Free Exploration ──────────────────────────────────────────
  {
    id: "s9-free-exploration",
    title: "Scenario 9: Free Exploration (Mixed Actions)",
    description:
      "Three processes in mixed states. Explore valid and invalid actions freely with minimal guidance.",
    difficulty: "advanced",
    estimatedTime: 15,
    objectives: [
      "All valid transitions can be explored from various starting states.",
      "Invalid transitions can be tested to reinforce understanding.",
      "All processes are terminated through valid paths.",
    ],
    steps: [
      {
        id: "s9-explore",
        title: "Explore Freely",
        description: "Use the sandbox to explore any transitions you like",
        stepObjectives: [
          "Apply all learned transitions independently without step-by-step guidance",
          "Test both valid and invalid transitions to reinforce understanding",
          "Observe system responses to different event and transition choices",
        ],
        instruction:
          "Create processes, try all kinds of transitions — both valid and invalid. Observe how the system responds. There is minimal guidance here; drawing on the earlier scenarios.",
        hint: "This is an open-ended exploration. Try anything and observe the results.",
        quiz: {
          question: "Which of the following transitions is VALID in the process life cycle?",
          options: [
            "Ready → I/O Wait (direct, without CPU)",
            "I/O Wait → CPU (direct)",
            "Ready → Terminated (direct)",
            "CPU → Ready (preemption)",
          ],
          correctIndex: 3,
          explanation: "CPU → Ready (preemption) is valid. The other three all skip required intermediate states — I/O requires CPU first, and termination requires CPU.",
        },
        expectedAction: "free_exploration",
        validation: () => true,
        feedback: {
          success: "Continue exploring, or mark the next step when you are ready.",
          error: "Keep exploring the simulation.",
        },
      },
      {
        id: "s9-complete",
        title: "Complete All Processes",
        description: "Terminate all processes you have created",
        stepObjectives: [
          "Terminate at least two processes to demonstrate life cycle mastery",
          "Apply the CPU idle rule in a free-form multi-process environment",
          "Consolidate all skills learned in the previous scenarios",
        ],
        instruction: "Terminate at least 2 processes from CPU state to demonstrate mastery.",
        instructionBullets: [
          "Dispatch a Ready process to CPU, advance the clock until a **Terminated** event appears, select it, and click **Terminate**.",
          "Repeat for a second process. Remember: handle any I/O cycles that appear along the way.",
          "Keep the CPU busy whenever a Ready process exists — the CPU idle rule still applies here.",
        ],
        hint: "Each process must be on the CPU to be terminated. Dispatch processes to CPU, then wait for terminate events.",
        quiz: {
          question: "A process can ONLY be terminated from which state?",
          options: ["Ready", "I/O Wait", "New (just created)", "CPU (Running)"],
          correctIndex: 3,
          explanation: "Termination is always from CPU (Running) state. This is a core rule of the process life cycle model.",
        },
        cpuIdleBlocked: true,
        expectedAction: "terminate_all",
        validation: (state: any) =>
          (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 2,
        feedback: {
          success: "You have demonstrated free-form mastery of process life cycle management.",
          error: "Terminate at least 2 processes from CPU state.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 6 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
      { id: "P2", arrivalTime: 0, burstTime: 8 },
    ],
  },
]

interface GuidedScenariosProps {
  persistedCompletedScenarios?: string[]
  onCompletedScenariosChange?: (completed: string[]) => void
  shortcutsEnabled?: boolean
  isActiveTab?: boolean
}

export function GuidedScenarios({
  persistedCompletedScenarios,
  onCompletedScenariosChange,
  shortcutsEnabled = true,
  isActiveTab = true,
}: GuidedScenariosProps = {}) {
  const simulationRef = useRef<SimulationHandle>(null)
  const [selectedScenario, setSelectedScenario] = useState<GuidedScenario | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [completedScenarios, setCompletedScenarios] = useState<string[]>(persistedCompletedScenarios ?? [])
  const [isScenarioActive, setIsScenarioActive] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const [latestSimStateForRender, setLatestSimStateForRender] = useState<any>(null)
  const latestSimState = useRef<any>(null)

  // Reset quiz when step changes
  useEffect(() => {
    setQuizAnswer(null)
  }, [currentStep])

  // Sync persisted state on mount
  useEffect(() => {
    if (persistedCompletedScenarios && persistedCompletedScenarios.length > 0) {
      setCompletedScenarios(persistedCompletedScenarios)
    }
  }, [persistedCompletedScenarios])

  // Notify parent when completedScenarios changes
  useEffect(() => {
    onCompletedScenariosChange?.(completedScenarios)
  }, [completedScenarios, onCompletedScenariosChange])

  const handleSimStateChange = useCallback((state: any) => {
    latestSimState.current = state
    setLatestSimStateForRender(state)
  }, [])

  useEffect(() => {
    if (!isScenarioActive) return
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isScenarioActive])

  useEffect(() => {
    if (selectedScenario && completedSteps.length === selectedScenario.steps.length && !showCompletion) {
      setShowCompletion(true)
      setIsScenarioActive(false)
      if (!completedScenarios.includes(selectedScenario.id)) {
        setCompletedScenarios((prev) => [...prev, selectedScenario.id])
      }
    }
  }, [completedSteps, selectedScenario, showCompletion, completedScenarios])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const startScenario = (scenario: GuidedScenario) => {
    setSelectedScenario(scenario)
    setCurrentStep(0)
    setCompletedSteps([])
    setIsScenarioActive(true)
    setElapsedTime(0)
    setShowHint(false)
    setShowCompletion(false)
    setQuizAnswer(null)
  }

  const [stepAlert, setStepAlert] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const completeStep = (stepId: string) => {
    if (completedSteps.includes(stepId)) return
    const step = selectedScenario?.steps.find((s) => s.id === stepId)
    if (!step) return

    // Gate 1: quiz must be answered correctly
    if (step.quiz && quizAnswer !== step.quiz.correctIndex) {
      setStepAlert({
        message: "Answer the knowledge check question correctly before completing this step.",
        type: "error",
      })
      setTimeout(() => setStepAlert(null), 5000)
      return
    }

    // Gate 2: CPU idle rule
    const simState = latestSimState.current
    if (step.cpuIdleBlocked && simState) {
      const hasReady = simState.processes?.some((p: any) => p.state === "ready")
      const hasRunning = simState.processes?.some((p: any) => p.state === "running")
      if (hasReady && !hasRunning) {
        setStepAlert({
          message:
            "The CPU should not remain idle while runnable processes exist in the Ready queue. Dispatch a Ready process to the CPU before continuing.",
          type: "error",
        })
        setTimeout(() => setStepAlert(null), 6000)
        return
      }
    }

    // Gate 3: simulation validation
    if (step.validation && simState) {
      const isValid = step.validation(simState)
      if (!isValid) {
        setStepAlert({ message: step.feedback.error, type: "error" })
        setTimeout(() => setStepAlert(null), 5000)
        return
      }
    }

    setStepAlert({ message: step.feedback.success, type: "success" })
    setTimeout(() => setStepAlert(null), 5000)
    setCompletedSteps((prev) => [...prev, stepId])
    if (selectedScenario && currentStep < selectedScenario.steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const resetScenario = () => {
    setSelectedScenario(null)
    setCurrentStep(0)
    setCompletedSteps([])
    setIsScenarioActive(false)
    setElapsedTime(0)
    setShowHint(false)
    setShowCompletion(false)
    setQuizAnswer(null)
  }

  const goBackToScenarios = () => {
    resetScenario()
  }

  const goToNextScenario = () => {
    if (!selectedScenario) return
    const currentIndex = GUIDED_SCENARIOS.findIndex((s) => s.id === selectedScenario.id)
    const nextIndex = currentIndex + 1
    if (nextIndex < GUIDED_SCENARIOS.length) {
      startScenario(GUIDED_SCENARIOS[nextIndex])
    }
  }

  const allScenariosCompleted = completedScenarios.length === GUIDED_SCENARIOS.length

  // Keyboard shortcuts — simulation controls delegate to the embedded sim via ref;
  // scenario nav shortcuts are scoped to when a scenario is active.
  const scenarioActiveRef = useRef(isScenarioActive)
  useEffect(() => { scenarioActiveRef.current = isScenarioActive }, [isScenarioActive])

  const simShortcuts: ShortcutAction[] = useMemo(() => [
    { key: "a", label: "Advance Clock", description: "Advance simulation clock one tick", category: "Simulation", action: () => simulationRef.current?.advanceClock() },
    { key: "z", label: "Step Back", description: "Undo last clock advance", category: "Simulation", action: () => simulationRef.current?.stepBack() },
    { key: "c", label: "Create Process", description: "Create a new process", category: "Simulation", action: () => simulationRef.current?.createProcess() },
    { key: "e", label: "Select Next Event", description: "Cycle through active events in the queue", category: "Simulation", action: () => simulationRef.current?.selectNextEvent() },
    { key: "Escape", label: "Deselect", description: "Cancel current process / event selection", category: "Simulation", action: () => simulationRef.current?.cancelSelection() },
    { key: "g", label: "Dispatch to CPU", description: "Move selected process to the CPU", category: "Simulation", action: () => simulationRef.current?.moveSelectedToState("running") },
    { key: "i", label: "Move to I/O", description: "Move selected process to I/O Wait", category: "Simulation", action: () => simulationRef.current?.moveSelectedToState("blocked") },
    { key: "r", label: "Move to Ready", description: "Preempt selected process back to Ready", category: "Simulation", action: () => simulationRef.current?.moveSelectedToState("ready") },
    { key: "t", label: "Terminate", description: "Terminate the selected process", category: "Simulation", action: () => simulationRef.current?.moveSelectedToState("terminated") },
  ], [])

  // Not memoized: `completeStep` closes over `quizAnswer` which changes each render;
  // memoizing would produce a stale closure that ignores quiz state updates.
  const scenarioNavShortcuts: ShortcutAction[] = [
    {
      key: "Enter",
      label: "Complete Step",
      description: "Check and complete the current scenario step",
      category: "Scenarios",
      action: () => {
        if (!scenarioActiveRef.current) return
        const step = selectedScenario?.steps[currentStep]
        if (step) completeStep(step.id)
      },
    },
    {
      key: "h",
      label: "Toggle Hint",
      description: "Show or hide the step hint",
      category: "Scenarios",
      action: () => { if (scenarioActiveRef.current) setShowHint((prev) => !prev) },
    },
    {
      key: "b",
      label: "Go Back",
      description: "Return to the scenario list",
      category: "Scenarios",
      action: () => { if (scenarioActiveRef.current) goBackToScenarios() },
    },
    {
      key: "r",
      shift: true,
      label: "Reset Scenario",
      description: "Reset and restart the current scenario",
      category: "Scenarios",
      action: () => { if (scenarioActiveRef.current) resetScenario() },
    },
  ]

  useKeyboardShortcuts(
    [...simShortcuts, ...scenarioNavShortcuts],
    shortcutsEnabled && isActiveTab,
  )

  if (showCompletion && selectedScenario) {
    const currentIndex = GUIDED_SCENARIOS.findIndex((s) => s.id === selectedScenario.id)
    const isLastScenario = currentIndex === GUIDED_SCENARIOS.length - 1

    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-700">
              <PartyPopper className="h-6 w-6" />
              Congratulations!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg text-green-800">
              Excellent work! You have successfully completed the <strong>{selectedScenario.title}</strong> guided
              scenario.
            </p>
            <p className="text-muted-foreground">
              Time taken: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
            </p>

            {allScenariosCompleted ? (
              <Alert className="border-blue-200 bg-blue-50">
                <PartyPopper className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Outstanding achievement!</strong> You have completed all guided scenarios. You&apos;re now
                  ready to test your knowledge in the <strong>Evaluation</strong> section.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-muted-foreground">
                Progress: {completedScenarios.length} of {GUIDED_SCENARIOS.length} scenarios completed
              </p>
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={goBackToScenarios} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Scenarios
              </Button>
              <Button onClick={resetScenario} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Scenario
              </Button>
              {!isLastScenario && (
                <Button onClick={goToNextScenario} className="bg-green-600 hover:bg-green-700">
                  Next Scenario
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedScenario && isScenarioActive) {
    const currentStepData = selectedScenario.steps[currentStep]
    const progress = (completedSteps.length / selectedScenario.steps.length) * 100

    const isQuizPassed = !currentStepData.quiz || quizAnswer === currentStepData.quiz.correctIndex
    const isCpuIdleViolation =
      currentStepData.cpuIdleBlocked &&
      latestSimStateForRender &&
      latestSimStateForRender.processes?.some((p: any) => p.state === "ready") &&
      !latestSimStateForRender.processes?.some((p: any) => p.state === "running")
    const canComplete = isQuizPassed && !isCpuIdleViolation

    return (
      <div className="space-y-6">
        {/* Scenario Header */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base break-words">
                  <BookOpen className="h-5 w-5 flex-shrink-0" />
                  {selectedScenario.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedScenario.description}</p>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, "0")}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Elapsed Time</div>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {selectedScenario.steps.length}
            </div>
          </CardHeader>
        </Card>

        {/* Current Step */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {currentStepData.title}
            </CardTitle>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step Objectives (Issue 2) */}
            {currentStepData.stepObjectives && currentStepData.stepObjectives.length > 0 && (
              <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-700 flex-shrink-0" />
                  <span className="text-sm font-semibold text-green-800">Step Objectives</span>
                </div>
                <ul className="space-y-1">
                  {currentStepData.stepObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                      <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instruction */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
              <AlertDescription className="text-blue-800">
                <strong>Instructions:</strong>
                {currentStepData.instructionBullets ? (
                  <>
                    {" "}{currentStepData.instruction}
                    <ol className="mt-2 space-y-1.5 list-none">
                      {currentStepData.instructionBullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-blue-600 flex-shrink-0 mt-0.5">{i + 1}.</span>
                          <span>{renderBold(bullet)}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <span> {currentStepData.instruction}</span>
                )}
              </AlertDescription>
            </Alert>

            {/* Hint */}
            {currentStepData.hint && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Lightbulb className="h-4 w-4" />
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                {showHint && (
                  <Alert className="border-yellow-200 bg-yellow-50 flex-1">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Hint:</strong> {currentStepData.hint}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Knowledge Check Quiz */}
            {currentStepData.quiz && (
              <div className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="h-4 w-4 text-purple-700 flex-shrink-0" />
                  <span className="text-sm font-semibold text-purple-800">Knowledge Check</span>
                  {isQuizPassed && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs ml-auto">
                      <CheckCircle className="h-3 w-3 mr-1" /> Correct
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-purple-900 mb-3">{currentStepData.quiz.question}</p>
                <div className="space-y-2">
                  {currentStepData.quiz.options.map((option, i) => {
                    const isSelected = quizAnswer === i
                    const isCorrect = i === currentStepData.quiz!.correctIndex
                    const showResult = quizAnswer !== null
                    let optionClass =
                      "w-full text-left p-2 rounded border text-sm transition-colors cursor-pointer "
                    if (showResult) {
                      if (isCorrect) {
                        optionClass += "bg-green-100 border-green-400 text-green-900 font-medium"
                      } else if (isSelected && !isCorrect) {
                        optionClass += "bg-red-100 border-red-400 text-red-900"
                      } else {
                        optionClass += "bg-white border-gray-200 text-gray-500"
                      }
                    } else {
                      optionClass += isSelected
                        ? "bg-purple-100 border-purple-400 text-purple-900"
                        : "bg-white border-gray-200 text-gray-800 hover:bg-purple-50 hover:border-purple-300"
                    }
                    return (
                      <button
                        key={i}
                        className={optionClass}
                        onClick={() => {
                          if (quizAnswer === null || !isQuizPassed) setQuizAnswer(i)
                        }}
                        disabled={isQuizPassed}
                      >
                        <span className="flex items-start gap-2">
                          <span className="font-mono text-xs mt-0.5 flex-shrink-0">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <span>{option}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                {quizAnswer !== null && !isQuizPassed && (
                  <p className="text-xs text-red-700 mt-2">
                    Incorrect. {currentStepData.quiz.explanation}
                  </p>
                )}
                {isQuizPassed && (
                  <p className="text-xs text-green-700 mt-2">{currentStepData.quiz.explanation}</p>
                )}
              </div>
            )}

            {/* CPU idle warning */}
            {isCpuIdleViolation && (
              <Alert className="border-orange-200 bg-orange-50">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Scheduling Rule:</strong> The CPU should not remain idle while runnable processes exist in
                  the Ready queue. Dispatch a Ready process to the CPU before continuing.
                </AlertDescription>
              </Alert>
            )}

            {/* Feedback */}
            {stepAlert && (
              <Alert
                className={`${stepAlert.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
              >
                <Info
                  className={`h-4 w-4 ${stepAlert.type === "error" ? "text-red-600" : "text-green-600"}`}
                />
                <AlertDescription className={stepAlert.type === "error" ? "text-red-800" : "text-green-800"}>
                  {stepAlert.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => completeStep(currentStepData.id)}
                disabled={!canComplete}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Check & Complete Step
              </Button>
              <Button onClick={resetScenario} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Simulation
              </Button>
              <Button onClick={goBackToScenarios} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simulation */}
        <ProcessSchedulingSimulation
          ref={simulationRef}
          onStateChange={handleSimStateChange}
          isActiveTab={false}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="panel-title flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guided Learning Scenarios
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    A sequence of step-by-step guided lessons covering process life cycle management, each pairing
                    an instruction with a knowledge check and a live simulation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {GUIDED_SCENARIOS.map((scenario) => {
          const isCompleted = completedScenarios.includes(scenario.id)
          return (
            <Card key={scenario.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <Badge className={getDifficultyColor(scenario.difficulty)}>{scenario.difficulty}</Badge>
                      {isCompleted && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{scenario.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />~{scenario.estimatedTime}m
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Objectives:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {scenario.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {scenario.initialProcesses.length} processes
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-4 w-4" />
                    {scenario.steps.length} guided steps
                  </div>
                </div>

                <Button onClick={() => startScenario(scenario)} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  {isCompleted ? "Restart Guided Learning" : "Start Guided Learning"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
