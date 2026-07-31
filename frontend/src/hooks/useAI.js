import { useState, useCallback } from 'react'
import api from '../utils/api'

export const useAI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const callAI = useCallback(async (endpoint, payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/ai/${endpoint}`, payload)
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const summarize = (text, maxLength) => callAI('summarize', { text, maxLength })
  const analyzeSentiment = (text) => callAI('sentiment', { text })
  const suggestReplies = (context) => callAI('replies', { context })
  const extractEntities = (text) => callAI('entities', { text })
  const getInsights = async () => {
    setLoading(true)
    try {
      const res = await api.get('/ai/insights')
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, summarize, analyzeSentiment, suggestReplies, extractEntities, getInsights }
}
