import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ExerciseProgressPoint } from '../../types/progress'

type ProgressChartProps = {
  exerciseName: string
  history: ExerciseProgressPoint[]
}

export function ProgressChart({ exerciseName, history }: ProgressChartProps) {
  return (
    <section className="ContentBand" aria-labelledby="progress-chart-heading">
      <div className="SectionHeader">
        <h2 id="progress-chart-heading">Max Weight Trend</h2>
        <span className="ChartUnit">lb</span>
      </div>

      <div
        className="ProgressChartViewport"
        role="img"
        aria-label={`${exerciseName} maximum weight by workout`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            accessibilityLayer
            data={history}
            margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid stroke="#d9e1dc" strokeDasharray="4 4" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="workoutDate"
              tickFormatter={formatAxisDate}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => formatWeight(value)}
              tickLine={false}
              tickMargin={8}
              width={52}
            />
            <Tooltip
              contentStyle={{ borderColor: '#cdd8d1', borderRadius: 8 }}
              formatter={(value) => [`${formatWeight(Number(value))} lb`, 'Max weight']}
              labelFormatter={(label) => formatWorkoutDate(String(label))}
            />
            <Line
              activeDot={{ r: 6 }}
              dataKey="maxWeight"
              dot={{ fill: '#166534', r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
              name="Max weight"
              stroke="#166534"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function formatWeight(weight: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(weight)
}

function formatAxisDate(workoutDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(toUtcDate(workoutDate))
}

function formatWorkoutDate(workoutDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toUtcDate(workoutDate))
}

function toUtcDate(workoutDate: string) {
  return new Date(`${workoutDate}T00:00:00Z`)
}
