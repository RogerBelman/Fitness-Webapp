import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useMeasurementPreferences } from '../../hooks/useMeasurementPreferences'
import type { Workout } from '../../types/workout'
import { formatWeight } from '../../utils/weightMeasurement'
import { getTrainingTypeOptionLabel } from '../../utils/trainingTypeDisplay'
import {
  filterWorkouts,
  type WorkoutTrainingFilter,
} from '../../utils/workoutFilters'

type WorkoutListProps = {
  workouts: Workout[]
  isLoading: boolean
}

export function WorkoutList({ workouts, isLoading }: WorkoutListProps) {
  const { weightUnit } = useMeasurementPreferences()
  const [search, setSearch] = useState('')
  const [trainingType, setTrainingType] =
    useState<WorkoutTrainingFilter>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const filteredWorkouts = useMemo(
    () =>
      filterWorkouts(workouts, { search, trainingType, fromDate, toDate }),
    [fromDate, search, toDate, trainingType, workouts],
  )
  const hasFilters = Boolean(
    search || trainingType !== 'ALL' || fromDate || toDate,
  )

  return (
    <>
      <section className="FilterBar WorkoutFilterBar" aria-label="Workout filters">
        <label className="WorkoutSearchField">
          Search Workouts
          <input
            type="search"
            value={search}
            placeholder="Workout or exercise name"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Training Type
          <select
            value={trainingType}
            onChange={(event) =>
              setTrainingType(event.target.value as WorkoutTrainingFilter)
            }
          >
            <option value="ALL">All types</option>
            <option value="STRENGTH">{getTrainingTypeOptionLabel('STRENGTH')} only</option>
            <option value="CARDIO">{getTrainingTypeOptionLabel('CARDIO')} only</option>
            <option value="MIXED">Mixed</option>
          </select>
        </label>
        <label>
          From Date
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>
        <label>
          To Date
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>
        <button
          className="Button ButtonSecondary FilterAction"
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            setSearch('')
            setTrainingType('ALL')
            setFromDate('')
            setToDate('')
          }}
        >
          Clear Filters
        </button>
      </section>

      <section className="ContentBand">
      <div className="SectionHeader">
        <h2>Workout History</h2>
        <span className="RecordCount">{filteredWorkouts.length}</span>
      </div>

      {isLoading ? <p className="EmptyState">Loading workouts...</p> : null}

      {!isLoading && workouts.length === 0 ? (
        <p className="EmptyState">No workout history yet.</p>
      ) : null}

      {!isLoading && workouts.length > 0 && filteredWorkouts.length === 0 ? (
        <p className="EmptyState">No workouts match these filters.</p>
      ) : null}

      {!isLoading && filteredWorkouts.length > 0 ? (
        <div className="WorkoutList">
          {filteredWorkouts.map((workout) => (
            <Link
              className="WorkoutRow"
              key={workout.id}
              to={`/workouts/${workout.id}`}
            >
              <div className="WorkoutIdentity">
                <time dateTime={workout.workoutDate}>
                  {formatWorkoutDate(workout.workoutDate)}
                </time>
                <h3>{workout.title || 'Untitled Workout'}</h3>
                {workout.notes ? <p>{workout.notes}</p> : null}
              </div>

              <dl className="WorkoutMetrics">
                <div>
                  <dt>Strength Sets</dt>
                  <dd>{workout.totalSets}</dd>
                </div>
                <div>
                  <dt>Strength Volume</dt>
                  <dd>
                    {formatWeight(workout.totalVolume, weightUnit)} {weightUnit}
                  </dd>
                </div>
                <div>
                  <dt>Cardio</dt>
                  <dd>{formatVolume(workout.totalCardioMinutes)} min</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      ) : null}
      </section>
    </>
  )
}

function formatWorkoutDate(workoutDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${workoutDate}T00:00:00Z`))
}

function formatVolume(totalVolume: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    totalVolume,
  )
}
