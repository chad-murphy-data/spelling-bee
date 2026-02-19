export default function ScoreBoard({ sessionCorrect, sessionTotal, currentStreak, totalWords, masteredCount }) {
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0

  return (
    <div className="scoreboard">
      <div className="scoreboard__stat">
        <span className="scoreboard__value">{sessionCorrect}/{sessionTotal}</span>
        <span className="scoreboard__label">Score</span>
      </div>
      <div className="scoreboard__stat">
        <span className="scoreboard__value">{accuracy}%</span>
        <span className="scoreboard__label">Accuracy</span>
      </div>
      <div className="scoreboard__stat">
        <span className="scoreboard__value scoreboard__value--streak">{currentStreak}</span>
        <span className="scoreboard__label">Streak</span>
      </div>
      <div className="scoreboard__stat">
        <span className="scoreboard__value">{masteredCount}/{totalWords}</span>
        <span className="scoreboard__label">Mastered</span>
      </div>
    </div>
  )
}
