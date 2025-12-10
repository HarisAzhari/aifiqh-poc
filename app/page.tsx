'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Home() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [streamingContent, setStreamingContent] = useState('')
  const [scholarAnalysis, setScholarAnalysis] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

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
      // Build payload with scholar_analysis parameter
      const payload = { 
        question: question,
        scholar_analysis: scholarAnalysis,
        enable_functions: true
      }
      
      const response = await fetch('https://ai-server-staging.aifiqh.com/ai-fiqh-scholar/generate', {
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
    "What are the benefits of artificial intelligence?",
    "Explain quantum computing in simple terms",
    "How does blockchain technology work?",
    "What is the future of renewable energy?"
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 flex items-center gap-3">
                <span className="text-4xl">🤖</span>
                <span>AI Assistant</span>
              </h1>
              <p className="text-sm text-blue-600 mt-1">
                Powered by Advanced AI • Smart & Helpful
              </p>
            </div>
            <div className="text-right">
              <div className="flex gap-2 text-xs">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Fast</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">Accurate</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">Helpful</span>
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
              <div className="text-8xl mb-6">💬</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                How can I help you today?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Ask me anything! I&apos;m here to provide helpful, accurate answers to your questions
              </p>
              
              {/* Suggested Questions */}
              <div className="max-w-3xl mx-auto">
                <p className="text-sm text-gray-500 mb-4 font-medium">Suggested Questions:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuestion(q)}
                      className="p-4 bg-white border-2 border-blue-200 rounded-xl text-left hover:border-blue-400 hover:shadow-md transition text-sm text-gray-700 group"
                    >
                      <span className="text-blue-600 mr-2 group-hover:scale-110 inline-block transition">💡</span>
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
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                      : 'bg-white border-2 border-gray-200 rounded-2xl rounded-tl-sm'
                  } p-6 shadow-lg`}
                >
                  {message.role === 'user' ? (
                    <div>
                      <p className="font-semibold mb-2 text-blue-100 text-sm">You</p>
                      <p className="text-lg leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    <div className="prose prose-blue max-w-none">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🤖</span>
                        <span className="font-bold text-blue-800">AI Assistant</span>
                      </div>
                      <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
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
                <div className="max-w-4xl bg-white border-2 border-blue-200 rounded-2xl rounded-tl-sm p-6 shadow-lg">
                  <div className="prose prose-blue max-w-none">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🤖</span>
                      <span className="font-bold text-blue-800">AI Assistant</span>
                      <div className="ml-2 flex gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
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
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-200 focus-within:border-blue-400 transition">
                {/* Scholar Analysis Toggle */}
                <div className="px-6 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span>🎓</span>
                      <span>Scholar Analysis Mode</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setScholarAnalysis(!scholarAnalysis)}
                      disabled={loading}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${scholarAnalysis ? 'bg-blue-600' : 'bg-gray-300'}
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${scholarAnalysis ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {scholarAnalysis 
                      ? '✓ Using 6-framework deep analysis' 
                      : 'Simple response mode'}
                  </p>
                </div>
                
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask me anything..."
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
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <span>✨</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              Powered by Gemini 2.0 Flash • RAG with ChromaDB
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
