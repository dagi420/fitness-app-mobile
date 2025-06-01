require('dotenv').config();
const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require('@google/genai');

console.log('Attempting to initialize GoogleGenAI...');
try {
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
  console.log('GoogleGenAI initialized successfully.');
  console.log('HarmCategory available:', !!HarmCategory);
  console.log('HarmBlockThreshold available:', !!HarmBlockThreshold);

  if (genAI && typeof genAI.getGenerativeModel === 'function') {
    console.log('getGenerativeModel method exists.');
  } else {
    console.error('getGenerativeModel method does NOT exist or genAI is not as expected.');
  }

} catch (e) {
  console.error('Error during GoogleGenAI initialization or test:', e);
}

console.log('--- Module structure investigation ---');
const GoogleGenAIMeta = require('@google/genai');
console.log('Type of require("@google/genai"):', typeof GoogleGenAIMeta);
console.log('Keys in require("@google/genai"):', Object.keys(GoogleGenAIMeta));
console.log('Is GoogleGenAI a key?', GoogleGenAIMeta.hasOwnProperty('GoogleGenAI'));
if (GoogleGenAIMeta.hasOwnProperty('GoogleGenAI')) {
    console.log('Type of GoogleGenAIMeta.GoogleGenAI:', typeof GoogleGenAIMeta.GoogleGenAI);
} 