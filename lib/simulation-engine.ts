"use client"

export interface SimulationProcess {
  id: number
  name: string
  // "new" is the pre-admission slot (a process that has not yet been created).
  // It is never shown as a life-cycle state — the real states are ready/running/blocked/terminated.
  state: "new" | "ready" | "running" | "blocked" | "terminated"
  arrivalTime: number
  burstTime: number
  remainingTime: number
  priority?: number
  ioTime?: number
  history: string[]
  stateTime: { ready: number; running: number; blocked: number }
  // Clock time at which the process entered its current Ready spell (used to enforce
  // the "no dispatch in the same cycle as admission" scheduling rule).
  readyEnteredTime?: number
}

export interface SimulationEvent {
  id: number
  name: "create_request" | "io_needed" | "io_done" | "terminate"
  time: number
  processId: number
  type: "external" | "internal"
  state: "active" | "done" | "killed"
}

export interface InvalidTransitionRecord {
  time: number
  processName: string
  from: string
  to: string
  reason: string
}

export interface SimulationState {
  processes: SimulationProcess[]
  events: SimulationEvent[]
  currentTime: number
  currentProcess: number | null
  selectedEvent: number | null
  actionLog: Array<{
    time: number
    message: string
    type: "info" | "success" | "error"
  }>
  metrics: {
    validTransitions: number
    invalidAttempts: number
    // Detailed record of every rejected transition the user attempted, kept so the
    // Evaluation engine can score against mistakes as well as correct actions.
    invalidTransitionLog: InvalidTransitionRecord[]
    stateTimeTracking: { [processName: string]: { ready: number; running: number; blocked: number } }
  }
}

export interface SimulationResponse {
  success: boolean
  message: string
}

export interface EngineSnapshot {
  state: SimulationState
  processCreations: number
  lastCreateRequestTime: number
  runningStartTimes: [number, number][]
}

const emptyMetrics = () => ({
  validTransitions: 0,
  invalidAttempts: 0,
  invalidTransitionLog: [] as InvalidTransitionRecord[],
  stateTimeTracking: {} as { [processName: string]: { ready: number; running: number; blocked: number } },
})

export class SimulationEngine {
  private state: SimulationState
  private maxProcesses = 5
  private processCreations = 0
  private runningStartTimes: Map<number, number> = new Map()
  private lastCreateRequestTime = 0

  constructor() {
    this.state = {
      processes: [],
      events: [],
      currentTime: 0,
      currentProcess: null,
      selectedEvent: null,
      actionLog: [],
      metrics: emptyMetrics(),
    }
    this.initializeProcesses()
  }

  private initializeProcesses() {
    for (let i = 0; i < this.maxProcesses; i++) {
      this.state.processes.push({
        id: i,
        name: `P${i}`,
        state: "new",
        arrivalTime: 0,
        burstTime: Math.floor(Math.random() * 8) + 2,
        remainingTime: 0,
        priority: Math.floor(Math.random() * 3) + 1,
        history: [],
        stateTime: { ready: 0, running: 0, blocked: 0 },
      })
    }
  }

  getState(): SimulationState {
    return { ...this.state }
  }

  reset() {
    this.state = {
      processes: [],
      events: [],
      currentTime: 0,
      currentProcess: null,
      selectedEvent: null,
      actionLog: [],
      metrics: emptyMetrics(),
    }
    this.processCreations = 0
    this.lastCreateRequestTime = 0
    this.runningStartTimes.clear()
    this.initializeProcesses()
    this.addLogEntry("Simulation reset", "info")
  }

  private addLogEntry(message: string, type: "info" | "success" | "error" = "info", isUserAction = false) {
    if (isUserAction || (!message.includes("Clock advanced") && !message.includes("Time advanced"))) {
      this.state.actionLog.push({
        time: this.state.currentTime,
        message,
        type,
      })
    }
  }

  // Records a rejected transition: bumps the count, appends a detailed record for the
  // Evaluation engine, and logs the reason for the learner.
  private recordInvalid(process: SimulationProcess, from: string, to: string, reason: string): SimulationResponse {
    this.state.metrics.invalidAttempts++
    this.state.metrics.invalidTransitionLog.push({
      time: this.state.currentTime,
      processName: process.name,
      from,
      to,
      reason,
    })
    this.addLogEntry(reason, "error", true)
    return { success: false, message: reason }
  }

  selectEvent(eventId: number): SimulationResponse {
    if (eventId >= 0 && eventId < this.state.events.length) {
      this.state.selectedEvent = eventId
      this.addLogEntry(`Selected event: ${this.state.events[eventId].name}`, "info", true)
      return { success: true, message: "Event selected" }
    }
    return { success: false, message: "Invalid event ID" }
  }

  deselectEvent() {
    this.state.selectedEvent = null
    this.addLogEntry("Event deselected", "info", true)
  }

  createProcess(): SimulationResponse {
    if (this.state.selectedEvent === null) {
      return { success: false, message: "No event selected" }
    }

    const event = this.state.events[this.state.selectedEvent]
    if (event.name !== "create_request") {
      return { success: false, message: "Selected event is not a process creation request" }
    }

    const processId = event.processId
    const process = this.state.processes[processId]

    if (process.state !== "new") {
      return { success: false, message: "Process already exists" }
    }

    process.state = "ready"
    process.arrivalTime = this.state.currentTime
    process.readyEnteredTime = this.state.currentTime
    process.remainingTime = process.burstTime
    process.history.push("ready")

    event.state = "done"
    this.state.selectedEvent = null

    this.state.metrics.validTransitions++
    this.addLogEntry(`Created process ${process.name} -> Ready`, "success", true)
    return { success: true, message: `Process ${process.name} created successfully` }
  }

  moveProcess(processId: number, destination: "ready" | "running" | "blocked" | "terminated"): SimulationResponse {
    const process = this.state.processes[processId]
    if (!process) {
      return { success: false, message: "Process not found" }
    }

    const currentState = process.state
    let response: SimulationResponse

    switch (destination) {
      case "running":
        // Ready -> CPU (CPU allocation)
        if (currentState !== "ready") {
          return this.recordInvalid(
            process,
            currentState,
            "running",
            `Invalid transition: ${process.name} is in ${currentState} state. Only Ready → CPU is valid.`,
          )
        }
        // Scheduling rule: a newly admitted process enters the Ready queue and is dispatched
        // on a subsequent scheduling decision — it cannot be dispatched in the same clock
        // cycle in which it was created. It must spend at least one cycle in Ready first.
        if (process.readyEnteredTime === this.state.currentTime && process.history.length === 1) {
          return this.recordInvalid(
            process,
            currentState,
            "running",
            `A newly created process enters the Ready queue and cannot be dispatched to the CPU in the same clock cycle. Advance the clock once, then dispatch ${process.name}.`,
          )
        }
        response = this.runProcess(processId)
        break
      case "ready":
        // CPU -> Ready (preemption) or I/O -> Ready (I/O completion)
        if (currentState === "blocked") {
          response = this.moveToReady(processId)
        } else if (currentState === "running") {
          response = this.preemptProcess(processId)
        } else {
          return this.recordInvalid(
            process,
            currentState,
            "ready",
            `Invalid transition: ${process.name} is in ${currentState} state. Only CPU → Ready or I/O → Ready are valid.`,
          )
        }
        break
      case "blocked":
        // CPU -> I/O (I/O request)
        if (currentState !== "running") {
          return this.recordInvalid(
            process,
            currentState,
            "blocked",
            `Invalid transition: ${process.name} is in ${currentState} state. Only CPU → I/O is valid.`,
          )
        }
        response = this.moveToIO(processId)
        break
      case "terminated":
        // CPU -> Terminated (process completes execution)
        if (currentState !== "running") {
          return this.recordInvalid(
            process,
            currentState,
            "terminated",
            `Invalid transition: ${process.name} is in ${currentState} state. Only CPU → Terminated is valid. Termination can only happen while the process is executing on the CPU.`,
          )
        }
        response = this.terminateProcess(processId)
        break
      default:
        response = { success: false, message: "Invalid destination state" }
    }

    if (!response.success) {
      this.recordInvalid(process, currentState, destination, response.message)
    } else {
      this.state.metrics.validTransitions++
      this.addLogEntry(`Moved ${process.name} from ${currentState} to ${destination}`, "success", true)
    }

    return response
  }

  private runProcess(processId: number): SimulationResponse {
    const process = this.state.processes[processId]

    if (process.state !== "ready") {
      return { success: false, message: `Process ${process.name} is not in Ready state` }
    }

    if (this.state.currentProcess !== null) {
      return { success: false, message: "CPU is already occupied. Only one process can run at a time." }
    }

    process.state = "running"
    process.history.push("running")
    this.state.currentProcess = processId

    this.runningStartTimes.set(processId, this.state.currentTime)

    return { success: true, message: `Process ${process.name} is now running on CPU` }
  }

  private moveToReady(processId: number): SimulationResponse {
    const process = this.state.processes[processId]

    if (process.state !== "blocked") {
      return { success: false, message: `Process ${process.name} is not in I/O state` }
    }

    if (this.state.selectedEvent !== null) {
      const event = this.state.events[this.state.selectedEvent]
      if (event.name !== "io_done" || event.processId !== processId) {
        return {
          success: false,
          message: "I/O completion requires selecting the io_done event for this process.",
        }
      }
      event.state = "done"
      this.state.selectedEvent = null
    } else {
      return {
        success: false,
        message: "I/O completion requires an io_done event. Select the io_done event first.",
      }
    }

    process.state = "ready"
    process.readyEnteredTime = this.state.currentTime
    process.history.push("ready")

    return { success: true, message: `Process ${process.name} moved to Ready (I/O completed)` }
  }

  private moveToIO(processId: number): SimulationResponse {
    const process = this.state.processes[processId]

    if (process.state !== "running") {
      return { success: false, message: `Process ${process.name} is not currently running on CPU` }
    }

    if (this.state.selectedEvent === null) {
      return {
        success: false,
        message: "I/O request requires selecting an io_needed event first.",
      }
    }

    const event = this.state.events[this.state.selectedEvent]
    if (event.name !== "io_needed" || event.processId !== processId) {
      return {
        success: false,
        message: "Select the io_needed event for this process to move it to I/O.",
      }
    }

    process.state = "blocked"
    process.history.push("blocked")
    event.state = "done"
    this.state.selectedEvent = null

    if (this.state.currentProcess === processId) {
      this.state.currentProcess = null
    }

    return {
      success: true,
      message: `Process ${process.name} moved to I/O (waiting for I/O completion)`,
    }
  }

  private terminateProcess(processId: number): SimulationResponse {
    const process = this.state.processes[processId]

    if (process.state !== "running") {
      return { success: false, message: `Process ${process.name} can only be terminated from CPU (Running) state` }
    }

    if (this.state.selectedEvent === null) {
      return {
        success: false,
        message: "Process termination requires selecting a terminate event first.",
      }
    }

    const event = this.state.events[this.state.selectedEvent]
    if (event.name !== "terminate" || event.processId !== processId) {
      return {
        success: false,
        message: "Select the terminate event for this process to terminate it.",
      }
    }

    process.state = "terminated"
    process.history.push("terminated")
    event.state = "done"
    this.state.selectedEvent = null

    // Process was on CPU — free it
    if (this.state.currentProcess === processId) {
      this.state.currentProcess = null
    }

    // Mark related events as killed
    this.state.events.forEach((e) => {
      if (e.processId === processId && e.state === "active") {
        e.state = "killed"
      }
    })

    return {
      success: true,
      message: `Process ${process.name} terminated from CPU (execution completed)`,
    }
  }

  private preemptProcess(processId: number): SimulationResponse {
    const process = this.state.processes[processId]

    if (process.state !== "running") {
      return { success: false, message: `Process ${process.name} is not currently running on CPU` }
    }

    process.state = "ready"
    process.readyEnteredTime = this.state.currentTime
    process.history.push("ready")

    if (this.state.currentProcess === processId) {
      this.state.currentProcess = null
    }

    return {
      success: true,
      message: `Process ${process.name} moved from CPU to Ready`,
    }
  }

  advanceClock(): SimulationResponse {
    this.state.currentTime++
    this.updateStateTime()
    this.generateEvents()
    this.addLogEntry(`Clock advanced to ${this.state.currentTime}`, "info", true)
    return { success: true, message: `Time advanced to ${this.state.currentTime}` }
  }

  private updateStateTime() {
    this.state.processes.forEach((process) => {
      if (process.state === "ready" || process.state === "running" || process.state === "blocked") {
        if (!process.stateTime) {
          process.stateTime = { ready: 0, running: 0, blocked: 0 }
        }
        if (process.state === "ready") process.stateTime.ready++
        if (process.state === "running") process.stateTime.running++
        if (process.state === "blocked") process.stateTime.blocked++

        // Update metrics tracking
        this.state.metrics.stateTimeTracking[process.name] = { ...process.stateTime }
      }
    })
  }

  private generateEvents() {
    this.generateExternalEvents()
    this.generateInternalEvents()
  }

  private generateExternalEvents() {
    const possibleEvents: SimulationEvent[] = []

    // Generate create_request events
    if (this.processCreations < this.maxProcesses) {
      const timeSinceLastCreate = this.state.currentTime - this.lastCreateRequestTime
      if (timeSinceLastCreate >= 2 && (timeSinceLastCreate >= 4 || Math.random() < 0.6)) {
        const eventId = this.state.events.length
        possibleEvents.push({
          id: eventId,
          name: "create_request",
          time: this.state.currentTime,
          processId: this.processCreations,
          type: "external",
          state: "active",
        })
        this.lastCreateRequestTime = this.state.currentTime
      }
    }

    // Generate io_needed events for running processes
    const runningProcesses = this.state.processes.filter((p) => p.state === "running")
    runningProcesses.forEach((process) => {
      const startTime = this.runningStartTimes.get(process.id)
      if (startTime !== undefined) {
        const timeRunning = this.state.currentTime - startTime

        // Generate io_needed exactly at 2 clock advances after entering CPU
        const hasIOEvent = this.state.events.some(
          (e) => e.processId === process.id && e.state === "active" && e.name === "io_needed",
        )
        if (!hasIOEvent && timeRunning === 2) {
          possibleEvents.push({
            id: this.state.events.length + possibleEvents.length,
            name: "io_needed",
            time: this.state.currentTime,
            processId: process.id,
            type: "internal",
            state: "active",
          })
        }
      }
    })

    // Generate terminate event for a running process that has no pending io_needed event
    // (terminate only from CPU — after I/O cycle or after running long enough)
    runningProcesses.forEach((process) => {
      const hasTerminateEvent = this.state.events.some(
        (e) => e.processId === process.id && e.state === "active" && e.name === "terminate",
      )
      const hasIOEvent = this.state.events.some(
        (e) => e.processId === process.id && e.state === "active" && e.name === "io_needed",
      )
      const startTime = this.runningStartTimes.get(process.id)
      const timeRunning = startTime !== undefined ? this.state.currentTime - startTime : 0
      // Eligible when: returned from I/O (no pending io_needed) OR running long enough regardless
      // Note: timeRunning >= 4 intentionally allows terminate alongside a pending io_needed so the
      // user can choose to terminate instead of servicing the I/O (shortest-path scenario).
      const eligible = (process.history.includes("blocked") && !hasIOEvent) || timeRunning >= 4
      if (!hasTerminateEvent && eligible) {
        possibleEvents.push({
          id: this.state.events.length + possibleEvents.length,
          name: "terminate",
          time: this.state.currentTime,
          processId: process.id,
          type: "external",
          state: "active",
        })
      }
    })

    // Add events
    possibleEvents.forEach((event) => {
      if (event.name === "create_request") {
        this.processCreations++
      }
      this.state.events.push(event)
    })
  }

  private generateInternalEvents() {
    const blockedProcesses = this.state.processes.filter((p) => p.state === "blocked")
    blockedProcesses.forEach((process) => {
      const hasActiveIODoneEvent = this.state.events.some(
        (e) => e.processId === process.id && e.state === "active" && e.name === "io_done",
      )

      if (!hasActiveIODoneEvent && Math.random() < 0.4) {
        const eventId = this.state.events.length
        this.state.events.push({
          id: eventId,
          name: "io_done",
          time: this.state.currentTime,
          processId: process.id,
          type: "internal",
          state: "active",
        })
      }
    })
  }

  /**
   * Load a scenario with specific initial states.
   * Each entry specifies a process name and its starting state.
   * Events needed for the initial states are auto-generated.
   */
  loadScenario(
    processes: Array<{
      name: string
      initialState: "ready" | "running" | "blocked"
      burstTime?: number
    }>,
  ) {
    // Reset to clean state
    this.state = {
      processes: [],
      events: [],
      currentTime: 0,
      currentProcess: null,
      selectedEvent: null,
      actionLog: [],
      metrics: emptyMetrics(),
    }
    this.processCreations = 0
    this.lastCreateRequestTime = 0
    this.runningStartTimes.clear()

    // Create exactly the requested number of process slots
    for (let i = 0; i < Math.max(processes.length, this.maxProcesses); i++) {
      this.state.processes.push({
        id: i,
        name: `P${i}`,
        state: "new",
        arrivalTime: 0,
        burstTime: processes[i]?.burstTime ?? Math.floor(Math.random() * 8) + 2,
        remainingTime: 0,
        priority: 1,
        history: [],
        stateTime: { ready: 0, running: 0, blocked: 0 },
      })
    }

    // Place each requested process into its initial state
    for (let i = 0; i < processes.length; i++) {
      const cfg = processes[i]
      const proc = this.state.processes[i]
      proc.name = cfg.name
      proc.burstTime = cfg.burstTime ?? proc.burstTime
      proc.remainingTime = proc.burstTime
      proc.arrivalTime = 0
      this.processCreations++

      // Move to ready first (all processes must pass through ready)
      proc.state = "ready"
      proc.readyEnteredTime = 0
      proc.history.push("ready")

      if (cfg.initialState === "running") {
        if (this.state.currentProcess === null) {
          proc.state = "running"
          proc.history.push("running")
          this.state.currentProcess = i
          this.runningStartTimes.set(i, 0)
        }
        // If CPU already occupied, leave in ready
      } else if (cfg.initialState === "blocked") {
        proc.state = "blocked"
        proc.history.push("blocked")
        // Generate an io_done event so the user can move it back to ready
        this.state.events.push({
          id: this.state.events.length,
          name: "io_done",
          time: 0,
          processId: i,
          type: "internal",
          state: "active",
        })
      }

      // Generate standard events for the process
      // io_needed is only relevant for running processes
      this.state.events.push({
        id: this.state.events.length,
        name: "io_needed",
        time: 0,
        processId: i,
        type: "internal",
        state: cfg.initialState === "running" ? "active" : "killed",
      })
      // terminate is only valid from running (CPU) state
      this.state.events.push({
        id: this.state.events.length,
        name: "terminate",
        time: 0,
        processId: i,
        type: "external",
        state: cfg.initialState === "running" ? "active" : "killed",
      })
    }

    this.addLogEntry("Scenario loaded", "info")
  }

  snapshot(): EngineSnapshot {
    return {
      state: JSON.parse(JSON.stringify(this.state)),
      processCreations: this.processCreations,
      lastCreateRequestTime: this.lastCreateRequestTime,
      runningStartTimes: Array.from(this.runningStartTimes.entries()),
    }
  }

  restore(snap: EngineSnapshot): void {
    this.state = JSON.parse(JSON.stringify(snap.state))
    this.processCreations = snap.processCreations
    this.lastCreateRequestTime = snap.lastCreateRequestTime
    this.runningStartTimes = new Map(snap.runningStartTimes)
  }

  getProcessesByState(state: SimulationProcess["state"]): SimulationProcess[] {
    return this.state.processes.filter((p) => p.state === state)
  }

  getActiveEvents(): SimulationEvent[] {
    return this.state.events.filter((e) => e.state === "active")
  }

  getEventsByType(type: "external" | "internal"): SimulationEvent[] {
    return this.state.events.filter((e) => e.type === type && e.state === "active")
  }
}
