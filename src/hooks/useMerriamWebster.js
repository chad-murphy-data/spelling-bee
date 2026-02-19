import { useState, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_MW_API_KEY

function buildAudioUrl(filename) {
  if (!filename) return null
  let subdir
  if (/^bix/.test(filename)) subdir = 'bix'
  else if (/^gg/.test(filename)) subdir = 'gg'
  else if (/^[0-9]/.test(filename)) subdir = 'number'
  else subdir = filename[0]
  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdir}/${filename}.mp3`
}

function cleanMWText(text) {
  return text
    .replace(/\{bc\}/g, ': ')
    .replace(/\{it\}|\{\/it\}/g, '')
    .replace(/\{[a-z_]+\|([^|}]+)\|[^}]*\}/g, '$1')
    .replace(/\{[^}]+\}/g, '')
    .trim()
}

function parseEntry(data) {
  if (!data || !data.length || typeof data[0] === 'string') {
    return null
  }

  const entry = data[0]
  const definition = entry.shortdef?.[0] || null
  const audioFile = entry.hwi?.prs?.[0]?.sound?.audio || null
  const audioUrl = buildAudioUrl(audioFile)

  let etymology = null
  if (entry.et) {
    const textParts = entry.et
      .filter(part => part[0] === 'text')
      .map(part => cleanMWText(part[1]))
    if (textParts.length) {
      etymology = textParts.join('; ')
    }
  }

  return { definition, audioUrl, etymology }
}

export function useMerriamWebster() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWord = useCallback(async (word) => {
    const cacheKey = `mw_cache_${word.toLowerCase()}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    if (!API_KEY) {
      return { definition: 'API key not configured', audioUrl: null, etymology: null }
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${API_KEY}`
      )
      if (!res.ok) throw new Error(`MW API error: ${res.status}`)

      const data = await res.json()
      const parsed = parseEntry(data)

      if (!parsed) {
        const result = { definition: 'No definition found', audioUrl: null, etymology: null }
        localStorage.setItem(cacheKey, JSON.stringify(result))
        return result
      }

      localStorage.setItem(cacheKey, JSON.stringify(parsed))
      return parsed
    } catch (err) {
      setError(err.message)
      return { definition: null, audioUrl: null, etymology: null }
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchWord, loading, error }
}
