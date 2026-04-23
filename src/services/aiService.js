import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export const breakDownGoal = async (goal) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `
    You are an AI assistant. Turn the user's input into actionable quests.
    The user's input: "${goal}"
    
    Go exactly with what the user says and add little interpretation.
    If they say to add subtasks, add subtasks as an array of strings.
    If they don't specify how many quests, break it into whatever makes natural sense based on their input.
    
    Each quest needs:
    - title: Short, clear, and actionable.
    - xp: 40-150 based on task difficulty (if the user does not specify).
    - deadlineOffset: Days from now (1-7).
    - subtasks: (Optional) An array of strings if they asked for subtasks.
    
    Return ONLY a valid JSON array. No markdown, no "json" label.
    Example:
    [
      { "title": "Write History Essay", "xp": 100, "deadlineOffset": 3, "subtasks": ["Research topic", "Write outline", "Draft introduction"] }
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
