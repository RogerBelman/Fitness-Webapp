import type { Workout } from '../../types/workout'
import { useMeasurementPreferences } from '../../hooks/useMeasurementPreferences'
import {
  addDays,
  formatCalendarDate,
  formatWeekRange,
  getWeekDates,
} from '../../utils/workoutCalendar'
import { formatWeight } from '../../utils/weightMeasurement'

type WeeklyCalendarProps = {
  workouts: Workout[]
  selectedDate: string
  today: string
  isLoading: boolean
  hasError: boolean
  onSelectDate: (date: string) => void
}

export function WeeklyCalendar({
  workouts,
  selectedDate,
  today,
  isLoading,
  hasError,
  onSelectDate,
}: WeeklyCalendarProps) {
  const { weightUnit } = useMeasurementPreferences()
  const dates = getWeekDates(selectedDate)
  const weekWorkouts = workouts.filter(
    (workout) =>
      workout.workoutDate >= dates[0] && workout.workoutDate <= dates[6],
  )
  const totalSets = weekWorkouts.reduce(
    (total, workout) => total + workout.totalSets,
    0,
  )
  const totalVolume = weekWorkouts.reduce(
    (total, workout) => total + workout.totalVolume,
    0,
  )
  const isReady = !isLoading && !hasError
  const totalCardioMinutes = weekWorkouts.reduce(
    (total, workout) => total + workout.totalCardioMinutes,
    0,
  )

  return (
    <section
      className="ContentBand WeeklyCalendar"
      aria-labelledby="week-heading"
    >
      <div className="WeekToolbar">
        <div>
          <p className="WeekEyebrow">Monday – Sunday</p>
          <h2 id="week-heading" aria-live="polite">
            {formatWeekRange(selectedDate)}
          </h2>
        </div>
        <div className="RowActions">
          <button
            className="Button ButtonSecondary WeekArrow"
            type="button"
            aria-label="Previous week"
            onClick={() => onSelectDate(addDays(selectedDate, -7))}
          >
            ←
          </button>
          <button
            className="Button ButtonSecondary"
            type="button"
            onClick={() => onSelectDate(today)}
          >
            Today
          </button>
          <button
            className="Button ButtonSecondary WeekArrow"
            type="button"
            aria-label="Next week"
            onClick={() => onSelectDate(addDays(selectedDate, 7))}
          >
            →
          </button>
        </div>
      </div>

      <div
        className="WeekDays"
        role="group"
        aria-label="Select a day to view workouts"
        aria-busy={isLoading}
      >
        {dates.map((date) => {
          const dayWorkouts = workouts.filter(
            (workout) => workout.workoutDate === date,
          )
          const isToday = date === today
          const hasWorkouts = isReady && dayWorkouts.length > 0
          const weekday = formatCalendarDate(date, { weekday: 'short' })
          const fullDate = formatCalendarDate(date, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
          return (
            <button
              className={`CalendarDay${isToday ? ' CalendarDayToday' : ''}${hasWorkouts ? ' CalendarDayHasWorkouts' : ''}`}
              key={date}
              type="button"
              aria-pressed={date === selectedDate}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${fullDate}${isToday ? ', today' : ''}${isReady ? `, ${dayWorkouts.length} ${dayWorkouts.length === 1 ? 'workout' : 'workouts'}` : ', workout count unavailable'}`}
              onClick={() => onSelectDate(date)}
            >
              <span className="CalendarWeekday">{weekday}</span>
              <time className="CalendarDate" dateTime={date}>
                {formatCalendarDate(date, { day: 'numeric' })}
              </time>
              <span className="CalendarCount">
                {isReady ? (
                  <>
                    {dayWorkouts.length}
                    <span className="CalendarCountLabel">
                      {' '}
                      {dayWorkouts.length === 1 ? 'workout' : 'workouts'}
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </span>
              <span className="CalendarDayWorkouts" aria-hidden="true">
                {isReady
                  ? dayWorkouts
                      .slice(0, 2)
                      .map((workout) => (
                        <span key={workout.id}>
                          {workout.title || 'Untitled workout'}
                        </span>
                      ))
                  : null}
                {isReady && dayWorkouts.length > 2 ? (
                  <span>+{dayWorkouts.length - 2} more</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      <dl className="WeekTotals" aria-label="Totals for the displayed week">
        <div>
          <dt>Workouts this week</dt>
          <dd>{isReady ? weekWorkouts.length : '—'}</dd>
        </div>
        <div>
          <dt>Strength sets</dt>
          <dd>{isReady ? totalSets : '—'}</dd>
        </div>
        <div>
          <dt>Strength volume</dt>
          <dd>
            {isReady
              ? `${formatWeight(totalVolume, weightUnit)} ${weightUnit}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Cardio duration</dt>
          <dd>
            {isReady
              ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(totalCardioMinutes)} min`
              : '—'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
