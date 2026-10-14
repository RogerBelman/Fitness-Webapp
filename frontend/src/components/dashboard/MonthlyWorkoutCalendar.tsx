import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Workout } from '../../types/workout'
import { formatCalendarDate } from '../../utils/workoutCalendar'

type MonthlyWorkoutCalendarProps = {
  workouts: Workout[]
  selectedDate: string
  today: string
  onSelectDate: (date: string) => void
  onClose: () => void
}

export function MonthlyWorkoutCalendar({ workouts, selectedDate, today, onSelectDate, onClose }: MonthlyWorkoutCalendarProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [month, setMonth] = useState(selectedDate.slice(0, 7))
  const days = useMemo(() => getMonthDays(month), [month])
  const counts = useMemo(() => {
    const result = new Map<string, number>()
    workouts.forEach((workout) => result.set(workout.workoutDate, (result.get(workout.workoutDate) ?? 0) + 1))
    return result
  }, [workouts])

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  return <dialog className="ConfirmDialog MonthDialog" ref={dialog} aria-labelledby={titleId} onCancel={onClose}>
    <div className="MonthHeader">
      <div><span className="WeekEyebrow">Monthly overview</span><h2 id={titleId}>{formatMonth(month)}</h2></div>
      <button className="Button ButtonSecondary" type="button" onClick={onClose}>Close</button>
    </div>
    <div className="MonthToolbar">
      <button className="Button ButtonSecondary" type="button" aria-label="Previous month" onClick={() => setMonth(changeMonth(month, -1))}>←</button>
      <button className="Button ButtonSecondary" type="button" onClick={() => setMonth(today.slice(0, 7))}>This Month</button>
      <button className="Button ButtonSecondary" type="button" aria-label="Next month" onClick={() => setMonth(changeMonth(month, 1))}>→</button>
    </div>
    <div className="MonthWeekdays" aria-hidden="true">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="MonthGrid">
      {Array.from({ length: days.offset }, (_, index) => <span className="MonthBlank" key={`blank-${index}`} />)}
      {days.dates.map((date) => {
        const count = counts.get(date) ?? 0
        return <button className={`MonthDay${date === selectedDate ? ' MonthDaySelected' : ''}${date === today ? ' MonthDayToday' : ''}${count ? ' MonthDayActive' : ''}`} type="button" key={date} onClick={() => { onSelectDate(date); onClose() }} aria-label={`${formatCalendarDate(date, { month: 'long', day: 'numeric' })}, ${count} workout${count === 1 ? '' : 's'}`}>
          <span>{Number(date.slice(-2))}</span>{count ? <small>{count}</small> : null}
        </button>
      })}
    </div>
    <p className="MonthLegend"><span /> Days with workouts</p>
  </dialog>
}

function getMonthDays(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const total = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay()
  return { offset: (firstDay + 6) % 7, dates: Array.from({ length: total }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`) }
}

function changeMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`))
}
