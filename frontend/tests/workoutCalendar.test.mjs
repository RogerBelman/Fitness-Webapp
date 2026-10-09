import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

// Use the app's actual date helpers with Node's test runner, without adding
// a frontend test framework or requiring Node's TypeScript support.
const source = await readFile(
  new URL('../src/utils/workoutCalendar.ts', import.meta.url),
  'utf8',
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
  },
})
const calendar = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

test('Sunday belongs to the Monday–Sunday week that is ending', () => {
  assert.deepEqual(calendar.getWeekDates('2026-10-11'), [
    '2026-10-05',
    '2026-10-06',
    '2026-10-07',
    '2026-10-08',
    '2026-10-09',
    '2026-10-10',
    '2026-10-11',
  ])
  assert.equal(calendar.getWeekDates('2026-10-12')[0], '2026-10-12')
})

test('a week can cross both a month and a year boundary', () => {
  const dates = calendar.getWeekDates('2027-01-01')
  assert.equal(dates[0], '2026-12-28')
  assert.equal(dates[6], '2027-01-03')
  assert.equal(calendar.addDays('2027-01-01', -7), '2026-12-25')
})

test('week navigation preserves the selected weekday across daylight saving changes', () => {
  assert.equal(calendar.addDays('2026-03-08', 7), '2026-03-15')
  assert.equal(calendar.addDays('2026-11-01', -7), '2026-10-25')
  assert.equal(calendar.addDays('2026-03-08', 1), '2026-03-09')
})

test('calendar labels keep the stored date regardless of the local timezone', () => {
  assert.equal(
    calendar.formatCalendarDate('2026-10-08', { weekday: 'long' }),
    'Thursday',
  )
  assert.equal(
    calendar.formatCalendarDate('2026-10-08', { day: 'numeric' }),
    '8',
  )
})

test('Today uses the local calendar date', () => {
  assert.equal(
    calendar.getTodayDate(new Date(2026, 9, 8, 23, 59)),
    '2026-10-08',
  )
})

test('date validation rejects malformed dates and impossible calendar days', () => {
  assert.equal(calendar.isValidWorkoutDate('2024-02-29'), true)
  for (const invalid of [
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-2-08',
    '0000-01-01',
    'bad-date',
  ]) {
    assert.equal(calendar.isValidWorkoutDate(invalid), false, invalid)
  }
  assert.throws(() => calendar.getWeekDates('bad-date'), RangeError)
})

test('Add Workout accepts past and current dates and safely falls back for future or invalid dates', () => {
  const today = '2026-10-08'
  assert.equal(
    calendar.getInitialWorkoutDate('2026-10-05', today),
    '2026-10-05',
  )
  assert.equal(calendar.getInitialWorkoutDate(today, today), today)
  for (const invalid of ['2026-10-09', '2026-02-29', 'not-a-date', null]) {
    assert.equal(calendar.getInitialWorkoutDate(invalid, today), today)
  }
})
