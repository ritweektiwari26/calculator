
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const explainCalculation = async (expression: string, result: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the calculation "${expression} = ${result}" in a simple, educational way for a student. Keep it concise.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I couldn't generate an explanation at this time.";
  }
};

export const solveComplexMath = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a math expert. Solve the following query: "${query}". 
      Return the final numeric result and a brief step-by-step explanation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            numericResult: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["numericResult", "explanation"]
        }
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Solver Error:", error);
    throw new Error("I had trouble solving that complex query.");
  }
};
