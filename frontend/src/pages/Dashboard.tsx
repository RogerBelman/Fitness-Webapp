import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { WeeklyCalendar } from '../components/dashboard/WeeklyCalendar'
import { DayWorkouts } from '../components/dashboard/DayWorkouts'
import { useWorkouts } from '../hooks/useWorkouts'
import { useDayWorkouts } from '../hooks/useDayWorkouts'
import { getTodayDate } from '../utils/workoutCalendar'
import { MonthlyWorkoutCalendar } from '../components/dashboard/MonthlyWorkoutCalendar'

export function Dashboard() {
  const today = getTodayDate()
  const [selectedDate, setSelectedDate] = useState(getTodayDate)
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const { workouts, isLoading, errorMessage, reloadWorkouts } = useWorkouts()
  const day = useDayWorkouts(
    selectedDate,
    workouts,
    !isLoading && !errorMessage,
  )

  return (
    <section className="PageStack">
      <PageHeader
        title="Dashboard"
        description="Review your training schedule and select a day to see its workouts and exercises."
        actions={<button className="Button ButtonSecondary" type="button" onClick={() => setIsMonthOpen(true)}>Month Overview</button>}
      />

      {isMonthOpen ? <MonthlyWorkoutCalendar workouts={workouts} selectedDate={selectedDate} today={today} onSelectDate={setSelectedDate} onClose={() => setIsMonthOpen(false)} /> : null}

      {errorMessage ? (
        <div className="Alert AlertError DashboardError" role="alert">
          <p>{errorMessage}</p>
          <button
            className="Button ButtonSecondary"
            type="button"
            onClick={reloadWorkouts}
          >
            Try Again
          </button>
        </div>
      ) : null}

      <WeeklyCalendar
        workouts={workouts}
        selectedDate={selectedDate}
        today={today}
        isLoading={isLoading}
        hasError={Boolean(errorMessage)}
        onSelectDate={setSelectedDate}
      />
      {!errorMessage ? (
        <DayWorkouts
          date={selectedDate}
          today={today}
          workouts={workouts}
          details={day.details}
          isLoading={isLoading}
          isLoadingDetails={day.isLoading}
          errorMessage={day.errorMessage}
        />
      ) : null}
    </section>
  )
}
