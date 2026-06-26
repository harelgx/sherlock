import { useEffect, useRef, useState } from 'react'
import type { EnrichedError } from './types'

export type TaggedError = EnrichedError & { _id: number }

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useErrorFeed(url: string) {
  const [errors, setErrors] = useState<TaggedError[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextId = useRef(0)

  useEffect(() => {
    let destroyed = false

    function connect() {
      if (destroyed) return
      setStatus('connecting')
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!destroyed) setStatus('connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as EnrichedError
          if (!msg.context) return
          if (!destroyed) setErrors(prev => [{ ...msg, _id: nextId.current++ }, ...prev])
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        if (destroyed) return
        setStatus('disconnected')
        retryTimer.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      destroyed = true
      if (retryTimer.current) clearTimeout(retryTimer.current)
      wsRef.current?.close()
    }
  }, [url])

  return { errors, status }
}
