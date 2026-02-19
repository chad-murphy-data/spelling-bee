import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LOCAL_KEY = 'spelling_bee_wordlist'

export function useSavedWords() {
  const loadWords = useCallback(async () => {
    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('saved_words')
          .select('word')
          .order('added_at', { ascending: true })
        if (!error && data && data.length > 0) {
          const words = data.map(r => r.word)
          localStorage.setItem(LOCAL_KEY, JSON.stringify(words))
          return words
        }
      } catch {
        // Fall through to localStorage
      }
    }
    // Fall back to localStorage
    try {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return null
  }, [])

  const saveWords = useCallback(async (words) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(words))
    if (!supabase) return
    try {
      // Clear old list and insert new one
      const { error: delError } = await supabase.from('saved_words').delete().neq('word', '')
      if (delError) console.error('Failed to delete old words:', delError)
      const rows = words.map(w => ({ word: w }))
      // Supabase has a 1000-row insert limit, batch if needed
      for (let i = 0; i < rows.length; i += 500) {
        const { error: insError } = await supabase.from('saved_words').insert(rows.slice(i, i + 500))
        if (insError) console.error('Failed to insert words batch:', insError)
      }
    } catch (err) {
      console.error('Failed to save words to Supabase:', err)
    }
  }, [])

  const clearWords = useCallback(async () => {
    localStorage.removeItem(LOCAL_KEY)
    if (!supabase) return
    try {
      await supabase.from('saved_words').delete().neq('word', '')
    } catch (err) {
      console.error('Failed to clear saved words:', err)
    }
  }, [])

  return { loadWords, saveWords, clearWords }
}
