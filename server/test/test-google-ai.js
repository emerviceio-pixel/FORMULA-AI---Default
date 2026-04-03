// test-gemini.js
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

async function test() {
  try {
    const gemini = new GoogleGenAI({});
    
    console.log("Sending request to Gemini API...");
    
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "What is the capital of Ghana?"
    });
    
    // ✅ Extract text correctly
    const text = response.candidates[0].content.parts[0].text;
    console.log("✅ Success:", text.trim());
    
  } catch (error) {
    console.error("❌ Gemini API Test Failed:", error.message);
  }
}

test();