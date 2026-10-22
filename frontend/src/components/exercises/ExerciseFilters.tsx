import { MUSCLE_GROUPS } from '../../utils/muscleGroups'

type ExerciseFiltersProps = {
  trainingType: string
  onTrainingTypeChange: (value: string) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  muscleGroup: string
  onMuscleGroupChange: (value: string) => void
}

export function ExerciseFilters({
  trainingType,
  onTrainingTypeChange,
  searchTerm,
  onSearchChange,
  muscleGroup,
  onMuscleGroupChange,
}: ExerciseFiltersProps) {
  const isCardio = trainingType === 'CARDIO'
  return (
    <section
      className={`FilterBar ExerciseFilterBar${isCardio ? ' CardioFilterBar' : ''}`}
      aria-label="Exercise filters"
    >
      <label>
        Training Type
        <select
          value={trainingType}
          onChange={(event) => onTrainingTypeChange(event.target.value)}
        >
          <option value="">All</option>
          <option value="STRENGTH">💪 Strength</option>
          <option value="CARDIO">❤️ Cardio</option>
        </select>
      </label>
      <label>
        Search
        <input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={
            isCardio ? 'Search cardio exercises' : 'Search by exercise name'
          }
          type="search"
          value={searchTerm}
        />
      </label>

      {!isCardio ? (
        <label>
          Muscle Group
          <select
            onChange={(event) => onMuscleGroupChange(event.target.value)}
            value={muscleGroup}
          >
            <option value="">All</option>
            {MUSCLE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        className="Button ButtonSecondary FilterAction"
        type="button"
        disabled={!trainingType && !searchTerm && !muscleGroup}
        onClick={() => {
          onTrainingTypeChange('')
          onSearchChange('')
          onMuscleGroupChange('')
        }}
      >
        Clear Filters
      </button>
    </section>
  )
}
