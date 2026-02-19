import { useState, useCallback } from 'react'

async function extractTextFromPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map(item => item.str).join(' '))
  }
  return pages.join('\n')
}

export default function WordListInput({ onWordsLoaded }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const parseWords = useCallback((raw) => {
    return raw
      .split(/[\r\n,;\s]+/)
      .map(token => token.trim().toLowerCase())
      .filter(token => token.length > 0 && /^[a-z'-]+$/i.test(token))
  }, [])

  const handleSubmit = useCallback(() => {
    const words = parseWords(text)
    if (words.length === 0) {
      setError('No valid words found. Paste one word per line.')
      return
    }
    setError(null)
    onWordsLoaded(words)
  }, [text, parseWords, onWordsLoaded])

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target.result
      setText(content)
      const words = parseWords(content)
      if (words.length > 0) {
        onWordsLoaded(words)
      } else {
        setError('No valid words found in the file.')
      }
    }
    reader.readAsText(file)
  }, [parseWords, onWordsLoaded])

  const handlePdf = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfLoading(true)
    setError(null)
    try {
      const raw = await extractTextFromPdf(file)
      setText(raw)
      const words = parseWords(raw)
      if (words.length > 0) {
        onWordsLoaded(words)
      } else {
        setError('No valid words found in the PDF.')
      }
    } catch {
      setError('Could not read PDF. Make sure it contains selectable text.')
    } finally {
      setPdfLoading(false)
    }
  }, [parseWords, onWordsLoaded])

  const handleLoadBundled = useCallback(async () => {
    try {
      const module = await import('../data/wordlist.txt?raw')
      const words = parseWords(module.default)
      if (words.length > 0) {
        onWordsLoaded(words)
      } else {
        setError('Bundled word list is empty.')
      }
    } catch {
      setError('Could not load bundled word list.')
    }
  }, [parseWords, onWordsLoaded])

  return (
    <div className="wordlist-input">
      <div className="wordlist-input__card">
        <h2 className="wordlist-input__title">Load Word List</h2>
        <p className="wordlist-input__subtitle">
          Paste your word list below (one word per line), or upload a .txt or .pdf file.
        </p>

        <div className="wordlist-input__actions-top">
          <label className="btn btn--secondary wordlist-input__file-label">
            Upload .txt File
            <input type="file" accept=".txt" onChange={handleFile} hidden />
          </label>
          <label className={`btn btn--secondary wordlist-input__file-label ${pdfLoading ? 'btn--loading' : ''}`}>
            {pdfLoading ? 'Reading PDF...' : 'Upload PDF'}
            <input type="file" accept=".pdf" onChange={handlePdf} hidden disabled={pdfLoading} />
          </label>
          <button className="btn btn--secondary" onClick={handleLoadBundled}>
            Use Bundled List
          </button>
        </div>

        <textarea
          className="wordlist-input__textarea"
          placeholder="aberration&#10;abscond&#10;abstinence&#10;accolade&#10;..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
        />

        {error && <p className="wordlist-input__error">{error}</p>}

        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={text.trim().length === 0}
        >
          Start Practicing ({parseWords(text).length} words)
        </button>
      </div>
    </div>
  )
}
