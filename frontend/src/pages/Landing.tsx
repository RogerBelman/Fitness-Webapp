import { Link } from 'react-router-dom'
import { PageMetadata } from '../components/PageMetadata'
import { useAuth } from '../hooks/useAuth'

const features = [
  {
    icon: '💪',
    title: 'Log every session',
    description: 'Track strength sets and cardio time in one organized workout history.',
  },
  {
    icon: '📋',
    title: 'Reuse your routines',
    description: 'Build workout templates so your regular training is ready when you are.',
  },
  {
    icon: '📈',
    title: 'See your progress',
    description: 'Review charts, volume, cardio performance, and exercise goals over time.',
  },
]

export function Landing() {
  const { user } = useAuth()

  return (
    <div className="LandingPage">
      <PageMetadata
        canonicalPath="/"
        description="Plan workouts, log strength and cardio sessions, use reusable templates, set goals, and review your training progress with Workout Tracker."
        robots="index, follow"
        title="Workout Tracker | Strength and Cardio Training Log"
      />

      <header className="LandingHeader">
        <Link className="Brand" to="/" aria-label="Workout Tracker home">
          <span className="BrandMark" aria-hidden="true"><img src="/logo.svg" alt="" /></span>
          <span>Workout Tracker</span>
        </Link>
        <Link className="Button ButtonSecondary" to={user ? '/dashboard' : '/login'}>
          {user ? 'Open Dashboard' : 'Sign In'}
        </Link>
      </header>

      <main>
        <section className="LandingHero" aria-labelledby="landing-title">
          <div className="LandingHeroCopy">
            <p className="LandingEyebrow">Train with a clear plan</p>
            <h1 id="landing-title">Keep your workouts and progress in one place.</h1>
            <p className="LandingIntro">
              Plan sessions, record strength and cardio training, and see how your work adds up
              over time.
            </p>
            <div className="LandingActions">
              <Link className="Button ButtonPrimary" to={user ? '/dashboard' : '/login?mode=register'}>
                {user ? 'Go to Dashboard' : 'Create an Account'}
              </Link>
            </div>
          </div>

          <div className="LandingPreview" aria-label="Workout planning preview">
            <div className="LandingPreviewHeader">
              <span>This week</span>
              <strong>3 workouts</strong>
            </div>
            <div className="LandingWeek" aria-hidden="true">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <span className={index === 0 || index === 2 || index === 4 ? 'active' : ''} key={`${day}-${index}`}>
                  {day}
                </span>
              ))}
            </div>
            <div className="LandingPreviewWorkout">
              <span className="LandingPreviewIcon" aria-hidden="true">💪</span>
              <div>
                <strong>Upper Body</strong>
                <span>4 exercises · 12 sets</span>
              </div>
            </div>
            <div className="LandingPreviewWorkout">
              <span className="LandingPreviewIcon" aria-hidden="true">♥</span>
              <div>
                <strong>Cardio</strong>
                <span>30 minutes · Level 6</span>
              </div>
            </div>
          </div>
        </section>

        <section className="LandingFeatures" aria-labelledby="features-title">
          <div className="LandingSectionHeading">
            <p className="LandingEyebrow">Built for consistent training</p>
            <h2 id="features-title">Simple tools for the full workout cycle</h2>
          </div>
          <div className="LandingFeatureGrid">
            {features.map((feature) => (
              <article className="LandingFeatureCard" key={feature.title}>
                <span className="LandingFeatureIcon" aria-hidden="true">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
