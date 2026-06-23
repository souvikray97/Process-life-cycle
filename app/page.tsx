"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ProcessSchedulingSimulation, SIMULATION_SHORTCUT_DEFS } from "@/components/process-scheduling-simulation"
import { GuidedScenarios, SCENARIO_SHORTCUT_DEFS } from "@/components/guided-scenarios"
import { ScenarioEvaluation } from "@/components/scenario-evaluation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { useKeyboardShortcuts, type ShortcutAction, type ShortcutDef } from "@/hooks/use-keyboard-shortcuts"
import {
  loadPersistedState,
  savePersistedState,
  clearPersistedState,
  type PersistedState,
} from "@/hooks/use-persistence"
import { RotateCcw } from "lucide-react"

export default function OSVirtualLab() {
  const [hydrated, setHydrated] = useState(false)
  const [currentTab, setCurrentTab] = useState("sandbox")
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true)
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false)
  const [evaluationResults, setEvaluationResults] = useState<any[]>([])
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([])

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadPersistedState()
    if (saved) {
      setCurrentTab(saved.currentTab)
      setShortcutsEnabled(saved.shortcutsEnabled)
      setEvaluationResults(saved.evaluationResults ?? [])
      setCompletedScenarios(saved.guidedScenariosProgress?.completedScenarios ?? [])
    }
    setHydrated(true)
  }, [])

  // Auto-save on meaningful state changes (debounced)
  const getStateForSave = useCallback((): PersistedState => ({
    storageVersion: 1,
    currentTab,
    shortcutsEnabled,
    evaluationResults,
    tutorialProgress: { currentStep: 0, completedSteps: [] },
    guidedScenariosProgress: { completedScenarios },
    savedAt: new Date().toISOString(),
  }), [currentTab, shortcutsEnabled, evaluationResults, completedScenarios])

  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => {
      savePersistedState(getStateForSave())
    }, 500)
    return () => clearTimeout(timer)
  }, [hydrated, getStateForSave])

  const handleResetAll = () => {
    if (window.confirm("This will clear all saved data including evaluation results, scenario progress, and preferences. Continue?")) {
      clearPersistedState()
      setCurrentTab("sandbox")
      setShortcutsEnabled(true)
      setEvaluationResults([])
      setCompletedScenarios([])
    }
  }

  const shortcuts: ShortcutAction[] = useMemo(
    () => [
      {
        key: "1",
        alt: true,
        label: "Sandbox Tab",
        description: "Switch to the Sandbox tab",
        category: "Navigation",
        action: () => setCurrentTab("sandbox"),
      },
      {
        key: "2",
        alt: true,
        label: "Scenarios Tab",
        description: "Switch to the Guided Scenarios tab",
        category: "Navigation",
        action: () => setCurrentTab("guided-scenarios"),
      },
      {
        key: "3",
        alt: true,
        label: "Evaluation Tab",
        description: "Switch to the Evaluation tab",
        category: "Navigation",
        action: () => setCurrentTab("evaluation"),
      },
      {
        key: "?",
        shift: true,
        label: "Shortcuts Dialog",
        description: "Open this keyboard shortcuts reference",
        category: "Navigation",
        action: () => setShortcutsDialogOpen((prev) => !prev),
      },
    ],
    [],
  )

  const allShortcutDefs: ShortcutDef[] = useMemo(
    () => [...shortcuts, ...SIMULATION_SHORTCUT_DEFS, ...SCENARIO_SHORTCUT_DEFS],
    [shortcuts],
  )

  useKeyboardShortcuts(shortcuts, shortcutsEnabled)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 max-w-7xl">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                Process Life Cycle Management
              </h1>
              <div className="flex items-center gap-2">
                <KeyboardShortcutsDialog
                  shortcuts={allShortcutDefs}
                  enabled={shortcutsEnabled}
                  onToggle={setShortcutsEnabled}
                  open={shortcutsDialogOpen}
                  onOpenChange={setShortcutsDialogOpen}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleResetAll} className="text-xs sm:text-sm gap-1" aria-label="Reset all saved data">
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Reset All</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all saved data and return to initial state</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto bg-gray-300 gap-1 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="guided-scenarios"
                    className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
                      currentTab === "guided-scenarios"
                        ? "bg-white text-black border border-blue-300 shadow-sm"
                        : "bg-gray-400/60 text-gray-800 hover:bg-gray-400"
                    }`}
                  >
                    <span className="hidden sm:inline">Scenarios</span>
                    <span className="sm:hidden">Guided</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    A sequence of step-by-step guided lessons. Each step pairs an instruction with a
                    knowledge check and live simulation, building from a single process through I/O,
                    preemption and managing multiple processes.
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="sandbox"
                    className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
                      currentTab === "sandbox"
                        ? "bg-white text-black border border-blue-300 shadow-sm"
                        : "bg-gray-400/60 text-gray-800 hover:bg-gray-400"
                    }`}
                  >
                    <span className="hidden sm:inline">Sandbox</span>
                    <span className="sm:hidden">Sand</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    A free-form workspace where processes can be created and driven through every
                    life-cycle state. Events, an action log and state-presence metrics update live as
                    transitions are performed.
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="evaluation"
                    className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
                      currentTab === "evaluation"
                        ? "bg-white text-black border border-blue-300 shadow-sm"
                        : "bg-gray-400/60 text-gray-800 hover:bg-gray-400"
                    }`}
                  >
                    <span className="hidden sm:inline">Evaluation</span>
                    <span className="sm:hidden">Eval</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Timed, scored assessments that measure understanding of process states, valid
                    transitions and event-driven changes. Each attempt produces a detailed performance
                    breakdown that can be exported.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TabsList>

            <div className="overflow-hidden">
              <TabsContent value="sandbox" className="mt-0" forceMount>
                <div className={currentTab !== "sandbox" ? "hidden" : ""}>
                  <ProcessSchedulingSimulation
                    shortcutsEnabled={shortcutsEnabled}
                    isActiveTab={currentTab === "sandbox"}
                  />
                </div>
              </TabsContent>

              <TabsContent value="guided-scenarios" className="mt-0" forceMount>
                <div className={currentTab !== "guided-scenarios" ? "hidden" : ""}>
                  <GuidedScenarios
                    persistedCompletedScenarios={completedScenarios}
                    onCompletedScenariosChange={setCompletedScenarios}
                    shortcutsEnabled={shortcutsEnabled}
                    isActiveTab={currentTab === "guided-scenarios"}
                  />
                </div>
              </TabsContent>

              <TabsContent value="evaluation" className="mt-0" forceMount>
                <div className={currentTab !== "evaluation" ? "hidden" : ""}>
                  <ScenarioEvaluation
                    persistedResults={evaluationResults}
                    onResultsChange={setEvaluationResults}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  )
}
