
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateModuleDescription = async (title: string, role: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional and encouraging training module description for a church volunteer role.
      Title: ${title}
      Role: ${role}
      Keep it under 3 sentences.`,
    });
    // Access the generated text directly via the .text property.
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate description.";
  }
};
