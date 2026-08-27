import { PageHeader } from '../components/PageHeader'

export function NewWorkout() {
  return (
    <section className="PageStack">
      <PageHeader
        title="New Workout"
        description="Start a workout session and add exercises."
      />

      <form className="FormSurface">
        <label>
          Workout Date
          <input name="workoutDate" type="date" />
        </label>

        <label>
          Title
          <input name="title" placeholder="Push Day" type="text" />
        </label>

        <label>
          Notes
          <textarea name="notes" placeholder="Optional workout notes" rows={4} />
        </label>

        <div className="FormActions">
          <button className="Button ButtonPrimary" type="submit">
            Create Workout
          </button>
        </div>
      </form>
    </section>
  )
}
