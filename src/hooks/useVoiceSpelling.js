import { useState, useRef, useCallback, useEffect } from 'react'

// Map common speech recognition outputs to individual letters.
// When a user spells "B-E-A-U-T-I-F-U-L", the speech API often returns
// homophones like "be", "ee", "ay" instead of the literal letter.
const SPOKEN_TO_LETTER = new Map()

const LETTER_VARIANTS = {
  a: ['a', 'ay', 'eh', 'aye'],
  b: ['b', 'be', 'bee'],
  c: ['c', 'see', 'sea', 'si'],
  d: ['d', 'de', 'dee'],
  e: ['e', 'ee'],
  f: ['f', 'ef', 'eff'],
  g: ['g', 'ge', 'gee'],
  h: ['h', 'aitch', 'age', 'ache', 'each'],
  i: ['i', 'eye', 'ai'],
  j: ['j', 'jay'],
  k: ['k', 'kay', 'ca'],
  l: ['l', 'el', 'ell', 'ale'],
  m: ['m', 'em', 'am'],
  n: ['n', 'en'],
  o: ['o', 'oh', 'owe'],
  p: ['p', 'pe', 'pee'],
  q: ['q', 'queue', 'cue', 'que', 'kew'],
  r: ['r', 'ar', 'are', 'our'],
  s: ['s', 'es', 'ess'],
  t: ['t', 'te', 'tee', 'tea'],
  u: ['u', 'you', 'yu', 'ew'],
  v: ['v', 've', 'vee'],
  w: ['w', 'double u', 'double you', 'doubleyou'],
  x: ['x', 'ex'],
  y: ['y', 'why', 'wye'],
  z: ['z', 'ze', 'zed', 'zee'],
}

for (const [letter, variants] of Object.entries(LETTER_VARIANTS)) {
  for (const variant of variants) {
    SPOKEN_TO_LETTER.set(variant, letter)
  }
}

function mapToLetter(spoken) {
  const lower = spoken.toLowerCase().trim()
  if (!lower) return null
  if (SPOKEN_TO_LETTER.has(lower)) return SPOKEN_TO_LETTER.get(lower)
  if (lower.length === 1 && /[a-z]/.test(lower)) return lower
  return null
}

export function useVoiceSpelling() {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef(null)
  const callbackRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SR)
  }, [])

  const start = useCallback((onEvent) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }

    callbackRef.current = onEvent
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 3

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue

        let matched = false
        for (let alt = 0; alt < event.results[i].length; alt++) {
          const transcript = event.results[i][alt].transcript.trim()
          const words = transcript.split(/[\s,.-]+/).filter(Boolean)

          for (const word of words) {
            const lower = word.toLowerCase()
            if (lower === 'backspace' || lower === 'delete' || lower === 'back') {
              callbackRef.current?.({ type: 'backspace' })
              matched = true
              continue
            }
            const letter = mapToLetter(word)
            if (letter) {
              callbackRef.current?.({ type: 'letter', value: letter })
              matched = true
            }
          }

          if (matched) break
        }
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setListening(false)
        recognitionRef.current = null
      }
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current === recognition) {
        try {
          recognition.start()
        } catch {
          setListening(false)
          recognitionRef.current = null
        }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      recognitionRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    const ref = recognitionRef.current
    recognitionRef.current = null
    if (ref) {
      try { ref.stop() } catch { /* ignore */ }
    }
    setListening(false)
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* ignore */ }
        recognitionRef.current = null
      }
    }
  }, [])

  return { listening, supported, start, stop }
}
