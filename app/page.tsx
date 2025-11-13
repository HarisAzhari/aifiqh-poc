'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const frameworks = [
  { id: "Taswīr", label: "Taswīr (تصوير)", subtitle: "Description" },
  { id: "Taḥkīm", label: "Taḥkīm (تحكيم)", subtitle: "Ruling" },
  { id: "Tadlīl", label: "Tadlīl (تدليل)", subtitle: "Evidence" },
  { id: "Ta'līl", label: "Ta'līl (تعليل)", subtitle: "Reasoning" },
  { id: "Tafri'", label: "Tafri' (تفريع)", subtitle: "Branching" },
  { id: "Tamsīl", label: "Tamsīl (تمثيل)", subtitle: "Examples" }
]

export default function Home() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [streamingContent, setStreamingContent] = useState('')
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(
    frameworks.map(f => f.id) // All enabled by default
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const toggleFramework = (frameworkId: string) => {
    setSelectedFrameworks(prev => {
      if (prev.includes(frameworkId)) {
        return prev.filter(id => id !== frameworkId)
      } else {
        return [...prev, frameworkId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setLoading(true)
    setError('')
    setStreamingContent('')

    try {
      // Build payload - only include frameworks if any are selected
      const payload: { question: string; frameworks?: string[] } = { 
        question: question 
      }
      
      if (selectedFrameworks.length > 0) {
        payload.frameworks = selectedFrameworks
      }
      
      const response = await fetch('https://ai-server.aifiqh.com/ai-fiqh-scholar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to connect to API')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk
          setStreamingContent(fullResponse)
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
        setStreamingContent('')
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure Flask server is running on port 5050')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    "What is the ruling on cryptocurrency according to the four mazahib?",
    "Explain the conditions of wudu in each mazhab",
    "What are the differences in prayer times between the mazahib?",
    "How do the four schools view interest-based transactions?"
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-emerald-800 flex items-center gap-3">
                <span className="text-4xl">🕌</span>
                <span>AI Fiqh Scholar</span>
              </h1>
              <p className="text-sm text-emerald-600 mt-1">
                6 Usuli Framework • 4 Mazahib Analysis
              </p>
            </div>
            <div className="text-right">
              <div className="flex gap-2 text-xs">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Hanafi</span>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">Maliki</span>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full font-medium">Shafi&apos;i</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Hanbali</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Chat Messages */}
        <div className="pb-96">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📚</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Ask Your Fiqh Question
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Get comprehensive answers using the 6 Usuli Framework across all four major Mazahib
                with authentic source citations from classical texts
              </p>
              
              {/* Suggested Questions */}
              <div className="max-w-3xl mx-auto">
                <p className="text-sm text-gray-500 mb-4 font-medium">Suggested Questions:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuestion(q)}
                      className="p-4 bg-white border-2 border-emerald-200 rounded-xl text-left hover:border-emerald-400 hover:shadow-md transition text-sm text-gray-700 group"
                    >
                      <span className="text-emerald-600 mr-2 group-hover:scale-110 inline-block transition">💡</span>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message List */}
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-4xl ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm'
                      : 'bg-white border-2 border-gray-200 rounded-2xl rounded-tl-sm'
                  } p-6 shadow-lg`}
                >
                  {message.role === 'user' ? (
                    <div>
                      <p className="font-semibold mb-2 text-emerald-100 text-sm">Your Question</p>
                      <p className="text-lg leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    <div className="prose prose-emerald max-w-none">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🎓</span>
                        <span className="font-bold text-emerald-800">Scholar Response</span>
                      </div>
                      <div className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming Response */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-4xl bg-white border-2 border-emerald-200 rounded-2xl rounded-tl-sm p-6 shadow-lg">
                  <div className="prose prose-emerald max-w-none">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🎓</span>
                      <span className="font-bold text-emerald-800">Scholar Response</span>
                      <div className="ml-2 flex gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
                      {streamingContent}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pb-6 pt-8">
          <div className="max-w-4xl mx-auto px-6">
            {error && (
              <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-200 focus-within:border-emerald-400 transition">
                {/* Framework Toggles */}
                <div className="px-6 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span>📚</span>
                      <span>Usuli Framework Selection</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {selectedFrameworks.length} of 6 selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {frameworks.map((framework) => {
                      const isSelected = selectedFrameworks.includes(framework.id)
                      return (
                        <button
                          key={framework.id}
                          type="button"
                          onClick={() => toggleFramework(framework.id)}
                          disabled={loading}
                          className={`
                            px-3 py-2 rounded-lg border-2 transition-all text-left text-xs
                            ${isSelected 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' 
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                              ${isSelected 
                                ? 'bg-emerald-500 border-emerald-500' 
                                : 'bg-white border-gray-300'
                              }
                            `}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold truncate ${isSelected ? 'text-emerald-800' : 'text-gray-600'}`}>
                                {framework.id}
                              </div>
                              <div className={`text-[10px] ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {framework.subtitle}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a fiqh question... (e.g., What is the ruling on digital currencies?)"
                  className="w-full px-6 py-4 rounded-2xl resize-none focus:outline-none text-gray-800 placeholder-gray-400"
                  rows={3}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <div className="flex items-center justify-between px-6 pb-4">
                  <div className="text-xs text-gray-500">
                    Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Enter</kbd> to send, <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Shift + Enter</kbd> for new line
                  </div>
                  <button
                    type="submit"
                    disabled={!question.trim() || loading}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Ask Scholar</span>
                        <span>📖</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              Powered by Gemini 2.0 Flash • RAG with ChromaDB • 6 Usuli Framework
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}