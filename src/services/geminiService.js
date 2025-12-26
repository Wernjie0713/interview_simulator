import { GoogleGenerativeAI } from "@google/generative-ai";

// TODO: Replace with real API key
const API_KEY = "AIzaSyDl8qftUGf_1_4ht9lhpC4dW_FdzDgbhmE";
const genAI = new GoogleGenerativeAI(API_KEY); // Default is usually fine, but let's try to be explicit if needed.
// Actually, the SDK usually handles this. Let's try changing the model name back to "gemini-1.5-flash" 
// and see if specifying the version helps if I can. 
// The SDK doesn't easily expose apiVersion in the constructor in all versions.
// Let's try "gemini-pro" as a fallback.

export const geminiService = {
  async analyzeFrame(imageData, prompt) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      console.log("Gemini: Analyzing frame with prompt:", prompt);
      
      const part = {
        inlineData: {
          data: imageData.split(",")[1],
          mimeType: "image/jpeg"
        }
      };

      const result = await model.generateContent([prompt, part]);
      const response = await result.response;
      const text = response.text();
      console.log("Gemini: Analysis result:", text);
      return text;
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      return null;
    }
  },

  async getInterviewQuestion(context) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `You are a professional interviewer. Based on the context: ${context}, ask one tough behavioral interview question. Keep it concise.`;
      console.log("Gemini: Requesting question for context:", context);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Gemini: Generated question:", text);
      return text;
    } catch (error) {
      console.error("Failed to get question:", error);
      // If it's a 404, it's likely the API key or model name.
      return "Tell me about a time you faced a challenge at work.";
    }
  }
};
