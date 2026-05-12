import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// ─── Shared Helpers ──────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDateContext() {
  const today = new Date()
  return {
    dayName: DAY_NAMES[today.getDay()],
    dateStr: today.toLocaleDateString(),
  }
}

/**
 * Extract JSON array from AI response text.
 * Handles cases where the AI wraps output in markdown code blocks.
 */
function extractJSON(text) {
  try {
    // First, try stripping markdown code blocks if they exist
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7)
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3)
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3)
    }
    cleanText = cleanText.trim()
    
    // If it's still not valid, try the bracket fallback
    if (!cleanText.startsWith('[')) {
      const start = cleanText.indexOf('[')
      const end = cleanText.lastIndexOf(']') + 1
      if (start !== -1 && end !== 0) {
        cleanText = cleanText.substring(start, end)
      }
    }
    
    return JSON.parse(cleanText)
  } catch (err) {
    console.error("AI JSON Parse Error. Raw text was:", text)
    throw err
  }
}


// ─── Quick Quest Mode ────────────────────────────────────────

export const breakDownGoal = async (goal) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const { dayName, dateStr } = getDateContext()

  const prompt = `
    You are an AI game master assistant. Turn the user's natural language input into structured, actionable quests.
    
    SYSTEM CONTEXT:
    Today is ${dayName}, ${dateStr}.
    When calculating "deadlineOffset", use this current day as day 0.
    - If today is Tuesday, "due next Sunday" means 5 days from now (offset = 5).
    - "Tomorrow" means offset = 1.
    - "Today" means offset = 0.
    
    INSTRUCTIONS:
    1. EXTRACT core tasks. Ignore filler like "can you set a task called", "remind me to".
    2. INFER deadline offset relative to TODAY. Default to 1-3 days if none specified.
    3. INFER difficulty for XP (40 to 120). Simple (~40-60), Medium (~70-90), Hard (~100-120).
    4. BREAK DOWN input if multiple tasks are implied (e.g. "HW 53 and 54" -> two quests).
    
    Each quest object MUST have these fields:
    - reasoning (string): Your step-by-step thinking about difficulty, deadline, breakdown.
    - title (string): Short, clear, actionable title. NO conversational filler.
    - xp (integer): 40-120 based on difficulty.
    - deadlineOffset (integer): Days from today.
    - subtasks (optional array of strings): If the task naturally breaks into steps.
    
    Return ONLY a valid JSON array. No markdown, no code fences, no explanation.
    
    EXAMPLES:
    Input: "due next sunday, can you set a task called HW 53 and 54" (Assume today is Tuesday)
    Output: [
      {
        "reasoning": "User wants two tasks: HW 53 and HW 54. Medium difficulty school assignments (60 XP). Today is Tuesday, next Sunday is 5 days away.",
        "title": "HW 53",
        "xp": 60,
        "deadlineOffset": 5
      },
      {
        "reasoning": "Second part of the assignment.",
        "title": "HW 54",
        "xp": 60,
        "deadlineOffset": 5
      }
    ]
    
    Input: "remind me to call mom"
    Output: [
      {
        "reasoning": "Simple task, no deadline specified. Easy phone call (40 XP). Default to tomorrow.",
        "title": "Call Mom",
        "xp": 40,
        "deadlineOffset": 1
      }
    ]
    
    NOW PROCESS THIS INPUT:
    "${goal}"
  `

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return extractJSON(text)
  } catch (error) {
    console.error('AI Breakdown Failed:', error)
    return [
      { title: "AI Failed: Manual Entry Needed", xp: 40, deadlineOffset: 1 }
    ]
  }
}


// ─── Project Planner Mode ────────────────────────────────────

/**
 * Break down a large project into a timeline of quests.
 * Supports optional file attachments (PDFs, images) via Gemini multimodal.
 *
 * @param {string} description - Open-ended project description
 * @param {number} totalDays - Days until the final deadline
 * @param {File[]} files - Optional array of File objects (PDFs, images, etc.)
 * @returns {Promise<Array>} - Array of quest objects with timeline-distributed deadlines
 */
export const breakDownProject = async (description, totalDays, files = []) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const { dayName, dateStr } = getDateContext()

  const prompt = `
    You are an expert project planner and AI game master. The user has a project and needs you to break it down into a structured timeline of actionable quests.
    
    SYSTEM CONTEXT:
    Today is ${dayName}, ${dateStr}.
    The project's FINAL DEADLINE is in ${totalDays} day(s) from today.
    "deadlineOffset" = days from today. The maximum offset must be <= ${totalDays}.
    
    PROJECT DESCRIPTION:
    "${description}"
    
    ${files.length > 0 ? 'The user has also attached file(s) with additional project details (syllabus, rubric, instructions, etc.). Read them carefully and use their contents to inform your task breakdown.' : ''}
    
    Each quest object MUST have these fields:
    - reasoning (string): Your step-by-step thinking about this task.
    - title (string): Specific, actionable title — NOT vague like "Work on project".
    - xp (integer): 40-120 based on difficulty. Research = 40-60. Writing/creating = 70-90. Major deliverables = 100-120.
    - deadlineOffset (integer): Days from today. Must be <= ${totalDays}.
    - subtasks (optional array of strings): Break complex steps into concrete actions.
    
    INSTRUCTIONS:
    1. ANALYZE the project scope. Understand the final deliverable and required steps.
    2. BREAK DOWN into 3-10 sequential quests mapping a realistic timeline.
    3. DISTRIBUTE deadlines evenly across ${totalDays} day(s). Don't front-load. Reserve last 1-2 days for review.
    4. ADD SUBTASKS for complex quests.
    
    TIMELINE STRATEGY:
    - Early days: Research, reading, gathering materials
    - Middle: Core work (writing, building, creating)
    - Final days: Review, polish, formatting, submission
    
    Return ONLY a valid JSON array. No markdown, no code fences, no explanation.
    
    EXAMPLE:
    Project: "History research paper, 8 pages, due in 10 days"
    Output: [
      {
        "reasoning": "Start with topic selection and initial research. Planning task (50 XP). Due day 1.",
        "title": "Choose topic & find 5 sources",
        "xp": 50,
        "deadlineOffset": 1,
        "subtasks": ["Browse topic options", "Select final topic", "Find 5 credible sources", "Save citations"]
      },
      {
        "reasoning": "Read and take notes. Medium difficulty (60 XP). Due day 3.",
        "title": "Read sources & take notes",
        "xp": 60,
        "deadlineOffset": 3,
        "subtasks": ["Read source 1-2", "Read source 3-5", "Highlight key quotes", "Organize notes by theme"]
      },
      {
        "reasoning": "Create essay structure. Planning task (50 XP). Due day 4.",
        "title": "Write detailed outline",
        "xp": 50,
        "deadlineOffset": 4,
        "subtasks": ["Draft thesis statement", "Plan introduction", "Outline body paragraphs", "Plan conclusion"]
      },
      {
        "reasoning": "Write first half. Hard task (100 XP). Due day 6.",
        "title": "Draft pages 1-4",
        "xp": 100,
        "deadlineOffset": 6
      },
      {
        "reasoning": "Write second half. Hard task (100 XP). Due day 8.",
        "title": "Draft pages 5-8",
        "xp": 100,
        "deadlineOffset": 8
      },
      {
        "reasoning": "Final review. Medium task (70 XP). Due day 9, leaving buffer.",
        "title": "Revise, proofread & format",
        "xp": 70,
        "deadlineOffset": 9,
        "subtasks": ["Proofread for grammar", "Check citations", "Format per requirements", "Final read-through"]
      }
    ]
    
    NOW PLAN THIS PROJECT:
  `

  try {
    // Build the content parts array for multimodal input
    const parts = [{ text: prompt }]

    // Add file attachments as inline data (images, PDFs)
    for (const file of files) {
      const base64 = await fileToBase64(file)
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: base64,
        }
      })
    }

    const result = await model.generateContent(parts)
    const text = result.response.text()
    return extractJSON(text)
  } catch (error) {
    console.error('AI Project Breakdown Failed:', error)
    return [
      { title: "AI Failed: Manual Entry Needed", xp: 40, deadlineOffset: 1 }
    ]
  }
}


// ─── File Utilities ──────────────────────────────────────────

/**
 * Convert a File object to a base64 string (without the data:... prefix).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Strip the "data:...;base64," prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
