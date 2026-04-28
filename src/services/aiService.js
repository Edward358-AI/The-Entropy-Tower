import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export const breakDownGoal = async (goal) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `
    You are an AI game master assistant. Turn the user's natural language input into structured, actionable quests.
    The user's input: "${goal}"
    
    Instructions:
    1. EXTRACT the actual core tasks. Strip away conversational filler like "can you set a task called", "remind me to", etc.
    2. INFER the deadline offset. If they say "due next sunday", "in 3 days", or "tomorrow", calculate the approximate number of days from today. If no time is specified, default to 1-3 days depending on the task's implied urgency.
    3. INFER difficulty for XP. Assign an XP value between 40 and 120. Simple tasks (e.g. "read an article") should be ~40-60 XP. Medium tasks (e.g. "write a short essay") should be ~70-90 XP. Hard tasks (e.g. "study for finals") should be ~100-120 XP.
    4. BREAK DOWN the input. If the user implies multiple tasks (e.g. "HW 53 and 54"), create separate quests for each or add them as subtasks if that makes more sense.
    
    Each quest needs:
    - title: Short, clear, and actionable (e.g. "HW 53" instead of "can you set a task called HW 53").
    - xp: 40-120 based on inferred difficulty.
    - deadlineOffset: Days from now (integer).
    - subtasks: (Optional) An array of strings if they asked for subtasks or if the task naturally breaks down into steps.
    
    Return ONLY a valid JSON array. No markdown, no "json" label.
    Example:
    [
      { "title": "HW 53", "xp": 50, "deadlineOffset": 7 },
      { "title": "HW 54", "xp": 50, "deadlineOffset": 7 }
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
      { title: "AI Failed: Manual Entry Needed", xp: 40, deadlineOffset: 1 }
    ]
  }
}
