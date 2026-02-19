import { useState, useMemo } from 'react'

export default function ProgressView({ progressMap, onBack }) {
  const [sortKey, setSortKey] = useState('accuracy')
  const [sortAsc, setSortAsc] = useState(true)

  const rows = useMemo(() => {
    const items = Object.values(progressMap).map(p => ({
      ...p,
      accuracy: p.total_attempts > 0
        ? Math.round((p.total_correct / p.total_attempts) * 100)
        : 0,
    }))

    items.sort((a, b) => {
      let aVal, bVal
      switch (sortKey) {
        case 'word': aVal = a.word; bVal = b.word; break
        case 'attempts': aVal = a.total_attempts; bVal = b.total_attempts; break
        case 'accuracy': aVal = a.accuracy; bVal = b.accuracy; break
        case 'streak': aVal = a.correct_streak; bVal = b.correct_streak; break
        case 'mastered': aVal = a.mastered ? 1 : 0; bVal = b.mastered ? 1 : 0; break
        default: aVal = a.accuracy; bVal = b.accuracy;
      }
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortAsc ? aVal - bVal : bVal - aVal
    })

    return items
  }, [progressMap, sortKey, sortAsc])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(key === 'accuracy')
    }
  }

  const sortIndicator = (key) => {
    if (sortKey !== key) return ''
    return sortAsc ? ' \u25B2' : ' \u25BC'
  }

  if (rows.length === 0) {
    return (
      <div className="progress-view">
        <div className="progress-view__header">
          <h2>Progress</h2>
          <button className="btn btn--secondary" onClick={onBack}>Back to Practice</button>
        </div>
        <p className="progress-view__empty">No words practiced yet. Start practicing to see your progress here.</p>
      </div>
    )
  }

  return (
    <div className="progress-view">
      <div className="progress-view__header">
        <h2>Progress</h2>
        <button className="btn btn--secondary" onClick={onBack}>Back to Practice</button>
      </div>
      <div className="progress-view__table-wrap">
        <table className="progress-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('word')}>Word{sortIndicator('word')}</th>
              <th onClick={() => handleSort('attempts')}>Attempts{sortIndicator('attempts')}</th>
              <th onClick={() => handleSort('accuracy')}>Accuracy{sortIndicator('accuracy')}</th>
              <th onClick={() => handleSort('streak')}>Streak{sortIndicator('streak')}</th>
              <th onClick={() => handleSort('mastered')}>Status{sortIndicator('mastered')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.word} className={row.mastered ? 'progress-table__row--mastered' : ''}>
                <td className="progress-table__word">{row.word}</td>
                <td>{row.total_attempts}</td>
                <td>
                  <span className={`accuracy-badge ${row.accuracy < 50 ? 'accuracy-badge--low' : row.accuracy >= 80 ? 'accuracy-badge--high' : ''}`}>
                    {row.accuracy}%
                  </span>
                </td>
                <td>{row.correct_streak}</td>
                <td>
                  <span className={`status-tag ${row.mastered ? 'status-tag--mastered' : 'status-tag--learning'}`}>
                    {row.mastered ? 'Mastered' : 'Learning'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
