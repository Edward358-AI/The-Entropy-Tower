import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export const breakDownGoal = async (goal) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
    You are the "Architect" of an Entropy-fighting RPG system.
    The user has a goal: "${goal}".
    
    Break this into 3-8 specific "Micro-Quests" that take 5-15 minutes each.
    Each quest needs:
    - title: Brief, actionable, "RPG" flavored (e.g. "Locate the Artifact" instead of "Find book")
    - xp: 10-50 based on difficulty
    - deadlineOffset: Days from now (1-7)
    
    Return ONLY a valid JSON array. No markdown, no "json" label.
    Example:
    [
      { "title": "Scout the Terrain (Read Ch.1)", "xp": 20, "deadlineOffset": 1 },
      { "title": "Draft the Blueprint (Outline)", "xp": 30, "deadlineOffset": 2 }
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
      { title: `Manual Override: ${goal}`, xp: 100, deadlineOffset: 1 }
    ]
  }
}
