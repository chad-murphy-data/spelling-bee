import { useState, useEffect, useRef, useCallback } from 'react'
import AudioButton from './AudioButton'
import { useVoiceSpelling } from '../hooks/useVoiceSpelling'

const VOICE_INPUT_KEY = 'spelling_bee_voice_input'

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

const FUN_MESSAGES = [
  'You absolute legend!',
  'Spelling wizard!',
  'Nailed it!',
  'Big brain energy!',
  'S-P-E-C-T-A-C-U-L-A-R!',
  'Chef\u2019s kiss!',
  'Unstoppable!',
  'Too easy for you!',
  'Mic drop!',
  'Flawless victory!',
]

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default
  // Burst from both sides
  confetti({ particleCount: 80, spread: 70, origin: { x: 0.2, y: 0.6 } })
  confetti({ particleCount: 80, spread: 70, origin: { x: 0.8, y: 0.6 } })
}

export default function PracticeCard({ word, wordData, onSubmit, onNext, loading, funMode }) {
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState(null) // { correct: bool }
  const [revealed, setRevealed] = useState({}) // { definition: bool, etymology: bool }
  const [funMessage, setFunMessage] = useState(null)
  const inputRef = useRef(null)
  const { speaking, speak, cancel, voices, selectedVoice, changeVoice } = useTTS()
  const { listening, supported: voiceSupported, start: startListening, stop: stopListening } = useVoiceSpelling()
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem(VOICE_INPUT_KEY) === 'true')

  const toggleVoiceMode = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev
      localStorage.setItem(VOICE_INPUT_KEY, String(next))
      if (!next) stopListening()
      return next
    })
  }, [stopListening])

  const handleVoiceEvent = useCallback((event) => {
    if (event.type === 'letter') {
      setGuess(prev => prev + event.value)
    } else if (event.type === 'backspace') {
      setGuess(prev => prev.slice(0, -1))
    }
  }, [])

  const toggleMic = useCallback(() => {
    if (listening) {
      stopListening()
    } else {
      startListening(handleVoiceEvent)
    }
  }, [listening, startListening, stopListening, handleVoiceEvent])

  useEffect(() => {
    setGuess('')
    setResult(null)
    setRevealed({})
    setFunMessage(null)
    cancel()
    stopListening()
    inputRef.current?.focus()
  }, [word, cancel, stopListening])

  // Stop listening when answer is submitted
  useEffect(() => {
    if (result !== null) stopListening()
  }, [result, stopListening])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!guess.trim() || result !== null) return
    const correct = guess.trim().toLowerCase() === word.toLowerCase()
    setResult({ correct })
    onSubmit(correct)
    if (correct && funMode) {
      setFunMessage(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)])
      fireConfetti()
    }
  }, [guess, word, onSubmit, result, funMode])

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
            <div className="practice-card__pronunciation">
              <AudioButton audioUrl={wordData?.audioUrl} />
              <button
                type="button"
                className={`audio-button audio-button--tts ${speaking === 'word' ? 'audio-button--playing' : ''}`}
                onClick={() => speak(word, 'word')}
                aria-label="Hear the word via TTS"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span className="audio-button__label">
                  {speaking === 'word' ? 'Speaking...' : 'Hear from Text to Speech'}
                </span>
              </button>
            </div>

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

      {voiceSupported && (
        <div className="voice-spelling">
          <button
            type="button"
            className={`voice-spelling__toggle ${voiceEnabled ? 'voice-spelling__toggle--active' : ''}`}
            onClick={toggleVoiceMode}
          >
            <svg className="voice-spelling__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Voice Spelling {voiceEnabled ? 'On' : 'Off'}
          </button>
          {voiceEnabled && (
            <span className="voice-spelling__hint">
              Say each letter clearly &middot; say &quot;backspace&quot; to undo
            </span>
          )}
        </div>
      )}

      <form className="practice-card__form" onSubmit={handleSubmit}>
        <div className={`practice-card__input-wrap ${result !== null ? (result.correct ? 'practice-card__input-wrap--correct' : 'practice-card__input-wrap--incorrect') : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className="practice-card__input"
            placeholder={voiceEnabled ? 'Spell it out loud or type...' : 'Type your spelling...'}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={result !== null}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {voiceEnabled && result === null && (
          <button
            type="button"
            className={`mic-btn ${listening ? 'mic-btn--listening' : ''}`}
            onClick={toggleMic}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

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
        <div className={`practice-card__result ${result.correct ? 'practice-card__result--correct' : 'practice-card__result--incorrect'} ${result.correct && funMode ? 'practice-card__result--fun' : ''}`}>
          <div className="practice-card__result-icon">
            {result.correct ? '\u2713' : '\u2717'}
          </div>
          <div className="practice-card__result-text">
            {result.correct ? (
              <span>{funMode && funMessage ? funMessage : 'Correct!'}</span>
            ) : (
              <span>The correct spelling is <strong>{word}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
