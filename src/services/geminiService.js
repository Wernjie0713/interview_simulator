import { GoogleGenerativeAI } from "@google/generative-ai";

// TODO: Replace with real API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
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

  async analyzeCV(text) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are an expert technical recruiter. Analyze the following CV text and provide a structured summary.
        Focus on:
        1. Key technical skills
        2. Years of experience (estimated)
        3. Major projects or achievements
        4. Potential weak points or areas to probe in an interview
        
        CV Text:
        ${text.substring(0, 10000)} // Limit text length just in case
      `;
      
      console.log("Gemini: Analyzing CV...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();
      console.log("Gemini: CV Analysis complete");
      return summary;
    } catch (error) {
      console.error("CV analysis failed:", error);
      return null;
    }
  },

  async getInterviewQuestion(context) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are a professional technical interviewer. 
        Your task is to generate exactly ONE interview question based on the provided context.
        
        Rules:
        1. Ask ONLY the question. Do not include greetings, pleasantries, or meta-text like "Here is a question".
        2. Do not ask multiple questions.
        3. Keep it concise and professional.
        4. If the context includes a CV, tailor the question to the candidate's experience.
        
        Context: ${context}
      `;
      console.log("Gemini: Requesting question for context:", context);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      console.log("Gemini: Generated question:", text);
      return text;
    } catch (error) {
      console.error("Failed to get question:", error);
      // If it's a 404, it's likely the API key or model name.
      return "Tell me about a time you faced a challenge at work.";
    }
  },

  async evaluateInterviewPerformance(fullTranscript, visualMetrics) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are an expert interview coach. Evaluate the candidate's performance based on the entire interview session.
        
        Full Interview Transcript:
        ${fullTranscript}
        
        Visual Behavior Metrics (Average for session): 
        ${JSON.stringify(visualMetrics)}
        
        Provide a JSON response with the following fields:
        - score (0-100): Overall performance score.
        - answerScore (0-100): Quality and relevance of the content across all answers.
        - clarityScore (0-100): Coherence, grammar, and structure of the speech.
        - confidenceScore (0-100): Based on the visual metrics provided and the assertiveness of the text.
        - feedback (Array of objects): Specific feedback points. Each object should have:
          - type: "positive" | "negative" | "info"
          - text: The feedback message.
        - keyInsights (Array of objects): 3-5 short, high-level observations. Each object should have:
          - type: "positive" | "warning" | "info"
          - text: A concise observation (e.g., "Great eye contact", "Spoke too fast").
        
        Return ONLY the JSON.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up markdown code blocks if present
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini evaluation failed:", error);
      // Fallback
      return {
        score: 75,
        answerScore: 70,
        clarityScore: 80,
        confidenceScore: 75,
        feedback: [{ type: "info", text: "Could not generate detailed feedback at this time." }],
        keyInsights: [{ type: "info", text: "Analysis unavailable." }]
      };
    }
  }
};
