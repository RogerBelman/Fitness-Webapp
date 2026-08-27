import { PageHeader } from '../components/PageHeader'

export function ExerciseLibrary() {
  return (
    <section className="PageStack">
      <PageHeader
        title="Exercise Library"
        description="Manage reusable exercises by muscle group and category."
        actions={<button className="Button ButtonPrimary">New Exercise</button>}
      />

      <section className="Toolbar" aria-label="Exercise filters">
        <label>
          Search
          <input placeholder="Bench press" type="search" />
        </label>

        <label>
          Muscle Group
          <select defaultValue="">
            <option value="">All</option>
            <option value="Chest">Chest</option>
            <option value="Back">Back</option>
            <option value="Legs">Legs</option>
            <option value="Shoulders">Shoulders</option>
            <option value="Arms">Arms</option>
            <option value="Core">Core</option>
          </select>
        </label>

        <label>
          Category
          <select defaultValue="">
            <option value="">All</option>
            <option value="Strength">Strength</option>
            <option value="Bodyweight">Bodyweight</option>
            <option value="Cardio">Cardio</option>
          </select>
        </label>
      </section>

      <section className="ContentBand">
        <p className="EmptyState">No exercises loaded yet.</p>
      </section>
    </section>
  )
}
