import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Please define GEMINI_API_KEY in .env.local');

const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

function buildSystemInstruction(systemPrompt?: string) {
    if (!systemPrompt) return undefined;
    return {
        role: 'system',
        parts: [{ text: systemPrompt }],
    };
}

export function getFlashModel(systemPrompt?: string) {
    return genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        safetySettings,
        systemInstruction: buildSystemInstruction(systemPrompt),
    });
}

export function getProModel(systemPrompt?: string) {
    return genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        safetySettings,
        systemInstruction: buildSystemInstruction(systemPrompt),
    });
}

export { genAI };
