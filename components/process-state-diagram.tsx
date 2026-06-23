"use client"

/**
 * Responsive process-state diagram used in the Sandbox "Valid attempts" section.
 * Rebuilt from the reference transition diagram using the project's own state
 * colours (Ready = sky-500, CPU = green-500, I/O = yellow-500, Terminated = red-500)
 * and the project's transition/event names.
 *
 * Scales cleanly across breakpoints because it is a single inline SVG with a fixed
 * viewBox and width: 100%.
 */

const COLORS = {
  ready: "#0ea5e9", // sky-500
  cpu: "#22c55e", // green-500
  io: "#eab308", // yellow-500
  terminated: "#ef4444", // red-500
  edge: "#475569", // slate-600
  label: "#1e293b", // slate-800
}

function StateNode({
  cx,
  cy,
  r,
  fill,
  label,
}: {
  cx: number
  cy: number
  r: number
  fill: string
  label: string
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#ffffff" strokeWidth={3} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={22}
        fontWeight={700}
        fill="#ffffff"
      >
        {label}
      </text>
    </g>
  )
}

function EdgeLabel({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={18}
      fontWeight={700}
      fill={COLORS.label}
    >
      {children}
    </text>
  )
}

export function ProcessStateDiagram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="22 52 676 296"
      preserveAspectRatio="xMidYMax meet"
      className={`w-full h-full ${className}`}
      role="img"
      aria-label="Process life-cycle transition diagram: New process enters Ready; Ready dispatches to CPU; CPU can preempt back to Ready, request I/O, or terminate; I/O completes back to Ready."
    >
      <defs>
        <marker
          id="psd-arrow"
          viewBox="0 0 10 10"
          refX={9}
          refY={5}
          markerWidth={7}
          markerHeight={7}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.edge} />
        </marker>
      </defs>

      {/* ── Edges ───────────────────────────────────────────── */}
      {/* Entry: New process → Ready */}
      <line x1={30} y1={170} x2={120} y2={170} stroke={COLORS.edge} strokeWidth={3} markerEnd="url(#psd-arrow)" />
      <EdgeLabel x={78} y={150}>New process</EdgeLabel>

      {/* Ready → CPU (Dispatch) */}
      <line x1={234} y1={170} x2={340} y2={170} stroke={COLORS.edge} strokeWidth={3} markerEnd="url(#psd-arrow)" />
      <EdgeLabel x={287} y={152}>Dispatch</EdgeLabel>

      {/* CPU → Ready over the top (Preempt) */}
      <path
        d="M 372 128 C 330 70, 230 70, 188 128"
        fill="none"
        stroke={COLORS.edge}
        strokeWidth={3}
        markerEnd="url(#psd-arrow)"
      />
      <EdgeLabel x={280} y={64}>Preempt</EdgeLabel>

      {/* CPU → Terminated (Terminate) */}
      <line x1={454} y1={170} x2={562} y2={170} stroke={COLORS.edge} strokeWidth={3} markerEnd="url(#psd-arrow)" />
      <EdgeLabel x={508} y={152}>Terminate</EdgeLabel>

      {/* CPU → I/O (I/O request) */}
      <path
        d="M 388 218 C 372 262, 360 280, 344 298"
        fill="none"
        stroke={COLORS.edge}
        strokeWidth={3}
        markerEnd="url(#psd-arrow)"
      />
      <EdgeLabel x={430} y={262}>I/O request</EdgeLabel>

      {/* I/O → Ready (I/O complete) */}
      <path
        d="M 256 300 C 224 280, 205 250, 188 214"
        fill="none"
        stroke={COLORS.edge}
        strokeWidth={3}
        markerEnd="url(#psd-arrow)"
      />
      <EdgeLabel x={178} y={282}>I/O complete</EdgeLabel>

      {/* ── Nodes ───────────────────────────────────────────── */}
      <StateNode cx={172} cy={170} r={52} fill={COLORS.ready} label="Ready" />
      <StateNode cx={400} cy={170} r={54} fill={COLORS.cpu} label="CPU" />
      <StateNode cx={300} cy={300} r={46} fill={COLORS.io} label="I/O" />
      <StateNode cx={630} cy={170} r={64} fill={COLORS.terminated} label="Terminated" />
    </svg>
  )
}
