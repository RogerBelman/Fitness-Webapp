import './App.css'

const setupItems = [
  {
    label: 'Backend',
    value: 'Spring Boot API shell',
  },
  {
    label: 'Frontend',
    value: 'React TypeScript shell',
  },
  {
    label: 'Next',
    value: 'PostgreSQL with Docker',
  },
]

function App() {
  return (
    <main className="AppShell">
      <section className="IntroPanel">
        <p className="PhaseLabel">Phase 1</p>
        <h1>Workout Tracker</h1>
        <p>
          A full-stack training log built one phase at a time with React,
          TypeScript, Spring Boot, and PostgreSQL.
        </p>
      </section>

      <section className="SetupGrid" aria-label="Project setup status">
        {setupItems.map((item) => (
          <article className="SetupCard" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
