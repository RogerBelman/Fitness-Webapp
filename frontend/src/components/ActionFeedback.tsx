import { useEffect, useState } from 'react'

type ActionFeedbackProps = {
  errorMessage?: string | null
  successMessage?: string | null
}

export function ActionFeedback({
  errorMessage,
  successMessage,
}: ActionFeedbackProps) {
  const message = errorMessage ?? successMessage
  const isError = Boolean(errorMessage)
  const [isVisible, setIsVisible] = useState(Boolean(message))

  useEffect(() => {
    if (!message) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)
    const timeout = window.setTimeout(() => setIsVisible(false), 7000)
    return () => window.clearTimeout(timeout)
  }, [message, isError])

  if (!message || !isVisible) return null

  return (
    <div
      className="ActionFeedback"
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div
        className={`Alert ${isError ? 'AlertError' : 'AlertSuccess'} ActionFeedbackCard`}
        role={isError ? 'alert' : 'status'}
      >
        <span className="ActionFeedbackIcon" aria-hidden="true">
          {isError ? '!' : '✓'}
        </span>
        <p>{message}</p>
        <button
          className="ActionFeedbackClose"
          type="button"
          aria-label="Dismiss notification"
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>
      </div>
    </div>
  )
}
