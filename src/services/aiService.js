import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export const breakDownGoal = async (goal) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `
    You are a task breakdown assistant.
    The user has a goal: "${goal}".
    
    Break this into 3-8 specific micro-tasks that take 5-15 minutes each.
    Each task needs:
    - title: Short, clear, and actionable. NO dramatic/RPG prefixes like "The Physics Enigma" or "Locate the Artifact". Just say exactly what to do, e.g. "Read Chapter 1", "Write intro paragraph", "Review lecture notes".
    - xp: 5-35 based on difficulty. Be conservative — most tasks should be 10-20 XP. Only give 30+ for genuinely hard tasks.
    - deadlineOffset: Days from now (1-7)
    
    Return ONLY a valid JSON array. No markdown, no "json" label.
    Example:
    [
      { "title": "Read Chapter 1", "xp": 15, "deadlineOffset": 1 },
      { "title": "Write outline for essay", "xp": 20, "deadlineOffset": 2 }
    ]
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Improved cleaning: Find the first '[' and the last ']'
    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']') + 1

    if (jsonStart === -1 || jsonEnd === 0) throw new Error("No JSON array found in response")

    const cleanText = text.substring(jsonStart, jsonEnd)
    return JSON.parse(cleanText)
  } catch (error) {
    console.error('AI Breakdown Failed:', error)
    return [
      { title: `${goal}`, xp: 20, deadlineOffset: 1 }
    ]
  }
}
