const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const env = fs.readFileSync(".env", "utf-8");
const key = env.match(/GEMINI_API_KEY=(.*)/)[1].replace(/["\047 ]/g, "");
const ai = new GoogleGenAI({ apiKey: key });

const models = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview"
];

async function checkModels() {
  for (const model of models) {
    try {
      await ai.models.generateContent({ model, contents: "test" });
      console.log(`[PASS] ${model}`);
    } catch(err) {
      console.log(`[FAIL] ${model}: ${err.message}`);
    }
  }
}
checkModels();
