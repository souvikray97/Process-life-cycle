"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  Clock,
  Users,
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
  Play,
  RotateCcw,
  FileText,
  BarChart3,
  Info,
  Download,
  GraduationCap,
} from "lucide-react"
import { exportEvaluationResultsCSV, exportEvaluationResultsJSON } from "@/lib/export-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScenarioEngine, PREDEFINED_SCENARIOS, type ScenarioConfig, type ScenarioResult } from "@/lib/scenario-engine"
import { ProcessSchedulingSimulation } from "./process-scheduling-simulation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ScenarioEvaluationProps {
  persistedResults?: any[]
  onResultsChange?: (results: ScenarioResult[]) => void
}

export function ScenarioEvaluation({ persistedResults, onResultsChange }: ScenarioEvaluationProps = {}) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null)
  const [currentTab, setCurrentTab] = useState("scenarios")
  const [evaluationResults, setEvaluationResults] = useState<ScenarioResult[]>((persistedResults ?? []) as ScenarioResult[])
  const [scenarioEngine] = useState(() => new ScenarioEngine())
  const [isScenarioActive, setIsScenarioActive] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showDetailedResults, setShowDetailedResults] = useState<number | null>(null)

  // Notify parent when results change
  useEffect(() => {
    onResultsChange?.(evaluationResults)
  }, [evaluationResults, onResultsChange])

  useEffect(() => {
    if (!isScenarioActive) return

    const interval = setInterval(() => {
      setElapsedTime(scenarioEngine.getElapsedTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [isScenarioActive, scenarioEngine])

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

  const startScenario = (scenario: ScenarioConfig) => {
    setSelectedScenario(scenario)
    scenarioEngine.startScenario(scenario)
    setIsScenarioActive(true)
    setElapsedTime(0)
    setCurrentTab("results")
  }

  const completeScenario = useCallback(() => {
    if (!isScenarioActive || !selectedScenario) return

    const result = scenarioEngine.completeScenario()
    if (result) {
      setEvaluationResults((prev) => [...prev.filter((r) => r.scenarioId !== result.scenarioId), result])
      setIsScenarioActive(false)
      setCurrentTab("results")
    }
  }, [isScenarioActive, selectedScenario, scenarioEngine])

  const resetScenario = () => {
    setIsScenarioActive(false)
    setSelectedScenario(null)
    setElapsedTime(0)
    setCurrentTab("scenarios")
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-blue-600"
    if (score >= 55) return "text-yellow-600"
    return "text-red-600"
  }

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto bg-gray-300 gap-1 p-1">
          <TabsTrigger
            value="scenarios"
            title="Select and start evaluation scenarios"
            className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
              currentTab === "scenarios"
                ? "bg-white text-black border border-blue-300 shadow-sm"
                : "bg-gray-400/60 text-gray-800 hover:bg-gray-400"
            }`}
          >
            <span className="hidden sm:inline">Scenarios</span>
            <span className="sm:hidden">Tests</span>
          </TabsTrigger>
          <TabsTrigger
            value="results"
            title="View completed scenario results and performance analysis"
            className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
              currentTab === "results"
                ? "bg-white text-black border border-blue-300 shadow-sm"
                : "bg-gray-400/60 text-gray-800 hover:bg-gray-400"
            }`}
          >
            Results
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            title="Detailed learning analytics and progress tracking"
            className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
              currentTab === "analytics"
                ? "bg-white text-black border border-blue-300 shadow-sm"
                : "bg-gray-400/60 text-gray-800 hover:bg-gray-400"
            }`}
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="panel-title flex flex-col sm:flex-row sm:items-center gap-2">
                <GraduationCap className="h-6 w-6 flex-shrink-0" />
                <span>Process Life Cycle Evaluation</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Scenarios that assess understanding of process life cycle management. Each scenario produces
                        detailed scoring and feedback.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid gap-4 grid-cols-1">
            {PREDEFINED_SCENARIOS.map((scenario) => {
              const result = evaluationResults.find((r) => r.scenarioId === scenario.id)

              return (
                <Card key={scenario.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base sm:text-lg break-words flex-1 min-w-0">
                            {scenario.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={getDifficultyColor(scenario.difficulty)}>{scenario.difficulty}</Badge>
                            {result && result.completed && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Completed</span>
                                <span className="sm:hidden">Done</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">{scenario.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{Math.floor(scenario.timeLimit / 60)}m</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 flex-shrink-0" />
                        Objectives:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                        {scenario.objectives.map((objective, index) => (
                          <li key={index} className="break-words">
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{scenario.initialProcesses.length} processes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words">Min terminated: {scenario.expectedOutcome.minTerminated}</span>
                      </div>
                    </div>

                    {result && result.completed && (
                      <Alert className="border-green-200 bg-green-50">
                        <Award className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <AlertDescription className="text-green-800">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-sm break-words">
                              Score: {result.score}/{result.maxScore} ({getGradeFromScore(result.score)}) | Time:{" "}
                              {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowDetailedResults(
                                  showDetailedResults === result.scenarioId ? null : result.scenarioId,
                                )
                              }
                              className="text-xs px-2 py-1 flex-shrink-0"
                            >
                              {showDetailedResults === result.scenarioId ? "Hide" : "Show"} Details
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {showDetailedResults === scenario.id && result && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Detailed Performance Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Life Cycle Metrics</div>
                              <div className="space-y-1 text-muted-foreground">
                                <div>Valid Transitions: {result.metrics.validTransitions}</div>
                                <div>Invalid Attempts: {result.metrics.invalidAttempts}</div>
                                <div>Terminated Processes: {result.metrics.terminatedProcesses}</div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Score Breakdown</div>
                              <div className="space-y-1 text-muted-foreground">
                                <div>Time Management: /25</div>
                                <div>Accuracy: /25</div>
                                <div>Completion: /25</div>
                                <div>Transitions: /25</div>
                              </div>
                            </div>
                          </div>

                          {result.feedback.strengths.length > 0 && (
                            <div>
                              <div className="font-medium text-green-700 mb-1">Strengths:</div>
                              <ul className="list-disc list-inside text-sm text-green-600 pl-2">
                                {result.feedback.strengths.map((strength, index) => (
                                  <li key={index} className="break-words">
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.feedback.improvements.length > 0 && (
                            <div>
                              <div className="font-medium text-orange-700 mb-1">Areas for Improvement:</div>
                              <ul className="list-disc list-inside text-sm text-orange-600 pl-2">
                                {result.feedback.improvements.map((improvement, index) => (
                                  <li key={index} className="break-words">
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => startScenario(scenario)} className="bg-blue-600 hover:bg-blue-700 text-sm">
                        <Play className="h-4 w-4 mr-2 flex-shrink-0" />
                        {result && result.completed ? "Retry Scenario" : "Start Scenario"}
                      </Button>
                      {result && result.completed && (
                        <Button
                          variant="outline"
                          onClick={() => setShowDetailedResults(scenario.id)}
                          className="text-sm"
                        >
                          <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                          View Report
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
                <Award className="h-5 w-5 flex-shrink-0" />
                <span>Evaluation Results</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Comprehensive performance analysis across all completed scenarios with detailed scoring and
                        feedback.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Comprehensive performance analysis across all completed scenarios.
                </p>
                {evaluationResults.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-shrink-0" aria-label="Export evaluation results">
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportEvaluationResultsCSV(evaluationResults, PREDEFINED_SCENARIOS)} className="text-xs">
                        Results (CSV)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportEvaluationResultsJSON(evaluationResults, PREDEFINED_SCENARIOS)} className="text-xs">
                        Results (JSON)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
          </Card>

          {evaluationResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">No completed scenarios yet.</p>
                <Button onClick={() => setCurrentTab("scenarios")} className="text-sm">
                  Start the First Scenario
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Overall Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{evaluationResults.length}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div
                        className={`text-xl sm:text-2xl font-bold ${getScoreColor(Math.round(evaluationResults.reduce((acc, r) => acc + r.score, 0) / evaluationResults.length))}`}
                      >
                        {Math.round(evaluationResults.reduce((acc, r) => acc + r.score, 0) / evaluationResults.length)}%
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Avg Score</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {getGradeFromScore(
                          Math.round(evaluationResults.reduce((acc, r) => acc + r.score, 0) / evaluationResults.length),
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Overall Grade</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        {Math.floor(evaluationResults.reduce((acc, r) => acc + r.timeSpent, 0) / 60)}m
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Total Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {evaluationResults.map((result) => {
                const scenario = PREDEFINED_SCENARIOS.find((s) => s.id === result.scenarioId)
                if (!scenario) return null

                return (
                  <Card key={result.scenarioId}>
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg break-words flex-1 min-w-0">
                          {scenario.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${getScoreColor(result.score)} border-current text-xs`}>
                            {result.score}/{result.maxScore} ({getGradeFromScore(result.score)})
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Life Cycle Metrics</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Valid Transitions:</span>
                              <span className="font-mono text-green-600">{result.metrics.validTransitions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Invalid Attempts:</span>
                              <span className="font-mono text-red-600">{result.metrics.invalidAttempts}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Terminated:</span>
                              <span className="font-mono">{result.metrics.terminatedProcesses}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Key Insights</h4>
                          <div className="text-sm space-y-1">
                            {result.feedback.strengths.slice(0, 2).map((strength, index) => (
                              <div key={index} className="text-green-600 break-words">
                                {"+"} {strength}
                              </div>
                            ))}
                            {result.feedback.improvements.slice(0, 2).map((improvement, index) => (
                              <div key={index} className="text-orange-600 break-words">
                                {"->"} {improvement}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
                <BarChart3 className="h-5 w-5 flex-shrink-0" />
                <span>Learning Analytics Dashboard</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Detailed analytics for instructors to track student progress, identify learning gaps, and assess
                        overall performance trends.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Detailed analytics for instructors to track student progress and identify learning gaps.
              </p>
            </CardHeader>
            <CardContent>
              {evaluationResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">Complete some scenarios to see analytics data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Performance by Difficulty</h4>
                    <div className="space-y-2">
                      {["beginner", "intermediate", "advanced"].map((difficulty) => {
                        const difficultyResults = evaluationResults.filter((r) => {
                          const scenario = PREDEFINED_SCENARIOS.find((s) => s.id === r.scenarioId)
                          return scenario?.difficulty === difficulty
                        })
                        const avgScore =
                          difficultyResults.length > 0
                            ? Math.round(
                                difficultyResults.reduce((acc, r) => acc + r.score, 0) / difficultyResults.length,
                              )
                            : 0

                        return (
                          <div key={difficulty} className="flex items-center justify-between">
                            <span className="capitalize text-sm">{difficulty}:</span>
                            <div className="flex items-center gap-2">
                              <Progress value={avgScore} className="w-16 sm:w-20" />
                              <span className={`font-mono text-xs ${getScoreColor(avgScore)}`}>{avgScore}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Common Areas for Improvement</h4>
                    <div className="space-y-2 text-sm">
                      {evaluationResults
                        .flatMap((r) => r.feedback.improvements)
                        .reduce((acc: { [key: string]: number }, improvement) => {
                          acc[improvement] = (acc[improvement] || 0) + 1
                          return acc
                        }, {}).constructor === Object &&
                        Object.entries(
                          evaluationResults
                            .flatMap((r) => r.feedback.improvements)
                            .reduce((acc: { [key: string]: number }, improvement) => {
                              acc[improvement] = (acc[improvement] || 0) + 1
                              return acc
                            }, {}),
                        )
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 3)
                          .map(([improvement, count]) => (
                            <div key={improvement} className="flex items-start justify-between gap-2">
                              <span className="text-orange-600 text-xs break-words flex-1">{"*"} {improvement}</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {count}
                              </Badge>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Embedded Simulation when scenario is active */}
      {selectedScenario && isScenarioActive && (
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-lg break-words">
                    <Target className="h-5 w-5 flex-shrink-0" />
                    <span>{selectedScenario.title}</span>
                  </CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm break-words">{selectedScenario.description}</p>
                </div>
                <div className="text-center sm:text-right flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {Math.floor((selectedScenario.timeLimit - elapsedTime) / 60)}:
                    {String((selectedScenario.timeLimit - elapsedTime) % 60).padStart(2, "0")}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Time Remaining</div>
                </div>
              </div>
              <Progress value={(elapsedTime / selectedScenario.timeLimit) * 100} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Objectives:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                    {selectedScenario.objectives.map((obj, index) => (
                      <li key={index} className="break-words">
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={completeScenario} className="bg-green-600 hover:bg-green-700 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    Complete Scenario
                  </Button>
                  <Button onClick={resetScenario} variant="outline" className="text-sm bg-transparent">
                    <RotateCcw className="h-4 w-4 mr-2 flex-shrink-0" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden">
            <ProcessSchedulingSimulation />
          </div>

          {elapsedTime > selectedScenario.timeLimit * 0.8 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <AlertDescription className="text-yellow-800 text-sm break-words">
                Warning: You have less than {Math.floor((selectedScenario.timeLimit - elapsedTime) / 60)} minutes
                remaining!
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
