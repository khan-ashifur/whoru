import React, { useState, useEffect, useRef } from 'react';

// Define app ID and Firebase config (mocked as Firestore is not requested yet)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-personality-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// ***************************************************************
// CRITICAL: ENSURE THESE DATA STRUCTURES ARE DEFINED *OUTSIDE* AND *BEFORE*
// THE 'App' FUNCTION COMPONENT. This prevents 'ReferenceError'.
// ***************************************************************

// Personality Type Names and Short Descriptions (from 16 personalities.docx)
const personalityTypesData = {
    'ISTJ': { name: "The Inspector", description: "দায়িত্বশীল , সুনির্দিষ্ট ও কার্যনিষ্ঠ" },
    'ISFJ': { name: "The Protector", description: "সহানুভূতিশীল , বিশ্বস্ত ও যত্নবান" },
    'INFJ': { name: "The Advocate", description: "অন্তর্দৃষ্টি , আদর্শবাদী ও সহানুভূতিশীল" },
    'INTJ': { name: "The Architect", description: "কৌশলী , স্বনির্ভর ও ভবিষ্যতমুখী" },
    'ISTP': { name: "The Virtuoso", description: "বাস্তবধর্মী , বিশ্লেষণী ও হাতেকলমে দক্ষ" },
    'ISFP': { name: "The Adventurer", description: "শান্তিপ্রিয় , শিল্পমনস্ক ও নমনীয়" },
    'INFP': { name: "The Mediator", description: "কল্পনাপ্রবণ , আদর্শবাদী ও অনুভবশীল" },
    'INTP': { name: "The Thinker", description: "বিশ্লেষণী , কৌতূহলী ও চিন্তাশীল" },
    'ESTP': { name: "The Entrepreneur", description: "গতিশীল , বাস্তববাদী ও রিস্ক টেকার" },
    'ESFP': { name: "The Entertainer", description: "প্রাণবন্ত , উপভোগপ্রিয় ও বন্ধুত্বপূর্ণ" },
    'ENFP': { name: "The Campaigner", description: "উদ্যমী , কল্পনাবান ও সমাজপ্রিয়" },
    'ENTP': { name: "The Debater", description: "যুক্তিপূর্ণ , উদ্ভাবনী ও বিতর্কপ্রিয়" },
    'ESTJ': { name: "The Executive", description: "সংগঠক , কর্তৃত্বশীল ও বাস্তববাদী" },
    'ESFJ': { name: "The Consul", description: "যত্নশীল , সহানুভূতিশীল ও সামাজিক" },
    'ENFJ': { name: "The Protagonist", description: "নেতৃস্থানীয় , সহানুভূতিশীল ও উৎসাহদায়ী" },
    'ENTJ': { name: "The Commander", description: "কৌশলী , আত্মবিশ্বাসী ও নেতৃত্বদক্ষ" },
};

// Questions data in Bengali, with impact on personality scores (Original from your last provided code)
const questions = [
    // Category 1: Mind — Introvert (I) vs Extrovert (E)
    { question: "আপনি কি নতুন মানুষের সাথে আলাপ করতে স্বাচ্ছন্দ্যবোধ করেন?", traitPair: ['E', 'I'] },
    { question: "বড় দলে সময় কাটাতে আপনার ভালো লাগে?", traitPair: ['E', 'I'] },
    { question: "নতুন জায়গায় গিয়ে আপনি কি সহজে মিশে যান?", traitPair: ['E', 'I'] },
    { question: "অনেকক্ষণ একা থাকলে আপনি কি বিরক্ত হন?", traitPair: ['E', 'I'] }, // Agreement means prefers company (E)
    { question: "পার্টি বা অনুষ্ঠান শেষে আপনি কি ক্লান্ত অনুভব করেন?", traitPair: ['I', 'E'] }, // Agreement means drains energy (I)
    { question: "একা সময় কাটানো কি আপনাকে শক্তি দেয়?", traitPair: ['I', 'E'] }, // Agreement means recharges alone (I)
    { question: "নতুন বন্ধুত্ব তৈরি করা কি আপনার জন্য সহজ?", traitPair: ['E', 'I'] },
    { question: "অনেক মানুষ থাকলে কি আপনি চুপচাপ থাকেন?", traitPair: ['I', 'E'] },
    { question: "অপরিচিত পরিবেশে কথা বলার আগে কি ভাবেন?", traitPair: ['I', 'E'] },
    { question: "বন্ধুদের সাথে সময় কাটানো কি আপনার প্রিয় সময় কাটানোর উপায়?", traitPair: ['E', 'I'] }, // Rephrased for scale

    // Category 2: Energy — Practical (S) vs Imaginative (N)
    { question: "আপনি কি বাস্তব সমস্যার সমাধানে বেশি মনোযোগ দেন?", traitPair: ['S', 'N'] },
    { question: "নতুন আইডিয়া নিয়ে ভাবতে কি ভালোবাসেন?", traitPair: ['N', 'S'] },
    { question: "ভবিষ্যতের স্বপ্ন দেখা কি আপনাকে অনুপ্রাণিত করে?", traitPair: ['N', 'S'] },
    { question: "আপনি কি তত্ত্বের চেয়ে বাস্তব উদাহরণ বেশি পছন্দ করেন?", traitPair: ['S', 'N'] },
    { question: "নতুন কোনো পরিকল্পনা করলে আগে সব খুঁটিনাটি ভাবেন?", traitPair: ['S', 'N'] },
    { question: "আপনি বর্তমান সময় উপভোগ করে বেশি মজা পান?", traitPair: ['S', 'N'] }, // Rephrased for scale
    { question: "আপনি নতুন কিছু সৃষ্টি করা বেশি উপভোগ করেন?", traitPair: ['N', 'S'] }, // Rephrased for scale
    { question: "আপনি কি কল্পনাপ্রবণ?", traitPair: ['N', 'S'] },
    { question: "আপনি কি প্রতিদিনের কাজের মাঝে নতুন আইডিয়া খোঁজেন?", traitPair: ['N', 'S'] },
    { question: "আপনি কি ছোট ছোট পরিবর্তনকে উপভোগ করেন?", traitPair: ['S', 'N'] },

    // Category 3: Nature — Thinking (T) vs Feeling (F)
    { question: "সিদ্ধান্ত নেয়ার সময় আপনি কি বেশি যুক্তি ব্যবহার করেন?", traitPair: ['T', 'F'] },
    { question: "অন্যের অনুভূতির ওপর আপনি কি মনোযোগ দেন?", traitPair: ['F', 'T'] },
    { question: "কঠিন সিদ্ধান্তে আপনি আগে যুক্তি ভাবেন?", traitPair: ['T', 'F'] }, // Rephrased for scale
    { question: "সমালোচনা পেলে কি আপনি ব্যক্তিগতভাবে নেন?", traitPair: ['F', 'T'] },
    { question: "আপনি কি সহজে অন্যের দৃষ্টিভঙ্গি বুঝতে পারেন?", traitPair: ['F', 'T'] },
    { question: "আপনার বন্ধুরা আপনাকে বাস্তববাদী ভাবে চেনে?", traitPair: ['T', 'F'] }, // Rephrased for scale
    { question: "সমস্যার সময় আপনি কি বেশি শান্ত থাকেন?", traitPair: ['T', 'F'] },
    { question: "অন্যের মন খারাপ থাকলে কি আপনি খেয়াল করেন?", traitPair: ['F', 'T'] },
    { question: "আপনি কি নিজের ইচ্ছার কথা সহজে প্রকাশ করতে পারেন?", traitPair: ['T', 'F'] },
    { question: "সত্য অনুভূতি থেকে বেশি গুরুত্বপূর্ণ মনে হয়?", traitPair: ['T', 'F'] }, // Rephrased for scale

    // Category 4: Tactics — Judging (J) vs Prospecting (P)
    { question: "আপনি কি সব কিছু প্ল্যান করে আগেভাগে করতে ভালোবাসেন?", traitPair: ['J', 'P'] },
    { question: "শেষ মুহূর্তের সিদ্ধান্ত কি আপনাকে অস্থির করে?", traitPair: ['J', 'P'] },
    { question: "পরিকল্পনার বাইরে কিছু হলে কি খারাপ লাগে?", traitPair: ['J', 'P'] },
    { question: "রুটিন মেনে চলতে কি পছন্দ করেন?", traitPair: ['J', 'P'] },
    { question: "একাধিক কাজ একসাথে করলে কি স্বস্তি পান?", traitPair: ['P', 'J'] }, // Agreement means enjoys flexibility (P)
    { question: "আপনার নিয়মিত শিডিউল বেশি ভালো লাগে?", traitPair: ['J', 'P'] }, // Rephrased for scale
    { question: "নতুন আইডিয়া এলেই আপনি কাজ শুরু করেন?", traitPair: ['P', 'J'] }, // Rephrased for scale
    { question: "পরিকল্পনা ছাড়া ভ্রমণে যেতে স্বস্তি পান?", traitPair: ['P', 'J'] },
    { question: "নতুন অভিজ্ঞতার জন্য কি আপনি খোলা মন রাখেন?", traitPair: ['P', 'J'] },
    { question: "আপনি কি অপ্রত্যাশিত পরিবর্তনে সহজে মানিয়ে নিতে পারেন?", traitPair: ['P', 'J'] },

    // Category 5: Identity — Confident (A) vs Anxious (X) - 'X' for Turbulent/Anxious to avoid conflict with Thinking (T)
    { question: "আপনি কি নিজের সিদ্ধান্তে আত্মবিশ্বাসী?", traitPair: ['A', 'X'] },
    { question: "অনিশ্চিত অবস্থায় কি আপনি দুশ্চিন্তা করেন?", traitPair: ['X', 'A'] },
    { question: "অপরিচিত পরিবেশে কি অস্বস্তি লাগে?", traitPair: ['X', 'A'] },
    { question: "ভুল করলে কি বারবার মনে পড়ে?", traitPair: ['X', 'A'] },
    { question: "নতুন কিছু শুরু করার আগে কি বেশি ভাবেন?", traitPair: ['X', 'A'] },
    { question: "চাপের মধ্যে আপনি কি শান্ত থাকতে পারেন?", traitPair: ['A', 'X'] },
    { question: "নিজেকে কি আপনি আত্মবিশ্বাসী মনে করেন?", traitPair: ['A', 'X'] },
    { question: "ঝুঁকি নেয়ার সময় কি দ্বিধা থাকে?", traitPair: ['X', 'A'] },
    { question: "নিজের কাজ নিয়ে কি আপনি খুশি থাকেন?", traitPair: ['A', 'X'] },
    { question: "নতুন সুযোগ এলে কি আপনি এগিয়ে যান?", traitPair: ['A', 'X'] },
];


const App = () => {
    const [screen, setScreen] = useState('start'); // 'start', 'test', 'result'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // Stores answers as {questionIndex: selectedScaleIndex}
    const [resultType, setResultType] = useState(''); // Stores the 4-letter type, e.g., "ESTJ"
    
    // Initialize structuredDescription to a default empty structure, not null
    const [structuredDescription, setStructuredDescription] = useState({
        general_summary: "",
        strengths: [],
        challenges: [],
        career_advice: [],
        relationship_tips: [],
        self_improvement_habits: [],
        coach_message: ""
    });

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('error');
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false); // To show loading state for AI

    // useRef to hold a mutable value for latest answers (for accurate calculations)
    const latestUserAnswers = useRef(userAnswers);
    useEffect(() => {
        latestUserAnswers.current = userAnswers;
    }, [userAnswers]);


    /**
     * Shows a message in the message box for a short duration.
     * @param {string} msg - The message to display.
     * @param {string} type - 'error' (default) or 'info'.
     */
    const showMessage = (msg, type = 'error') => {
        setMessage(msg);
        setMessageType(type);
        if (msg !== "অনুগ্রহ করে এই প্রশ্নের উত্তর দিন।") {
             setTimeout(() => {
                 setMessage('');
            }, 3000);
        }
    };

    /**
     * Handles the selection of an answer option on the 7-point scale.
     * Stores the selected index (0-6).
     * Automatically navigates to the next question or submits the test if it's the last question.
     * @param {number} selectedScaleIndex - The index of the selected circle on the scale (0 to 6).
     */
    const selectAnswer = (selectedScaleIndex) => {
        // Clear any previous error messages when an answer is selected
        setMessage('');

        // Use a functional update for setUserAnswers to ensure we are working with the latest state
        setUserAnswers(prevAnswers => {
            return {
                ...prevAnswers,
                [currentQuestionIndex]: selectedScaleIndex
            };
        });

        // Automatically advance or submit after a short delay to allow state update
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            } else {
                submitTest(true); // Auto-submit if last question
            }
        }, 50);
    };

    /**
     * Moves to the previous question.
     */
    const previousQuestion = () => {
        // Clear any previous error messages
        setMessage('');
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prevIndex => prevIndex - 1);
        }
    };

    /**
     * Calculates the personality type based on accumulated scores.
     * This function now correctly processes the userAnswers object to calculate scores.
     * @returns {string} The 4-letter personality type (E/I, S/N, T/F, J/P).
     */
    const calculatePersonalityType = () => {
        const answersToCalculate = latestUserAnswers.current;
        const tempScores = {
            'E': 0, 'I': 0, 'S': 0, 'N': 0,
            'T': 0, 'F': 0, 'J': 0, 'P': 0,
            'A': 0, 'X': 0 // Keep A/X in scores for potential future use or debugging, but not for the 4-letter type
        };

        if (Object.keys(answersToCalculate).length !== questions.length) {
            console.warn("Not all questions answered before calculating personality type. Result might be incomplete.");
        }

        Object.keys(answersToCalculate).forEach(qIndexStr => {
            const qIndex = parseInt(qIndexStr);
            const answerValue = answersToCalculate[qIndex]; // 0-6 scale
            const question = questions[qIndex];

            const [trait1, trait2] = question.traitPair;
            const scoreValue = answerValue - 3; // Converts 0-6 to -3,-2,-1,0,1,2,3

            if (scoreValue > 0) { // Favors trait1 (E, N, T, J, A)
                tempScores[trait1] += scoreValue;
            } else if (scoreValue < 0) { // Favors trait2 (I, S, F, P, X)
                tempScores[trait2] += Math.abs(scoreValue); // Add positive value for trait2
            }
            // If scoreValue is 0 (neutral), no change to scores
        });

        // *** CRITICAL FIX: Only construct the 4-letter type here ***
        let type = '';
        type += (tempScores['E'] >= tempScores['I']) ? 'E' : 'I';
        type += (tempScores['S'] >= tempScores['N']) ? 'S' : 'N';
        type += (tempScores['T'] >= tempScores['F']) ? 'T' : 'F';
        type += (tempScores['J'] >= tempScores['P']) ? 'J' : 'P';
        // Removed the A/X part from the final `type` string construction

        return type;
    };

    /**
     * Submits the test, calculates scores, and displays results.
     * @param {boolean} isAutoSubmit - True if called automatically from selectAnswer, false if from manual button click.
     */
    const submitTest = (isAutoSubmit = false) => {
        const answersToSubmit = latestUserAnswers.current;

        if (!isAutoSubmit && answersToSubmit[currentQuestionIndex] === undefined) {
            showMessage("অনুগ্রহ করে এই প্রশ্নের উত্তর দিন।", 'error');
            return;
        }

        if (Object.keys(answersToSubmit).length !== questions.length) {
            showMessage("অনুগ্রহ করে সব প্রশ্নের উত্তর দিন।", 'error');
            return;
        }
        
        // Calculate final type (4-letter) using the just-calculated scores
        const finalCalculatedType = calculatePersonalityType(); // This will produce a 4-letter type

        // Optional: Add a validation check here for a standard 4-letter type if you wish
        const validTypes = [
            'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
            'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
        ];
        if (!validTypes.includes(finalCalculatedType)) {
            console.error("Calculated type is not a standard MBTI type:", finalCalculatedType);
            // You might want to handle this gracefully, e.g., show a generic result or error message
            // For now, we'll proceed, but it might lead to "Unknown Type" if personalityTypesData lacks it.
        }

        setResultType(finalCalculatedType);
        setScreen('result');
    };

    /**
     * Resets the test to its initial state.
     */
    const restartTest = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setResultType('');
        // Reset structuredDescription to its default empty state
        setStructuredDescription({
            general_summary: "",
            strengths: [],
            challenges: [],
            career_advice: [],
            relationship_tips: [],
            self_improvement_habits: [],
            coach_message: ""
        });
        setMessage('');
        setMessageType('error');
        setIsGeneratingDescription(false);
        setScreen('start');
    };

    // Effect to trigger AI description fetch when screen changes to 'result'
    useEffect(() => {
        if (screen === 'result' && resultType) {
            fetchFullDescriptionFromAI(resultType);
        }
    }, [screen, resultType]);


    // ***************************************************************
    // ACTUAL AI API CALL IMPLEMENTATION AND PROMPT CONSTRUCTION
    // ***************************************************************
    const fetchFullDescriptionFromAI = async (type) => {
        setIsGeneratingDescription(true);
        // Set structuredDescription to default empty structure, and show a loading message
        setStructuredDescription({
            general_summary: "",
            strengths: [],
            challenges: [],
            career_advice: [],
            relationship_tips: [],
            self_improvement_habits: [],
            coach_message: ""
        });
        setMessage('বিস্তারিত বর্ণনা তৈরি হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।', 'info');

        // *** THIS IS YOUR NEW, DETAILED COACHING-STYLE PROMPT (JSON-focused) ***
        const descriptionPrompt = `
ব্যক্তিত্ব টাইপ: ${type}

"আপনি" সম্বোধনে, একজন অভিজ্ঞ জীবন-পরামর্শকের ভঙ্গিতে বাংলায় একটি JSON অবজেক্ট তৈরি করুন—বাস্তবসম্মত, অনুপ্রেরণামূলক, এবং সহানুভূতিশীল। JSON অবজেক্টের কী (keys) এবং তাদের মান (values) নিম্নলিখিত কাঠামো কঠোরভাবে অনুসরণ করবে। উত্তরটি শুধুমাত্র একটি বৈধ JSON অবজেক্ট হবে, কোনো অতিরিক্ত টেক্সট বা ভূমিকা ছাড়া।

{
  "general_summary": "৫–৬ লাইনে ব্যবহারকারী কেমন মানুষ, কীভাবে চিন্তা করেন এবং কী তাকে চালিত করে তা ব্যাখ্যা করুন।",
  "strengths": [
    {"name": "শক্তির ১", "explanation": "১–২ লাইনে ব্যাখ্যা দিন শক্তিটি আপনার জীবনে কীভাবে কাজে লাগে"},
    {"name": "শক্তির ২", "explanation": "১–২ লাইনে ব্যাখ্যা দিন শক্তিটি আপনার জীবনে কীভাবে কাজে লাগে"},
    {"name": "শক্তির ৩", "explanation": "১–২ লাইনে ব্যাখ্যা দিন শক্তিটি আপনার জীবনে কীভাবে কাজে লাগে"},
    {"name": "শক্তির ৪", "explanation": "১–২ লাইনে ব্যাখ্যা দিন শক্তিটি আপনার জীবনে কীভাবে কাজে লাগে"},
    {"name": "শক্তির ৫", "explanation": "১–২ লাইনে ব্যাখ্যা দিন শক্তিটি আপনার জীবনে কীভাবে কাজে লাগে"}
  ],
  "challenges": [
    {"description": "চ্যালেঞ্জ ১ সংক্ষেপে তুলে ধরুন", "advice": "১টি বাস্তবসম্মত উপদেশ বা করণীয় লিখুন"},
    {"description": "চ্যালেঞ্জ ২ সংক্ষেপে তুলে ধরুন", "advice": "১টি বাস্তবসম্মত উপদেশ বা করণীয় লিখুন"},
    {"description": "চ্যালেঞ্জ ৩ সংক্ষেপে তুলে ধরুন", "advice": "১টি বাস্তবসম্মত উপদেশ বা করণীয় লিখুন"}
  ],
  "career_advice": [
    {"field": "ক্যারিয়ার সেক্টর ১", "reason": "কেন মানানসই", "action": "আজ থেকে শুরু করার জন্য ১টি ছোট কাজ"},
    {"field": "ক্যারিয়ার সেক্টর ২", "reason": "কেন মানানসই", "action": "আজ থেকে শুরু করার জন্য ১টি ছোট কাজ"},
    {"field": "ক্যারিয়ার সেক্টর ৩", "reason": "কেন মানানসই", "action": "আজ থেকে শুরু করার জন্য ১টি ছোট কাজ"}
  ],
  "relationship_tips": [
    {"general_behavior": "সম্পর্ক বা বন্ধুত্বে ব্যবহারকারীর সাধারণ ধরণ, ২–৩ লাইনে।", "tip": "১টি সম্পর্ক উন্নয়নের টিপ।"}
  ],
  "self_improvement_habits": [
    {"habit": "অভ্যাস ১", "benefit": "এটি কীভাবে উপকারে আসে"},
    {"habit": "অভ্যাস ২", "benefit": "এটি কীভাবে উপকারে আসে"},
    {"habit": "অভ্যাস ৩", "benefit": "এটি কীভাবে উপকারে আসে"}
  ],
  "coach_message": "একটি আবেগময়, আত্মবিশ্বাস-জাগানিয়া সমাপ্তি বার্তা দিন। শেষ লাইনে সরাসরি আহ্বান থাকুক (যেমন: “আজই শুরু করুন”)।"
}
`;

        try {
            console.log("Sending prompt to backend:", descriptionPrompt); // Log the prompt being sent

            const response = await fetch('http://localhost:5000/api/generate-description', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ personalityType: type, descriptionPrompt: descriptionPrompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error! Status: ${response.status}, Message: ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            // Assuming data.description is the parsed object from your server.js
            if (data.description) {
                setStructuredDescription(data.description); // Update state with the received structured object
                setMessage('', ''); // Clear loading message on success
            } else {
                throw new Error("API did not return structured description.");
            }

        } catch (error) {
            console.error("বিস্তারিত বর্ণনা আনতে ব্যর্থ:", error);
            // On error, set the description to a user-friendly error message within the structure
            setStructuredDescription({
                general_summary: "বিস্তারিত বর্ণনা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
                strengths: [], challenges: [], career_advice: [], relationship_tips: [], self_improvement_habits: [],
                coach_message: ""
            });
            setMessage("বিস্তারিত বর্ণনা লোড করতে সমস্যা হয়েছে।", 'error');
        } finally {
            setIsGeneratingDescription(false);
        }
    };


    const currentQuestion = questions[currentQuestionIndex];
    const selectedScaleIndexForCurrentQuestion = userAnswers[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-start">
            {/* Custom Styles for Inter Font - similar to App.css provided by user */}
            <style>
                {`
                body {
                    font-family: 'Inter', sans-serif;
                }
                `}
            </style>

            {/* Header Section */}
            <div className="w-full text-center py-8 bg-gradient-to-r from-[#a164e2] to-[#7a3ed1] text-white">
                <h1 className="text-5xl font-bold mb-2 flex justify-center items-center gap-3">
                    WHORU <span className="text-6xl leading-none">🧙‍♂️</span>
                </h1>
                <p className="text-xl mb-4">একটি ছোট্ট যাত্রা — নিজেকে জানার দিকে 🧭</p>
                {screen === 'start' && (
                    <button
                        onClick={() => setScreen('test')}
                        className="px-6 py-2 bg-white text-purple-700 font-semibold rounded-full hover:bg-gray-200 transition shadow-md"
                    >
                        🚀 শুরু করুন
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl justify-center mt-8 px-4 pb-8">
                {screen === 'start' && (
                    <>
                        {/* Description Box 1 */}
                        <div className="bg-[#E6E6FA] text-black rounded-2xl shadow p-6 w-full md:w-1/2">
                            <h2 className="text-xl font-bold mb-4">
                                একটু সময় দিন... নিজেকে আরও ভালোভাবে জানার জন্য।
                            </h2>
                            <p className="mb-2">কখনও কি মনে হয়েছে — আপনি আসলে কে?</p>
                            <p className="mb-2">
                                কেন কিছু সিদ্ধান্ত আপনি সহজে নেন, আবার কিছুতে দ্বিধা অনুভব করেন?
                            </p>
                            <p className="mb-2">
                                কেন কারও সাথে সহজেই বন্ধুত্ব হয়, আবার কারও সাথে দূরত্ব থাকে?
                            </p>
                            <p className="mb-2">
                                এই সহজ, ছোট্ট টেস্টটি আপনার ব্যক্তিত্বের গভীরতর স্তরগুলো উন্মোচন করবে।
                            </p>
                            <p>
                                আপনার চিন্তার ধরণ, অনুভূতির ধরণ, শক্তি আর চ্যালেঞ্জ — সবকিছুর এক নতুন আয়না আপনি দেখতে পাবেন।
                            </p>
                        </div>

                        {/* Description Box 2 */}
                        <div className="bg-[#E6E6FA] text-black rounded-2xl shadow p-6 w-full md:w-1/2">
                            <h2 className="text-xl font-bold mb-4">
                                আপনার জন্য এই টেস্ট কেন গুরুত্বপূর্ণ?
                            </h2>
                            <ul className="list-disc list-inside space-y-2">
                                <li>নিজের ভেতরের জগৎকে আরও ভালোভাবে বুঝবেন</li>
                                <li>কোন পরিবেশে আপনি সবচেয়ে স্বচ্ছন্দ — তা জানতে পারবেন</li>
                                <li>কোন কাজ বা সম্পর্ক আপনাকে আনন্দ দেয় — সেটাও স্পষ্ট হবে</li>
                                <li>নিজের উপর আরও আত্মবিশ্বাস তৈরি হবে</li>
                                <li>নতুন দৃষ্টিভঙ্গি আসবে জীবনের প্রতি</li>
                            </ul>
                        </div>
                    </>
                )}

                {screen === 'test' && (
                    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-2xl mx-auto">
                        {message && (
                            <div className={`px-4 py-3 rounded-lg relative mb-4 text-sm ${messageType === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-blue-100 border border-blue-400 text-blue-700'}`}>
                                {message}
                            </div>
                        )}
                        <p className="text-xl font-medium mb-6">
                            প্রশ্ন {currentQuestionIndex + 1} এর {questions.length}:
                        </p>
                        {/* Fixed height for question to prevent layout shift */}
                        <h2 className="mb-6 text-2xl font-semibold min-h-[100px] flex items-center justify-center text-center">
                            {currentQuestion.question}
                        </h2>
                        {/* 7-point Likert Scale UI */}
                        <div className="flex flex-col items-center justify-center mt-6">
                            {/* Adjusted padding/margin for labels and added whitespace-nowrap */}
                            <div className="flex justify-center items-center space-x-2 w-full px-2">
                                <span className="text-purple-600 font-semibold text-lg mr-1 whitespace-nowrap flex-shrink-0">একদমই একমত না</span>
                                {[0, 1, 2, 3, 4, 5, 6].map((index) => ( // 7 circles for 7-point scale
                                    <div
                                        key={index}
                                        className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all duration-200 flex items-center justify-center
                                            ${index < 3 ? 'border-purple-500' : index > 3 ? 'border-green-500' : 'border-gray-400'}
                                            ${selectedScaleIndexForCurrentQuestion === index ? // Changed check
                                                (index < 3 ? 'bg-purple-500 text-white' : index > 3 ? 'bg-green-500 text-white' : 'bg-gray-400 text-white') : ''
                                            }
                                            ${ /* Dynamic size on hover */
                                                'hover:scale-110' // Scale up on hover
                                            }
                                        `}
                                        onClick={() => selectAnswer(index)}
                                    >
                                        {/* No checkmark, just fill the circle as per the image */}
                                    </div>
                                ))}
                                <span className="text-green-600 font-semibold text-lg ml-1 whitespace-nowrap flex-shrink-0">পুরোপুরি একমত</span>
                            </div>
                        </div>

                        <div className="flex justify-between mt-8 w-full"> {/* Added w-full for full width */}
                            <button
                                onClick={previousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                                style={{
                                    border: '2px solid #333', // Black border
                                    backgroundColor: 'transparent',
                                    color: '#333' // Black icon color
                                }}
                            >
                                {/* SVG for left arrow (smaller, as per image) */}
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            {/* The "Next" button is removed. Selection automatically advances. */}
                            {/* The "Submit" logic is now handled by selectAnswer when it's the last question. */}
                        </div>
                    </div>
                )}

                {screen === 'result' && (
                    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl mb-4 text-green-700">আপনার ব্যক্তিত্বের ধরণ:</h2>
                        <p className="text-5xl font-bold mb-6 text-blue-700">
                            {resultType}
                        </p>
                        {/* Display the English name for the personality type */}
                        <p className="text-xl font-semibold mb-2">
                            {personalityTypesData[resultType]?.name || 'Unknown Type'}
                        </p>
                        {/* Display the short Bengali description from personalityTypesData */}
                        <p className="text-lg mb-4">
                            {personalityTypesData[resultType]?.description || ''}
                        </p>

                        {/* AI generated full description sections */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow-inner text-left">
                            {isGeneratingDescription ? (
                                <p className="text-gray-600 text-center">বিস্তারিত বর্ণনা তৈরি হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।</p>
                            ) : (
                                <>
                                    {/* General Description - Renamed to match prompt */}
                                    {structuredDescription?.general_summary ? (
                                        <>
                                            <h3 className="text-xl font-bold mb-2">আপনার ব্যক্তিত্বের সারসংক্ষেপ:</h3>
                                            <p className="mb-4">{structuredDescription.general_summary}</p>
                                        </>
                                    ) : (
                                        // Only show this specific error if generation has finished and summary is still empty
                                        <p className="text-center text-red-500">
                                            বিস্তারিত বর্ণনা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন বা কুইজটি আবার দিন।
                                        </p>
                                    )}

                                    {/* Strengths */}
                                    {structuredDescription?.strengths?.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold mb-2">আপনার ৫টি প্রধান শক্তি:</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {structuredDescription.strengths.map((item, idx) => (
                                                    <li key={`strength-${idx}`}>
                                                        {/* Render based on if item is string or object */}
                                                        {typeof item === 'object' && item !== null && item.name && item.explanation ? (
                                                            <><strong>{item.name}:</strong> {item.explanation}</>
                                                        ) : (
                                                            item // Fallback if not object or malformed
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Challenges */}
                                    {structuredDescription?.challenges?.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold mb-2">আপনার ৩টি চ্যালেঞ্জ:</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {structuredDescription.challenges.map((item, idx) => (
                                                    <li key={`challenge-${idx}`}>
                                                        {typeof item === 'object' && item !== null && item.description && item.advice ? (
                                                            <><strong>{item.description}:</strong> {item.advice}</>
                                                        ) : (
                                                            item
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Career Suggestions */}
                                    {structuredDescription?.career_advice?.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold mb-2">ক্যারিয়ার পরামর্শ:</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {structuredDescription.career_advice.map((item, idx) => (
                                                    <li key={`career-${idx}`}>
                                                        {typeof item === 'object' && item !== null && item.field && item.reason ? (
                                                            <>
                                                                <strong>{item.field}:</strong> {item.reason}
                                                                {item.action && ` - ${item.action}`}
                                                            </>
                                                        ) : (
                                                            item
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Relationship Tips */}
                                    {structuredDescription?.relationship_tips?.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold mb-2">সম্পর্ক ও বন্ধুত্ব:</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {structuredDescription.relationship_tips.map((item, idx) => (
                                                    <li key={`relationship-${idx}`}>
                                                        {typeof item === 'object' && item !== null && item.general_behavior && item.tip ? (
                                                            <>
                                                                <strong>{item.general_behavior}:</strong> {item.tip}
                                                            </>
                                                        ) : (
                                                            item
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Self-Improvement Habits */}
                                    {structuredDescription?.self_improvement_habits?.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold mb-2">আত্মউন্নয়নের অভ্যাস:</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {structuredDescription.self_improvement_habits.map((item, idx) => (
                                                    <li key={`steps-${idx}`}>
                                                        {typeof item === 'object' && item !== null && item.habit && item.benefit ? (
                                                            <><strong>{item.habit}:</strong> {item.benefit}</>
                                                        ) : (
                                                            item
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {/* Coach's Message */}
                                    {structuredDescription?.coach_message && (
                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold mb-2">কোচের বার্তা:</h3>
                                            <p>{structuredDescription.coach_message}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <button
                            onClick={restartTest}
                            className="px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center mx-auto mt-6"
                        >
                            পুনরায় শুরু করুন <i className="fas fa-redo ml-2"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="text-center text-sm mt-10 opacity-70 px-4 pb-8">
                © 2025 WHORU. এটি শুধুএকটি টেস্ট নয় — এটি আপনার নিজের সাথে একটি সংলাপ। নিজেকে জানার এই যাত্রায়... আপনি কি প্রস্তুত?
            </footer>
        </div>
    );
};

export default App;