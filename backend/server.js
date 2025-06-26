require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai'); // For OpenAI API

const app = express();
const port = process.env.PORT || 5000; // Render will provide PORT, use 5000 for local development

// --- Middleware ---
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- OpenAI API Initialization ---
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables! Please set it and restart the server.");
    // process.exit(1); // Keep this commented for development
}
const openai = new OpenAI({
    apiKey: openaiApiKey,
});

// Function to clean individual text items (e.g., list items)
const cleanAndTrimText = (text) => {
    if (typeof text !== 'string') return ""; // Ensure it's a string before attempting string methods
    // Remove leading dashes, numbers, emojis, and common bullet points/symbols
    return text.replace(/^- /, '') // Remove leading dash and space
               .replace(/(\d+\.?\s*[\-\.]?\s*)/g, '') // Remove numbers (e.g., "1.", "2. ") and their separators
               .replace(/[🔥⚠️🧭❤️🧠🗣️✅•]/g, '') // Remove emojis and common bullet symbols
               .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
               .trim();
};

// Define default empty structured object for reliable frontend rendering
const defaultStructuredDescription = {
    general_summary: "",
    strengths: [],
    challenges: [],
    career_advice: [],
    relationship_tips: [],
    self_improvement_habits: [],
    coach_message: ""
};

// Define defaultStructuredDescriptionKeys globally for consistent mapping in regex fallback
const defaultStructuredDescriptionKeys = Object.keys(defaultStructuredDescription);


// --- API Endpoint for Personality Description Generation ---
app.post('/api/generate-description', async (req, res) => {
    const { personalityType, descriptionPrompt } = req.body;

    if (!personalityType || !descriptionPrompt) {
        return res.status(400).json({ error: "Missing personalityType or descriptionPrompt in request body" });
    }

    try {
        console.log(`Generating description for type: ${personalityType}`);
        console.log("Prompt sent to OpenAI:\n", descriptionPrompt);

        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-4", // Using GPT-4 as agreed for better adherence
            messages: [
                {
                    role: "system",
                    content: `তুমি একজন অত্যন্ত দক্ষ এবং অভিজ্ঞ বাংলা ভাষাভাষী জীবন-পরামর্শক। তোমার উত্তরটি একটি বৈধ JSON অবজেক্ট হিসেবে প্রদান করবে, কোনো অতিরিক্ত ভূমিকা বা উপসংহার ছাড়া। কোনো ইমোজি, প্রতীক বা অপ্রয়োজনীয় ইংরেজি শব্দ ব্যবহার করবে না। JSON অবজেক্টের কী (keys) এবং তাদের মান (values) নিম্নলিখিত কাঠামো কঠোরভাবে অনুসরণ করবে:
                    {
                      "general_summary": "string",
                      "strengths": [{"name": "string", "explanation": "string"}, ...],
                      "challenges": [{"description": "string", "advice": "string"}, ...],
                      "career_advice": [{"field": "string", "reason": "string", "action": "string"}, ...],
                      "relationship_tips": [{"general_behavior": "string", "tip": "string"}],
                      "self_improvement_habits": [{"habit": "string", "benefit": "string"}, ...],
                      "coach_message": "string"
                    }
                    
                    ⚠️ গুরুত্বপূর্ণ: তুমি পুরো JSON অবজেক্টকে আবার কোনো ভ্যালু হিসেবে দেবে না। প্রতিটি কী (key) এর মান (value) হবে আলাদা তথ্য — একটি JSON অবজেক্টের ভিতরে আরেকটি সম্পূর্ণ JSON অবজেক্ট দেবে না। প্রতিটি স্ট্রিং ভ্যালু শুধুমাত্র বাংলায় লিখবে। তালিকাগুলো অবজেক্টের অ্যারে (array of objects) হবে, যেখানে প্রতিটি অবজেক্টের মধ্যে সঠিক কী (যেমন name, explanation, description, advice, field, reason, action, general_behavior, tip, habit, benefit) থাকবে এবং তাদের মান বাংলায় উপযুক্ত তথ্য দেবে।`
                },
                {
                    role: "user",
                    content: `ব্যক্তিত্ব টাইপ: ${personalityType}\n\nউপরের কাঠামো অনুযায়ী এই টাইপের বিস্তারিত বর্ণনা দাও।`
                }
            ],
            response_format: { type: "json_object" }, // Forces JSON output
            max_tokens: 1500,
            temperature: 0.7,
        });

        const aiGeneratedRawText = chatCompletion.choices[0].message.content;
        console.log("AI Raw Text Received:\n", aiGeneratedRawText);

        let finalParsedData = { ...defaultStructuredDescription }; // Start with default structure

        // --- Stage 1: Attempt Strict JSON Parsing ---
        try {
            // Aggressively find potential JSON object in the raw text
            // This regex tries to find a JSON object that might be wrapped in other text
            const jsonMatch = aiGeneratedRawText.match(/```json\s*([\s\S]*?)\s*```/i) || aiGeneratedRawText.match(/\{[\s\S]*\}/);
            let rawJsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiGeneratedRawText;

            // Attempt to fix common JSON errors before parsing
            rawJsonString = rawJsonString.replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas before ] or }
            rawJsonString = rawJsonString.replace(/[\r\n]+/g, ''); // Remove newlines (might help with parsing)
            
            // Re-attempt parse with the (hopefully) cleaner string
            const parsedJson = JSON.parse(rawJsonString);
            console.log("Successfully parsed AI response as JSON.");

            // Apply cleanAndTrimText to all string values in the parsed JSON
            for (const key in parsedJson) {
                // Ensure the value is not another object when it should be a string
                if (typeof parsedJson[key] === 'string') {
                    finalParsedData[key] = cleanAndTrimText(parsedJson[key]);
                } else if (Array.isArray(parsedJson[key])) {
                    finalParsedData[key] = parsedJson[key].map(item => {
                        if (typeof item === 'string') return cleanAndTrimText(item);
                        if (typeof item === 'object' && item !== null) {
                            const cleanedItem = {};
                            for (const subKey in item) {
                                cleanedItem[subKey] = cleanAndTrimText(item[subKey]);
                            }
                            return cleanedItem;
                        }
                        return item; // Return non-string/non-object as is
                    }).filter(item => {
                        // Filter out empty strings or objects where all values are empty after cleaning
                        if (typeof item === 'string') return item.length > 0;
                        if (typeof item === 'object' && item !== null) return Object.values(item).some(val => typeof val === 'string' ? val.length > 0 : true);
                        return false;
                    });
                } else if (typeof parsedJson[key] === 'object' && parsedJson[key] !== null) {
                    // If an object is found where a string was expected (e.g., general_summary is an object),
                    // set it to default. This prevents the entire JSON blob being assigned.
                    if (['general_summary', 'coach_message'].includes(key)) {
                        finalParsedData[key] = defaultStructuredDescription[key];
                        console.warn(`Key ${key} was an unexpected object. Set to default.`);
                    } else {
                        finalParsedData[key] = parsedJson[key]; // Keep other unexpected objects for now
                    }
                }
            }

            // If JSON parsing was successful and yielded some data, we are done
            return res.json({ description: finalParsedData });

        } catch (jsonParseError) {
            console.warn("AI response was not perfect JSON. Falling back to robust regex parsing...", jsonParseError.message);
            console.error("JSON Parse Error Details:", jsonParseError);
            console.error("Problematic AI Raw Text:", aiGeneratedRawText);

            // --- Stage 2: Robust Regex Fallback if JSON Parsing Fails ---
            let regexParsedDescription = { ...defaultStructuredDescription }; // Use this for regex results
            
            const sectionHeaders = [
                "আপনার ব্যক্তিত্বের সারসংক্ষেপ:",
                "আপনার ৫টি প্রধান শক্তি:",
                "আপনার ৩টি চ্যালেঞ্জ:",
                "ক্যারিয়ার পরামর্শ:",
                "সম্পর্ক ও বন্ধুত্ব:",
                "আত্মউন্নয়নের অভ্যাস:",
                "কোচের বার্তা:",
            ];

            let lastHeaderIndex = 0;
            for (let i = 0; i < sectionHeaders.length; i++) {
                const currentHeader = sectionHeaders[i];
                const nextHeader = sectionHeaders[i + 1];
                const currentKey = defaultStructuredDescriptionKeys[i]; // Access from global array
                
                const escapedCurrentHeader = currentHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                let regex;
                if (nextHeader) {
                    const escapedNextHeader = nextHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    regex = new RegExp(`${escapedCurrentHeader}([\\s\\S]*?)(?=${escapedNextHeader})`, 'i');
                } else {
                    regex = new RegExp(`${escapedCurrentHeader}([\\s\\S]*)$`, 'i'); // Last section, match till end
                }

                const match = aiGeneratedRawText.substring(lastHeaderIndex).match(regex);

                if (match && match[1]) {
                    let rawContent = match[1].trim();

                    if (currentKey === 'general_summary' || currentKey === 'coach_message') {
                        regexParsedDescription[currentKey] = cleanAndTrimText(rawContent);
                    } else {
                        const items = rawContent.split('\n')
                                                .map(line => cleanAndTrimText(line))
                                                .filter(line => line.length > 0);
                        
                        // Attempt to structure list items into objects (e.g., "Name: Explanation")
                        regexParsedDescription[currentKey] = items.map(item => {
                            if (item.includes(':')) {
                                const parts = item.split(':');
                                // Custom logic for different list item structures
                                if (currentKey === 'strengths') return { name: cleanAndTrimText(parts[0]), explanation: cleanAndTrimText(parts.slice(1).join(':')) };
                                if (currentKey === 'challenges') return { description: cleanAndTrimText(parts[0]), advice: cleanAndTrimText(parts.slice(1).join(':')) };
                                if (currentKey === 'career_advice' && parts.length >= 2) return { field: cleanAndTrimText(parts[0]), reason: cleanAndTrimText(parts[1]), action: cleanAndTrimText(parts.slice(2).join(':') || '') };
                                if (currentKey === 'relationship_tips' && parts.length >= 2) return { general_behavior: cleanAndTrimText(parts[0]), tip: cleanAndTrimText(parts.slice(1).join(':')) };
                                if (currentKey === 'self_improvement_habits' && parts.length >= 2) return { habit: cleanAndTrimText(parts[0]), benefit: cleanAndTrimText(parts.slice(1).join(':')) };
                            }
                            return item; // Fallback to simple string if structure not matched
                        });
                    }
                    // Update lastHeaderIndex to continue parsing from after the current section
                    lastHeaderIndex += aiGeneratedRawText.substring(lastHeaderIndex).indexOf(match[0]) + match[0].length;
                } else {
                    console.warn(`Regex fallback failed to find content for section: ${currentKey}`);
                }
            }
            
            // Assign regex parsed data to finalParsedData (overwriting defaults)
            Object.assign(finalParsedData, regexParsedDescription);

            // Final general summary fallback: if still empty, put all raw AI text into it (if not already assigned by JSON)
            if (!finalParsedData.general_summary && aiGeneratedRawText.length > 0) {
                finalParsedData.general_summary = cleanAndTrimText(aiGeneratedRawText);
            }
        }
        
        // Final sanity check on types before sending to frontend
        if (typeof finalParsedData.general_summary !== 'string') finalParsedData.general_summary = "";
        if (!Array.isArray(finalParsedData.strengths)) finalParsedData.strengths = [];
        if (!Array.isArray(finalParsedData.challenges)) finalParsedData.challenges = [];
        if (!Array.isArray(finalParsedData.career_advice)) finalParsedData.career_advice = [];
        if (!Array.isArray(finalParsedData.relationship_tips)) finalParsedData.relationship_tips = [];
        if (!Array.isArray(finalParsedData.self_improvement_habits)) finalParsedData.self_improvement_habits = [];
        if (typeof finalParsedData.coach_message !== 'string') finalParsedData.coach_message = "";

        res.json({ description: finalParsedData });

    } catch (error) {
        console.error("Critical error in API generation/parsing:", error);
        res.status(500).json({
            error: "Failed to generate description from AI.",
            details: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

// --- Basic Root Endpoint ---
app.get('/', (req, res) => {
    res.send('WHORU Backend API is running!');
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
});