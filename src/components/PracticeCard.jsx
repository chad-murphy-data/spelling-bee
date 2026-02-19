import { useState, useEffect, useRef, useCallback } from 'react'
import AudioButton from './AudioButton'

export default function PracticeCard({ word, wordData, onSubmit, onNext, loading }) {
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState(null) // { correct: bool }
  const inputRef = useRef(null)

  useEffect(() => {
    setGuess('')
    setResult(null)
    inputRef.current?.focus()
  }, [word])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!guess.trim() || result !== null) return
    const correct = guess.trim().toLowerCase() === word.toLowerCase()
    setResult({ correct })
    onSubmit(correct)
  }, [guess, word, onSubmit, result])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && result !== null) {
      onNext()
    }
  }, [result, onNext])

  return (
    <div className="practice-card">
      <div className="practice-card__clue-section">
        {loading ? (
          <div className="practice-card__loading">Loading word data...</div>
        ) : (
          <>
            <AudioButton audioUrl={wordData?.audioUrl} />

            {wordData?.definition && (
              <div className="practice-card__clue">
                <span className="practice-card__clue-label">Definition</span>
                <p className="practice-card__clue-text">{wordData.definition}</p>
              </div>
            )}

            {wordData?.etymology && (
              <div className="practice-card__clue">
                <span className="practice-card__clue-label">Etymology</span>
                <p className="practice-card__clue-text practice-card__clue-text--etymology">{wordData.etymology}</p>
              </div>
            )}
          </>
        )}
      </div>

      <form className="practice-card__form" onSubmit={handleSubmit}>
        <div className={`practice-card__input-wrap ${result !== null ? (result.correct ? 'practice-card__input-wrap--correct' : 'practice-card__input-wrap--incorrect') : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className="practice-card__input"
            placeholder="Type your spelling..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={result !== null}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {result === null ? (
          <button
            type="submit"
            className="btn btn--primary practice-card__submit"
            disabled={!guess.trim() || loading}
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary practice-card__submit"
            onClick={onNext}
          >
            Next Word
          </button>
        )}
      </form>

      {result !== null && (
        <div className={`practice-card__result ${result.correct ? 'practice-card__result--correct' : 'practice-card__result--incorrect'}`}>
          <div className="practice-card__result-icon">
            {result.correct ? '\u2713' : '\u2717'}
          </div>
          <div className="practice-card__result-text">
            {result.correct ? (
              <span>Correct!</span>
            ) : (
              <span>The correct spelling is <strong>{word}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
