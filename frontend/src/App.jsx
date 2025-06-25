import React, { useState, useEffect } from 'react';

// Define app ID and Firebase config (mocked as Firestore is not requested yet)
// These variables are provided globally in the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-personality-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Questions data in Bengali, with impact on personality scores
// Each question now specifies the trait pair it measures (e.g., ['E', 'I'])
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

// Simplified descriptions for demonstration. In a real app, this would be more detailed.
const personalityDescriptions = {
    'ISTJ': 'আপনি বাস্তববাদী এবং দায়িত্বশীল।',
    'ISFJ': 'আপনি শান্ত, বন্ধুত্বপূর্ণ এবং সহানুভূতিশীল।',
    'INFJ': 'আপনি অন্তর্দৃষ্টিপূর্ণ, সৃজনশীল এবং আদর্শবাদী।',
    'INTJ': 'আপনি স্বাধীন, কৌশলগত এবং দূরদর্শী।',
    'ISTP': 'আপনি যুক্তিসঙ্গত, পর্যবেক্ষণশীল এবং স্বতঃস্ফূর্ত।',
    'ISFP': 'আপনি সংবেদনশীল, নমনীয় এবং শিল্পপ্রেমী।',
    'INFP': 'আপনি সহানুভূতিশীল, আদর্শবাদী এবং উন্মুক্ত মনের।',
    'INTP': 'আপনি বিশ্লেষণাত্মক, বুদ্ধিমান এবং কৌতূহলী।',
    'ESTP': 'আপনি বাস্তববাদী, কর্মঠ এবং সাহসী।',
    'ESFP': 'আপনি প্রাণবন্ত, সামাজিক এবং আনন্দপ্রিয়।',
    'ENFP': 'আপনি উৎসাহী, উদ্ভাবনী এবং অনুপ্রেরণাদায়ী।',
    'ENTP': 'আপনি বুদ্ধিমান, উদ্ভাবনী এবং চ্যালেঞ্জ পছন্দ করেন।',
    'ESTJ': 'আপনি সংগঠিত, প্রগতিশীল এবং কর্মদক্ষ।',
    'ESFJ': 'আপনি সহযোগী, বন্ধুত্বপূর্ণ এবং দায়িত্বশীল।',
    'ENFJ': 'আপনি অনুপ্রাণিত, সহযোগী এবং সহানুভূতিশীল।',
    'ENTJ': 'আপনি নেতৃত্বদানকারী, কৌশলগত এবং আত্মবিশ্বাসী।',
    // You would add descriptions for the 'X' (Turbulent) variations as well
    // For example, if you get ISTJX, the description might be a blend of ISTJ and turbulent traits.
    // For simplicity, current descriptions only cover the first 4 letters.
};

const App = () => {
    const [screen, setScreen] = useState('start'); // 'start', 'test', 'result'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // Stores { questionIndex: X, selectedScaleIndex: Y } where Y is 0-6 for the 7 circles
    const [userAnswers, setUserAnswers] = useState([]);
    const [personalityScores, setPersonalityScores] = useState({
        'E': 0, 'I': 0,
        'S': 0, 'N': 0,
        'T': 0, 'F': 0,
        'J': 0, 'P': 0,
        'A': 0, 'X': 0 // 'X' for Turbulent/Anxious
    });
    const [resultType, setResultType] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('error'); // 'error' or 'info'

    /**
     * Shows a message in the message box for a short duration.
     * @param {string} msg - The message to display.
     * @param {string} type - 'error' (default) or 'info'.
     */
    const showMessage = (msg, type = 'error') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
        }, 3000);
    };

    /**
     * Handles the selection of an answer option on the 7-point scale.
     * Stores the selected index (0-6) and automatically moves to the next question.
     * @param {number} selectedScaleIndex - The index of the selected circle on the scale (0 to 6).
     */
    const selectAnswer = (selectedScaleIndex) => {
        const existingAnswerIndex = userAnswers.findIndex(ans => ans.questionIndex === currentQuestionIndex);
        if (existingAnswerIndex > -1) {
            // Update existing answer
            const updatedAnswers = [...userAnswers];
            updatedAnswers[existingAnswerIndex] = {
                questionIndex: currentQuestionIndex,
                selectedScaleIndex: selectedScaleIndex
            };
            setUserAnswers(updatedAnswers);
        } else {
            // Add new answer
            setUserAnswers([...userAnswers, {
                questionIndex: currentQuestionIndex,
                selectedScaleIndex: selectedScaleIndex
            }]);
        }
        // Automatically move to the next question after an answer is selected
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // If it's the last question, submit the test
            submitTest();
        }
    };

    /**
     * Moves to the next question, validating if the current question is answered.
     * This function is primarily for the "next" button, not automatic progression.
     */
    const nextQuestion = () => {
        const answered = userAnswers.some(ans => ans.questionIndex === currentQuestionIndex);
        if (!answered) {
            showMessage("অনুগ্রহ করে এই প্রশ্নের উত্তর দিন।");
            return;
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    /**
     * Moves to the previous question.
     */
    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    /**
     * Calculates the personality type based on accumulated scores.
     * @returns {string} The 5-letter personality type.
     */
    const calculatePersonalityType = () => {
        let type = '';
        type += (personalityScores['E'] >= personalityScores['I']) ? 'E' : 'I';
        type += (personalityScores['S'] >= personalityScores['N']) ? 'S' : 'N';
        type += (personalityScores['T'] >= personalityScores['F']) ? 'T' : 'F';
        type += (personalityScores['J'] >= personalityScores['P']) ? 'J' : 'P';
        type += (personalityScores['A'] >= personalityScores['X']) ? 'A' : 'X'; // Using 'X' for Turbulent/Anxious
        return type;
    };

    /**
     * Submits the test, calculates scores, and displays results.
     */
    const submitTest = () => {
        const answered = userAnswers.some(ans => ans.questionIndex === currentQuestionIndex);
        if (!answered) {
            showMessage("অনুগ্রহ করে এই প্রশ্নের উত্তর দিন।");
            return;
        }

        // Reset scores before calculating
        const newScores = {
            'E': 0, 'I': 0,
            'S': 0, 'N': 0,
            'T': 0, 'F': 0,
            'J': 0, 'P': 0,
            'A': 0, 'X': 0 // 'X' for Turbulent/Anxious
        };

        // Calculate scores based on all answers
        userAnswers.forEach(answer => {
            const question = questions[answer.questionIndex];
            const [trait1, trait2] = question.traitPair; // e.g., ['E', 'I']

            // Map selectedScaleIndex (0-6) to a score value (-3 to +3)
            // 0 -> -3 (একদমই একমত না)
            // 1 -> -2
            // 2 -> -1
            // 3 ->  0 (নিরপেক্ষ)
            // 4 -> +1
            // 5 -> +2
            // 6 -> +3 (পুরোপুরি একমত)
            const scoreValue = answer.selectedScaleIndex - 3;

            if (scoreValue > 0) {
                newScores[trait1] += scoreValue; // Add to the 'agree' side trait
            } else if (scoreValue < 0) {
                newScores[trait2] += Math.abs(scoreValue); // Add to the 'disagree' side trait
            }
            // If scoreValue is 0 (neutral), no change to either trait score.
        });

        setPersonalityScores(newScores); // Update state with calculated scores
        setScreen('result'); // Move to result screen
    };

    /**
     * Resets the test to its initial state.
     */
    const restartTest = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setPersonalityScores({
            'E': 0, 'I': 0,
            'S': 0, 'N': 0,
            'T': 0, 'F': 0,
            'J': 0, 'P': 0,
            'A': 0, 'X': 0 // 'X' for Turbulent/Anxious
        });
        setResultType('');
        setMessage('');
        setScreen('start');
    };

    // Use useEffect to calculate personality type after scores are updated and screen is 'result'
    useEffect(() => {
        if (screen === 'result') {
            const type = calculatePersonalityType();
            setResultType(type);
        }
    }, [personalityScores, screen]); // Dependencies: recalculate if scores or screen changes

    const currentQuestion = questions[currentQuestionIndex];
    // Find the selected index for the current question
    const selectedScaleIndexForCurrentQuestion = userAnswers.find(
        (ans) => ans.questionIndex === currentQuestionIndex
    )?.selectedScaleIndex;

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
                                            ${selectedScaleIndexForCurrentQuestion === index ?
                                                (index < 3 ? 'bg-purple-500' : index > 3 ? 'bg-green-500' : 'bg-gray-400') : ''
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
                                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                                style={{
                                    border: '2px solid #333', // Black border
                                    backgroundColor: 'transparent',
                                    color: '#333' // Black icon color
                                }}
                                disabled={currentQuestionIndex === 0}
                            >
                                {/* SVG for left arrow (smaller, as per image) */}
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={nextQuestion}
                                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                                    style={{
                                        border: '2px solid #333', // Black border
                                        backgroundColor: 'transparent',
                                        color: '#333' // Black icon color
                                    }}
                                >
                                    {/* SVG for right arrow (smaller, as per image) */}
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    onClick={submitTest}
                                    className="px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center"
                                >
                                    জমা দিন <i className="fas fa-check ml-2"></i>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {screen === 'result' && (
                    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl mb-4 text-green-700">আপনার ব্যক্তিত্বের ধরণ:</h2>
                        <p className="text-5xl font-bold mb-6 text-blue-700">
                            {resultType}
                        </p>
                        <p className="text-lg mb-8">
                            {personalityDescriptions[resultType] || 'আপনার ব্যক্তিত্বের ধরণ সম্পর্কে একটি সংক্ষিপ্ত বর্ণনা।'}
                        </p>
                        <button
                            onClick={restartTest}
                            className="px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center mx-auto"
                        >
                            পুনরায় শুরু করুন <i className="fas fa-redo ml-2"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="text-center text-sm mt-10 opacity-70 px-4 pb-8">
                © 2025 WHORU. এটি শুরু একটি টেস্ট নয় — এটি আপনার নিজের সাথে একটি সংলাপ। নিজেকে জানার এই যাত্রায়... আপনি কি প্রস্তুত?
            </footer>
        </div>
    );
};

export default App;
