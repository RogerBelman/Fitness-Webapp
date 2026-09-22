const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
const categories = ['Strength', 'Bodyweight', 'Cardio']

type ExerciseFiltersProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  muscleGroup: string
  onMuscleGroupChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
}

export function ExerciseFilters({
  searchTerm,
  onSearchChange,
  muscleGroup,
  onMuscleGroupChange,
  category,
  onCategoryChange,
}: ExerciseFiltersProps) {
  return (
    <section className="Toolbar" aria-label="Exercise filters">
      <label>
        Search
        <input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Bench press"
          type="search"
          value={searchTerm}
        />
      </label>

      <label>
        Muscle Group
        <select
          onChange={(event) => onMuscleGroupChange(event.target.value)}
          value={muscleGroup}
        >
          <option value="">All</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>

      <label>
        Category
        <select
          onChange={(event) => onCategoryChange(event.target.value)}
          value={category}
        >
          <option value="">All</option>
          {categories.map((categoryOption) => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
