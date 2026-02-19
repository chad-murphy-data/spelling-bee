import { useState, useEffect, useRef, useCallback } from 'react'
import AudioButton from './AudioButton'

// Ranked list of preferred English voices (best first).
const PREFERRED_VOICES = [
  'Google US English',
  'Google UK English Female',
  'Google UK English Male',
  'Microsoft Zira',
  'Microsoft David',
  'Microsoft Mark',
  'Samantha',
  'Karen',
  'Daniel',
]

const STORAGE_KEY = 'spelling-bee-tts-voice'

function getEnglishVoices() {
  return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
}

function pickBestVoice(voices) {
  // Check localStorage for a saved choice
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const match = voices.find(v => v.name === saved)
    if (match) return match
  }
  for (const name of PREFERRED_VOICES) {
    const match = voices.find(v => v.name === name)
    if (match) return match
  }
  return voices.find(v => !v.localService) || voices[0] || null
}

function useTTS() {
  const [speaking, setSpeaking] = useState(null)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const voiceRef = useRef(null)

  useEffect(() => {
    const update = () => {
      const english = getEnglishVoices()
      setVoices(english)
      const best = pickBestVoice(english)
      setSelectedVoice(best?.name || null)
      voiceRef.current = best
    }
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  const changeVoice = useCallback((name) => {
    const match = voices.find(v => v.name === name)
    if (match) {
      voiceRef.current = match
      setSelectedVoice(name)
      localStorage.setItem(STORAGE_KEY, name)
      // Quick preview so the user can hear it
      window.speechSynthesis.cancel()
      const preview = new SpeechSynthesisUtterance('This is how I sound.')
      preview.voice = match
      preview.rate = 0.9
      window.speechSynthesis.speak(preview)
    }
  }, [voices])

  const speak = useCallback((text, label) => {
    window.speechSynthesis.cancel()
    if (speaking === label) {
      setSpeaking(null)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    if (voiceRef.current) utterance.voice = voiceRef.current
    utterance.onend = () => setSpeaking(null)
    utterance.onerror = () => setSpeaking(null)
    setSpeaking(label)
    window.speechSynthesis.speak(utterance)
  }, [speaking])

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(null)
  }, [])

  return { speaking, speak, cancel, voices, selectedVoice, changeVoice }
}

export default function PracticeCard({ word, wordData, onSubmit, onNext, loading }) {
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState(null) // { correct: bool }
  const [revealed, setRevealed] = useState({}) // { definition: bool, etymology: bool }
  const inputRef = useRef(null)
  const { speaking, speak, cancel, voices, selectedVoice, changeVoice } = useTTS()

  useEffect(() => {
    setGuess('')
    setResult(null)
    setRevealed({})
    cancel()
    inputRef.current?.focus()
  }, [word, cancel])

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

            {voices.length > 1 && (
              <div className="voice-picker">
                <label className="voice-picker__label" htmlFor="voice-select">TTS Voice</label>
                <select
                  id="voice-select"
                  className="voice-picker__select"
                  value={selectedVoice || ''}
                  onChange={(e) => changeVoice(e.target.value)}
                >
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {wordData?.definition && (
              <div className="practice-card__clue">
                <div className="practice-card__clue-header">
                  <span className="practice-card__clue-label">Definition</span>
                  <div className="practice-card__clue-actions">
                    <button
                      type="button"
                      className={`tts-btn ${speaking === 'definition' ? 'tts-btn--active' : ''}`}
                      onClick={() => speak(wordData.definition, 'definition')}
                      aria-label="Hear definition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      {speaking === 'definition' ? 'Reading...' : 'Read Aloud'}
                    </button>
                    <button
                      type="button"
                      className="reveal-btn"
                      onClick={() => setRevealed(r => ({ ...r, definition: !r.definition }))}
                      aria-label={revealed.definition ? 'Hide definition text' : 'Show definition text'}
                    >
                      {revealed.definition ? 'Hide' : 'Show Text'}
                    </button>
                  </div>
                </div>
                {revealed.definition && (
                  <p className="practice-card__clue-text practice-card__clue-text--revealed">{wordData.definition}</p>
                )}
              </div>
            )}

            {wordData?.etymology && (
              <div className="practice-card__clue">
                <div className="practice-card__clue-header">
                  <span className="practice-card__clue-label">Etymology</span>
                  <div className="practice-card__clue-actions">
                    <button
                      type="button"
                      className={`tts-btn ${speaking === 'etymology' ? 'tts-btn--active' : ''}`}
                      onClick={() => speak(wordData.etymology, 'etymology')}
                      aria-label="Hear etymology"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      {speaking === 'etymology' ? 'Reading...' : 'Read Aloud'}
                    </button>
                    <button
                      type="button"
                      className="reveal-btn"
                      onClick={() => setRevealed(r => ({ ...r, etymology: !r.etymology }))}
                      aria-label={revealed.etymology ? 'Hide etymology text' : 'Show etymology text'}
                    >
                      {revealed.etymology ? 'Hide' : 'Show Text'}
                    </button>
                  </div>
                </div>
                {revealed.etymology && (
                  <p className="practice-card__clue-text practice-card__clue-text--etymology practice-card__clue-text--revealed">{wordData.etymology}</p>
                )}
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
