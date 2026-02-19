export default function SessionReport({ sessionLog, onContinue, onEndSession }) {
  const aced = sessionLog.filter(e => e.correct)
  const toStudy = sessionLog.filter(e => !e.correct)

  // Deduplicate (keep last attempt per word)
  const unique = (entries) => {
    const map = new Map()
    entries.forEach(e => map.set(e.word, e))
    return [...map.values()]
  }

  const acedWords = unique(aced)
  const studyWords = unique(toStudy).filter(
    e => !acedWords.some(a => a.word === e.word)
  )

  const total = sessionLog.length
  const correctCount = aced.length
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0

  return (
    <div className="session-report">
      <h2 className="session-report__title">Session Report</h2>

      <div className="session-report__summary">
        <div className="session-report__stat">
          <span className="session-report__stat-value">{total}</span>
          <span className="session-report__stat-label">Words Attempted</span>
        </div>
        <div className="session-report__stat">
          <span className="session-report__stat-value">{accuracy}%</span>
          <span className="session-report__stat-label">Accuracy</span>
        </div>
      </div>

      {acedWords.length > 0 && (
        <div className="session-report__section session-report__section--aced">
          <h3 className="session-report__section-title">Words You Aced</h3>
          <div className="session-report__word-list">
            {acedWords.map(e => (
              <span key={e.word} className="session-report__word session-report__word--aced">
                {e.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {studyWords.length > 0 && (
        <div className="session-report__section session-report__section--study">
          <h3 className="session-report__section-title">Words to Study</h3>
          <div className="session-report__word-list">
            {studyWords.map(e => (
              <span key={e.word} className="session-report__word session-report__word--study">
                {e.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="session-report__empty">No words attempted yet. Get practicing!</p>
      )}

      <div className="session-report__actions">
        <button className="btn btn--primary" onClick={onContinue}>
          Keep Practicing
        </button>
        <button className="btn btn--secondary" onClick={onEndSession}>
          New Word List
        </button>
      </div>
    </div>
  )
}
