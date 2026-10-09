export function getTodayDate(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidWorkoutDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-'))
    return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

// Workout dates represent calendar days, not instants. UTC arithmetic keeps
// week navigation stable across daylight saving and local timezone changes.
function dateFromKey(value: string) {
  if (!isValidWorkoutDate(value)) throw new RangeError('Invalid workout date.')
  return new Date(`${value}T12:00:00Z`)
}

export function addDays(value: string, days: number) {
  const date = dateFromKey(value)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function getWeekDates(value: string) {
  const day = dateFromKey(value).getUTCDay()
  const monday = addDays(value, -((day + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function formatCalendarDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: 'UTC',
  }).format(dateFromKey(value))
}

export function formatWeekRange(value: string) {
  const dates = getWeekDates(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(dateFromKey(dates[0]), dateFromKey(dates[6]))
}

export function getInitialWorkoutDate(
  requested: string | null,
  today = getTodayDate(),
) {
  return requested && isValidWorkoutDate(requested) && requested <= today
    ? requested
    : today
}
