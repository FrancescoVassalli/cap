interface LanguageFlagProps {
  language: 'en' | 'es'
}

export function LanguageFlag({ language }: LanguageFlagProps) {
  if (language === 'es') {
    return (
      <svg
        viewBox="0 0 24 16"
        className="h-4 w-6 rounded-[2px] border border-slate-300"
        aria-hidden="true"
        focusable="false"
        data-testid="language-flag-es"
      >
        <rect width="24" height="16" fill="#AA151B" />
        <rect y="4" width="24" height="8" fill="#F1BF00" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 16"
      className="h-4 w-6 rounded-[2px] border border-slate-300"
      aria-hidden="true"
      focusable="false"
      data-testid="language-flag-en"
    >
      <rect width="24" height="16" fill="#fff" />
      {Array.from({ length: 7 }, (_, index) => (
        <rect key={index} y={index * 2.46} width="24" height="1.23" fill="#B22234" />
      ))}
      <rect width="10" height="8.61" fill="#3C3B6E" />
      {Array.from({ length: 9 }, (_, index) => (
        <circle
          key={index}
          cx={2 + (index % 3) * 3}
          cy={2 + Math.floor(index / 3) * 2.6}
          r="0.45"
          fill="#fff"
        />
      ))}
    </svg>
  )
}
