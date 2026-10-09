import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  CardioProgressPoint,
  ExerciseProgressPoint,
} from '../../types/progress'

type ProgressChartProps = {
  exerciseName: string
  history: (ExerciseProgressPoint | CardioProgressPoint)[]
  metric?: 'maxWeight' | 'totalDurationMinutes' | 'maxLevel'
}

export function ProgressChart({
  exerciseName,
  history,
  metric = 'maxWeight',
}: ProgressChartProps) {
  const label =
    metric === 'maxWeight'
      ? 'Max Weight'
      : metric === 'maxLevel'
        ? 'Highest Level'
        : 'Duration'
  const unit =
    metric === 'maxWeight' ? 'lb' : metric === 'maxLevel' ? 'level' : 'min'
  return (
    <section className="ContentBand" aria-labelledby="progress-chart-heading">
      <div className="SectionHeader">
        <h2 id="progress-chart-heading">{label} Trend</h2>
        <span className="ChartUnit">{unit}</span>
      </div>

      <div
        className="ProgressChartViewport"
        role="img"
        aria-label={`${exerciseName} ${label.toLowerCase()} by workout`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            accessibilityLayer
            data={history}
            margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="workoutDate"
              tickFormatter={formatAxisDate}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={metric !== 'maxWeight'}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => formatWeight(value)}
              tickLine={false}
              tickMargin={8}
              width={52}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-raised)',
                color: 'var(--text)',
                border: '1px solid var(--dialog-border)',
                borderRadius: 12,
                boxShadow: 'var(--popup-shadow)',
                padding: '12px 16px',
              }}
              labelStyle={{ color: 'var(--text)', fontWeight: 700 }}
              itemStyle={{ color: 'var(--text)' }}
              cursor={{ stroke: 'var(--control-border)' }}
              formatter={(value) => [
                `${formatWeight(Number(value))} ${unit}`,
                label,
              ]}
              labelFormatter={(label) => formatWorkoutDate(String(label))}
            />
            <Line
              activeDot={{
                r: 6,
                fill: 'var(--accent)',
                stroke: 'var(--on-accent)',
                strokeWidth: 2,
              }}
              dataKey={metric}
              dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
              name={label}
              stroke="var(--accent)"
              strokeWidth={3}
              type="linear"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function formatWeight(weight: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    weight,
  )
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
