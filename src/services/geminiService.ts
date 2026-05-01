import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface JobRecommendation {
  title: string;
  matchScore: number;
  reasoning: string;
  skillsToHighlight: string[];
}

export async function getResumeResponse(resumeText: string, query: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `You are a professional resume assistant. Use the following resume content as your ONLY source of information for the query. If the answer isn't in the resume, explicitly say so.\n\nRESUME CONTENT:\n${resumeText}\n\nQUERY: ${query}` }]
      }
    ],
    config: {
      temperature: 0.1, // Low temperature for factual RAG
    }
  });

  return response.text || "I was unable to find that information in the resume.";
}

export async function getJobRecommendations(resumeText: string): Promise<JobRecommendation[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `Analyze the following resume and recommend 3 ideal job profiles. Return the response in JSON format.\n\nRESUME:\n${resumeText}` }]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            matchScore: { type: Type.NUMBER, description: "Scale 0-100" },
            reasoning: { type: Type.STRING },
            skillsToHighlight: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "matchScore", "reasoning", "skillsToHighlight"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse recommendations", e);
    return [];
  }
}
