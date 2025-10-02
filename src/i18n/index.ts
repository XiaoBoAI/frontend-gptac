import { zhCN } from './zh-CN'

type TranslationKeys = typeof zhCN

let currentLocale: 'zh-CN' = 'zh-CN'
const translations: Record<string, TranslationKeys> = {
  'zh-CN': zhCN
}

export function useTranslation() {
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[currentLocale]
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }
    
    return typeof value === 'string' ? value : key
  }
  
  return { t }
}

export function setLocale(locale: 'zh-CN') {
  currentLocale = locale
}

