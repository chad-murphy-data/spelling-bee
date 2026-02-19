import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useWordProgress() {
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(false)

  const loadAllProgress = useCallback(async () => {
    if (!supabase) return {}
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('word_progress')
        .select('*')
      if (error) throw error
      const map = {}
      for (const row of data || []) {
        map[row.word] = row
      }
      setProgressMap(map)
      return map
    } catch (err) {
      console.error('Failed to load progress:', err)
      return {}
    } finally {
      setLoading(false)
    }
  }, [])

  const recordAttempt = useCallback(async (word, correct) => {
    setProgressMap(prev => {
      const existing = prev[word] || {
        word,
        correct_streak: 0,
        total_attempts: 0,
        total_correct: 0,
        mastered: false,
        last_seen: null,
      }

      const newStreak = correct ? existing.correct_streak + 1 : 0
      const newTotalCorrect = existing.total_correct + (correct ? 1 : 0)
      const newMastered = newStreak >= 3

      const updated = {
        ...existing,
        correct_streak: newStreak,
        total_attempts: existing.total_attempts + 1,
        total_correct: newTotalCorrect,
        mastered: newMastered,
        last_seen: new Date().toISOString().split('T')[0],
      }

      if (supabase) {
        supabase
          .from('word_progress')
          .upsert(updated, { onConflict: 'word' })
          .then(({ error }) => {
            if (error) console.error('Failed to save progress:', error)
          })
      }

      return { ...prev, [word]: updated }
    })
  }, [])

  const clearAllProgress = useCallback(async () => {
    if (!supabase) return
    try {
      await supabase.from('word_progress').delete().neq('word', '')
      setProgressMap({})
    } catch (err) {
      console.error('Failed to clear progress:', err)
    }
  }, [])

  return { progressMap, loadAllProgress, recordAttempt, clearAllProgress, loading }
}
