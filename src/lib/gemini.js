const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export async function askGemini(userMessage, documentText = '', history = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')

  const systemPrompt = documentText
    ? `You are Oshi, an expert AI document analyst. The user has uploaded a document. Answer questions about it with precision, cite page/section references when possible, and be concise but thorough. Here is the document content:\n\n---\n${documentText}\n---`
    : `You are Oshi, an expert AI assistant. Help the user with their questions.`

  const contents = []
  history.forEach(msg => {
    contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })
  })
  contents.push({ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser question: ${userMessage}` }] })

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.4, topK: 32, topP: 1, maxOutputTokens: 2048 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message || 'Gemini API error')
  }
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.'
}

export async function summarizeDocument(documentText, fileName) {
  return askGemini(
    `Please provide a comprehensive summary of this document titled "${fileName}". Include: 1) Main purpose/topic, 2) Key findings or points, 3) Important data or figures, 4) Conclusions or recommendations.`,
    documentText, []
  )
}
