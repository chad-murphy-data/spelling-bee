import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import WordListInput from './components/WordListInput'
import PracticeCard from './components/PracticeCard'
import ScoreBoard from './components/ScoreBoard'
import ProgressView from './components/ProgressView'
import SessionReport from './components/SessionReport'
import HowItWorks from './components/HowItWorks'
import { useMerriamWebster } from './hooks/useMerriamWebster'
import { useWordProgress } from './hooks/useWordProgress'
import { useSavedWords } from './hooks/useSavedWords'

const FUN_MODE_KEY = 'spelling_bee_fun_mode'

function pickWeightedWord(words, progressData, lastWord) {
  function getWeight(progress) {
    if (!progress) return 10
    if (progress.mastered) return 1
    if (progress.correct_streak === 0 && progress.total_attempts > 0) return 15
    return Math.max(1, 10 - progress.correct_streak * 2)
  }

  const weights = words.map(w => getWeight(progressData[w]))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  for (let attempt = 0; attempt < 5; attempt++) {
    let rand = Math.random() * totalWeight
    for (let i = 0; i < words.length; i++) {
      rand -= weights[i]
      if (rand <= 0) {
        if (words[i] !== lastWord || words.length === 1) {
          return words[i]
        }
        break
      }
    }
  }
  return words[Math.floor(Math.random() * words.length)]
}

export default function App() {
  const [view, setView] = useState('loading') // loading | input | practice | progress | report
  const [wordData, setWordData] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [words, setWords] = useState([])
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [sessionStreak, setSessionStreak] = useState(0)
  const [wordKey, setWordKey] = useState(0)
  const [sessionLog, setSessionLog] = useState([])
  const [funMode, setFunMode] = useState(() => localStorage.getItem(FUN_MODE_KEY) === 'true')
  const [showHelp, setShowHelp] = useState(false)

  const { fetchWord, loading: mwLoading } = useMerriamWebster()
  const { progressMap, loadAllProgress, recordAttempt, clearAllProgress } = useWordProgress()
  const { loadWords, saveWords } = useSavedWords()
  const progressRef = useRef(progressMap)
  progressRef.current = progressMap

  const masteredCount = useMemo(() => {
    return Object.values(progressMap).filter(p => p.mastered).length
  }, [progressMap])

  const toggleFunMode = useCallback(() => {
    setFunMode(prev => {
      const next = !prev
      localStorage.setItem(FUN_MODE_KEY, String(next))
      return next
    })
  }, [])

  const loadWordData = useCallback(async (word) => {
    setWordData(null)
    const data = await fetchWord(word)
    setWordData(data)
  }, [fetchWord])

  const advanceWord = useCallback((wordList, progress, lastWord) => {
    const word = pickWeightedWord(wordList, progress, lastWord)
    setCurrentWord(word)
    setWordKey(k => k + 1)
    loadWordData(word)
    return word
  }, [loadWordData])

  // On mount, try to load saved word list from Supabase/localStorage
  useEffect(() => {
    (async () => {
      const saved = await loadWords()
      if (saved && saved.length > 0) {
        startSession(saved)
      } else {
        setView('input')
      }
    })()
  }, [])

  const startSession = useCallback(async (wordList) => {
    await saveWords(wordList)
    setWords(wordList)
    setSessionCorrect(0)
    setSessionTotal(0)
    setSessionStreak(0)
    setSessionLog([])
    const progress = await loadAllProgress()
    setView('practice')
    advanceWord(wordList, progress, null)
  }, [saveWords, loadAllProgress, advanceWord])

  const handleWordsLoaded = useCallback((wordList) => {
    startSession(wordList)
  }, [startSession])

  const handleSubmit = useCallback((correct) => {
    setSessionTotal(t => t + 1)
    if (correct) {
      setSessionCorrect(c => c + 1)
      setSessionStreak(s => s + 1)
    } else {
      setSessionStreak(0)
    }
    setSessionLog(log => [...log, { word: currentWord, correct }])
    recordAttempt(currentWord, correct)
  }, [currentWord, recordAttempt])

  const handleNext = useCallback(() => {
    advanceWord(words, progressRef.current, currentWord)
  }, [words, currentWord, advanceWord])

  const handleChangeList = useCallback(() => {
    setView('input')
  }, [])

  const handleCancelInput = useCallback(() => {
    if (words.length > 0) {
      setView('practice')
    }
  }, [words])

  const handleResetProgress = useCallback(async () => {
    await clearAllProgress()
    setSessionCorrect(0)
    setSessionTotal(0)
    setSessionStreak(0)
    setSessionLog([])
  }, [clearAllProgress])

  const handleShowReport = useCallback(() => {
    setView('report')
  }, [])

  const handleContinuePractice = useCallback(() => {
    setView('practice')
    if (!currentWord) {
      advanceWord(words, progressRef.current, null)
    }
  }, [currentWord, words, advanceWord])

  return (
    <div className={`app ${funMode ? 'app--fun' : ''}`}>
      <header className="header">
        <div className="header__inner">
          <h1 className="header__title">Spelling Bee Trainer</h1>
          <nav className="header__nav">
            <button
              className="header__nav-btn"
              onClick={() => setShowHelp(h => !h)}
              title="How it works"
            >
              ?
            </button>
            <button
              className={`header__nav-btn ${funMode ? 'header__nav-btn--fun-active' : ''}`}
              onClick={toggleFunMode}
              title={funMode ? 'Disable fun mode' : 'Enable fun mode'}
            >
              {funMode ? '\u2728 Fun!' : '\u2728'}
            </button>
            {view === 'practice' && (
              <>
                <button className="header__nav-btn" onClick={handleShowReport}>
                  Report
                </button>
                <button className="header__nav-btn" onClick={() => setView('progress')}>
                  Progress
                </button>
                <button className="header__nav-btn" onClick={handleChangeList}>
                  Change List
                </button>
              </>
            )}
            {view === 'progress' && (
              <>
                <button className="header__nav-btn" onClick={() => setView('practice')}>
                  Practice
                </button>
                <button className="header__nav-btn header__nav-btn--danger" onClick={handleResetProgress}>
                  Reset Progress
                </button>
              </>
            )}
            {view === 'report' && (
              <button className="header__nav-btn" onClick={() => setView('practice')}>
                Practice
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        {showHelp && <HowItWorks />}

        {view === 'loading' && (
          <div className="loading-state">Loading...</div>
        )}

        {view === 'input' && (
          <>
            <HowItWorks />
            <WordListInput
              onWordsLoaded={handleWordsLoaded}
              onCancel={words.length > 0 ? handleCancelInput : undefined}
            />
          </>
        )}

        {view === 'practice' && currentWord && (
          <div className="practice-layout">
            <ScoreBoard
              sessionCorrect={sessionCorrect}
              sessionTotal={sessionTotal}
              currentStreak={sessionStreak}
              totalWords={words.length}
              masteredCount={masteredCount}
            />
            <PracticeCard
              key={wordKey}
              word={currentWord}
              wordData={wordData}
              onSubmit={handleSubmit}
              onNext={handleNext}
              loading={mwLoading && !wordData}
              funMode={funMode}
            />
          </div>
        )}

        {view === 'progress' && (
          <ProgressView
            progressMap={progressMap}
            onBack={() => setView('practice')}
          />
        )}

        {view === 'report' && (
          <SessionReport
            sessionLog={sessionLog}
            onContinue={handleContinuePractice}
            onEndSession={handleChangeList}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__attribution">
            <svg className="footer__mw-logo" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span>Powered by Merriam-Webster</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
