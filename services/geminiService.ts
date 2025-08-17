import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

const getPrompt = (language: string): string => {
  const languageMap: { [key: string]: string } = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
  };
  const targetLanguage = languageMap[language] || 'English';
  
  return `You are an expert in American Sign Language (ASL). Identify the gesture in the image.
Respond with ONLY the name of the gesture in ${targetLanguage}.
The response should be 1-3 words.
For example, if the gesture is "Hello" and the target language is Hindi, you must only respond with "नमस्ते".
If there is no clear ASL gesture, return an empty string. Do not add any explanation.`;
};


/**
 * Sends an image frame to the Gemini API to recognize sign language.
 * @param imageBase64 The base64 encoded image data string (without the data URL prefix).
 * @param language The target language for the output ('en', 'hi', 'mr').
 * @returns The recognized and translated text or an empty string.
 */
export const recognizeSignLanguage = async (imageBase64: string, language: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    };

    const textPart = {
      text: getPrompt(language),
    };

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [imagePart, textPart] }],
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.2,
        topK: 10,
      }
    });
    
    const text = response.text.trim().replace(/["*]/g, ''); // Clean up potential markdown
    return text;

  } catch (error) {
    console.error("Error recognizing sign language:", error);
    return ""; 
  }
};
