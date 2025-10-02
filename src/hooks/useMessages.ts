import { useState, useCallback } from 'react'

export interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp?: number
}

export function useMessages(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const updateMessage = useCallback((id: string, text: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text } : msg))
    )
  }, [])

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }, [])

  const getMessages = useCallback(() => {
    return messages
  }, [messages])

  return {
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
    getMessages,
  }
}

