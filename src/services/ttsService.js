// TODO: Replace with real API key or Cloud Function URL
const API_KEY = "AIzaSyA_gxGtg1nK_uXBuqaC9lPk9_zxdN5kwmg";

export const ttsService = {
  async speak(text) {
    try {
      console.log("TTS: Synthesizing text:", text);
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "en-US", name: "en-US-Neural2-F" },
          audioConfig: { audioEncoding: "MP3" },
        }),
      });

      const data = await response.json();
      if (data.audioContent) {
        console.log("TTS: Audio synthesized successfully.");
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
      } else {
        console.warn("TTS: No audio content returned.", data);
      }
    } catch (error) {
      console.error("TTS failed:", error);
    }
  }
};
