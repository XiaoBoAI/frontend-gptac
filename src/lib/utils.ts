import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract thinking content from text with <think> tags or analysis channels
 */
export function extractThinkingContent(text: string): string | null {
  // Check for <think> tag format
  const thinkMatch = text.match(/<think>([\s\S]*?)(<\/think>|$)/)
  if (thinkMatch) {
    return thinkMatch[1].trim()
  }

  // Check for analysis channel format
  const analysisMatch = text.match(
    /<\|channel\|>analysis<\|message\|>([\s\S]*?)(<\|start\|>assistant<\|channel\|>final<\|message\|>|$)/
  )
  if (analysisMatch) {
    return analysisMatch[1].trim()
  }

  return null
}

/**
 * Get readable language name for code blocks
 */
export function getReadableLanguageName(language: string): string {
  const languageMap: { [key: string]: string } = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    php: 'PHP',
    rb: 'Ruby',
    ruby: 'Ruby',
    go: 'Go',
    rs: 'Rust',
    rust: 'Rust',
    swift: 'Swift',
    kt: 'Kotlin',
    kotlin: 'Kotlin',
    scala: 'Scala',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'Sass',
    less: 'Less',
    sql: 'SQL',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    ini: 'INI',
    sh: 'Shell',
    bash: 'Bash',
    zsh: 'Zsh',
    ps1: 'PowerShell',
    powershell: 'PowerShell',
    dockerfile: 'Dockerfile',
    docker: 'Dockerfile',
    markdown: 'Markdown',
    md: 'Markdown',
    txt: 'Text',
    text: 'Text',
  }
  return languageMap[language.toLowerCase()] || language
}

/**
 * Format date to readable string
 */
export function formatDate(timestamp: number): string {
  if (!timestamp || timestamp === 0) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMs / 3600000)
  const diffInDays = Math.floor(diffInMs / 86400000)

  if (diffInMinutes < 1) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

