import { useState } from 'react'

const DISMISSED_KEY = 'spelling_bee_help_dismissed'

export default function HowItWorks({ collapsed: collapsedProp }) {
  const [dismissed, setDismissed] = useState(
    () => collapsedProp || localStorage.getItem(DISMISSED_KEY) === 'true'
  )

  if (dismissed && collapsedProp === undefined) {
    return null
  }

  if (dismissed) {
    return null
  }

  return (
    <div className="how-it-works">
      <div className="how-it-works__header">
        <h3 className="how-it-works__title">How It Works</h3>
        <button
          className="how-it-works__dismiss"
          onClick={() => {
            setDismissed(true)
            localStorage.setItem(DISMISSED_KEY, 'true')
          }}
          aria-label="Dismiss instructions"
        >
          Got it
        </button>
      </div>
      <ol className="how-it-works__steps">
        <li>
          <strong>This is a spelling bee training dojo.</strong> It randomly
          selects words from your list, prioritizing words you haven&rsquo;t
          seen yet and words you&rsquo;ve struggled with, while
          de-prioritizing words you&rsquo;ve successfully spelled multiple
          times.
        </li>
        <li>
          <strong>Upload your word list</strong> by clicking{' '}
          <em>Upload .txt File</em>, <em>Upload PDF</em>, or paste words
          directly into the text box. You can also click{' '}
          <em>Use Bundled List</em> to get started right away.
        </li>
        <li>
          <strong>Hear the word</strong> by clicking the big{' '}
          <em>&ldquo;What&rsquo;s My Word?&rdquo;</em> button. This plays
          the official Merriam-Webster pronunciation.
        </li>
        <li>
          <strong>Hear the definition and etymology</strong> by clicking the{' '}
          <em>Read Aloud</em> buttons next to each section. Beware of
          spelling spoilers if you click <em>Show Text</em>!
        </li>
        <li>
          <strong>When you&rsquo;re done,</strong> click <em>Report</em> in
          the top nav to see your session report with words you aced and
          words to study.
        </li>
      </ol>
    </div>
  )
}
