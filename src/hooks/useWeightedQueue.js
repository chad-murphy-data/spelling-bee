import { useState, useCallback } from 'react'

function getWordWeight(progress) {
  if (!progress) return 10
  if (progress.mastered) return 1
  if (progress.correct_streak === 0 && progress.total_attempts > 0) return 15
  return Math.max(1, 10 - progress.correct_streak * 2)
}

function pickWeightedRandom(words, progressMap, lastWord) {
  const weights = words.map(w => getWordWeight(progressMap[w]))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  // Try up to 5 times to avoid repeating the last word
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

  // Fallback: just pick a random one
  const idx = Math.floor(Math.random() * words.length)
  return words[idx]
}

export function useWeightedQueue() {
  const [currentWord, setCurrentWord] = useState(null)
  const [wordList, setWordList] = useState([])

  const initQueue = useCallback((words) => {
    setWordList(words)
  }, [])

  const nextWord = useCallback((progressMap) => {
    if (wordList.length === 0) return null
    const word = pickWeightedRandom(wordList, progressMap, currentWord)
    setCurrentWord(word)
    return word
  }, [wordList, currentWord])

  return { currentWord, wordList, initQueue, nextWord, setCurrentWord }
}
