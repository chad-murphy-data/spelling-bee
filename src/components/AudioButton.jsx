import { useState, useRef, useCallback } from 'react'

export default function AudioButton({ audioUrl }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  const play = useCallback(() => {
    if (!audioUrl) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    setPlaying(true)
    audio.addEventListener('ended', () => setPlaying(false))
    audio.addEventListener('error', () => setPlaying(false))
    audio.play().catch(() => setPlaying(false))
  }, [audioUrl])

  return (
    <button
      className={`audio-button ${playing ? 'audio-button--playing' : ''}`}
      onClick={play}
      disabled={!audioUrl}
      aria-label="Hear the word"
      type="button"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {playing ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        )}
      </svg>
      <span className="audio-button__label">
        {playing ? 'Playing...' : 'Pronounce'}
      </span>
    </button>
  )
}
