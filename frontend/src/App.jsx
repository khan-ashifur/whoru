import React, { useState, useEffect } from 'react';

// Define app ID and Firebase config (mocked as Firestore is not requested yet)
// These variables are provided globally in the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-personality-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Questions data in Bengali, with impact on personality scores
const questions = [
    {
        question: "আপনি একটি সামাজিক অনুষ্ঠানে কেমন অনুভব করেন?",
        options: [
            { text: "মানুষের সাথে মিশে শক্তি পান এবং প্রাণবন্ত বোধ করেন।", scores: { 'E': 1 } },
            { text: "কিছুক্ষণ পর ক্লান্তি অনুভব করেন এবং একা থাকতে পছন্দ করেন।", scores: { 'I': 1 } }
        ]
    },
    {
        question: "তথ্য প্রক্রিয়াকরণের সময় আপনি কীসের উপর বেশি মনোযোগ দেন?",
        options: [
            { text: "বাস্তব তথ্য, বিশদ বিবরণ এবং ব্যবহারিক দিক।", scores: { 'S': 1 } },
            { text: "সাধারণ ধারণা, ভবিষ্যৎ সম্ভাবনা এবং বিমূর্ত ধারণা।", scores: { 'N': 1 } }
        ]
    },
    {
        question: "সিদ্ধান্ত নেওয়ার সময় আপনি কীসের উপর বেশি নির্ভর করেন?",
        options: [
            { text: "যুক্তি, উদ্দেশ্যমূলক বিশ্লেষণ এবং ন্যায্য বিচার।", scores: { 'T': 1 } },
            { text: "ব্যক্তিগত মূল্যবোধ, অন্যের অনুভূতি এবং সহানুভূতি।", scores: { 'F': 1 } }
        ]
    },
    {
        question: "আপনার জীবনযাপনের পদ্ধতি কেমন?",
        options: [
            { text: "সুসংগঠিত, পরিকল্পনা মাফিক এবং সিদ্ধান্ত গ্রহণে দ্রুত।", scores: { 'J': 1 } },
            { text: "নমনীয়, স্বতঃস্ফূর্ত এবং বিকল্প খোলা রাখতে পছন্দ করেন।", scores: { 'P': 1 } }
        ]
    },
    {
        question: "আপনি কি মনোযোগের কেন্দ্রবিন্দু হতে পছন্দ করেন?",
        options: [
            { text: "হ্যাঁ, আমি মানুষের সাথে ইন্টারঅ্যাক্ট করতে ভালোবাসি।", scores: { 'E': 1 } },
            { text: "না, আমি সাধারণত শান্ত থাকতে পছন্দ করি।", scores: { 'I': 1 } }
        ]
    },
    {
        question: "যখন আপনি নতুন কিছু শেখেন, তখন আপনি কী পছন্দ করেন?",
        options: [
            { text: "ধাপে ধাপে এবং হাতে-কলমে শেখা।", scores: { 'S': 1 } },
            { text: "ধারণা এবং তত্ত্ব নিয়ে আলোচনা করা।", scores: { 'N': 1 } }
        ]
    },
    {
        question: "কোনো সমস্যা সমাধানের সময়, আপনি কী করেন?",
        options: [
            { text: "নীতি এবং কারণের উপর ভিত্তি করে সিদ্ধান্ত নিন।", scores: { 'T': 1 } },
            { text: "মানুষের উপর এর প্রভাব বিবেচনা করুন।", scores: { 'F': 1 } }
        ]
    },
    {
        question: "আপনার কাজ সম্পন্ন করার পদ্ধতি কেমন?",
        options: [
            { text: "সময়সীমার আগে কাজ শেষ করা এবং গোছানো থাকা।", scores: { 'J': 1 } },
            { text: "শেষ মুহূর্ত পর্যন্ত কাজ স্থগিত করা এবং পরিবর্তন মেনে নেওয়া।", scores: { 'P': 1 } }
        ]
    },
    {
        question: "বন্ধুদের সাথে সময় কাটানো আপনার কাছে কেমন?",
        options: [
            { text: "বড় দলে বা পার্টিতে সময় কাটাতে পছন্দ করি।", scores: { 'E': 1 } },
            { text: "ছোট, ঘনিষ্ঠ গ্রুপে বা ব্যক্তিগতভাবে সময় কাটাতে পছন্দ করি।", scores: { 'I': 1 } }
        ]
    },
    {
        question: "আপনি কি বিস্তারিত বা সম্পূর্ণ চিত্র দেখতে পছন্দ করেন?",
        options: [
            { text: "বিশদ বিবরণ এবং বর্তমান বাস্তবতা।", scores: { 'S': 1 } },
            { text: "ভবিষ্যতের সম্ভাবনা এবং প্যাটার্ন।", scores: { 'N': 1 } }
        ]
    }
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
};

const App = () => {
    const [screen, setScreen] = useState('start'); // 'start', 'test', 'result'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]); // Stores { questionIndex: X, selectedOptionIndex: Y }
    const [personalityScores, setPersonalityScores] = useState({
        'E': 0, 'I': 0,
        'S': 0, 'N': 0,
        'T': 0, 'F': 0,
        'J': 0, 'P': 0
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
     * Handles the selection of an answer option.
     * Stores the answer and updates UI.
     * @param {number} selectedOptionIndex - The index of the selected option.
     */
    const selectAnswer = (selectedOptionIndex) => {
        const existingAnswerIndex = userAnswers.findIndex(ans => ans.questionIndex === currentQuestionIndex);
        if (existingAnswerIndex > -1) {
            // Update existing answer
            const updatedAnswers = [...userAnswers];
            updatedAnswers[existingAnswerIndex] = {
                questionIndex: currentQuestionIndex,
                selectedOptionIndex: selectedOptionIndex
            };
            setUserAnswers(updatedAnswers);
        } else {
            // Add new answer
            setUserAnswers([...userAnswers, {
                questionIndex: currentQuestionIndex,
                selectedOptionIndex: selectedOptionIndex
            }]);
        }
    };

    /**
     * Moves to the next question, validating if the current question is answered.
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
     * @returns {string} The 4-letter personality type.
     */
    const calculatePersonalityType = () => {
        let type = '';
        type += (personalityScores['E'] >= personalityScores['I']) ? 'E' : 'I';
        type += (personalityScores['S'] >= personalityScores['N']) ? 'S' : 'N';
        type += (personalityScores['T'] >= personalityScores['F']) ? 'T' : 'F';
        type += (personalityScores['J'] >= personalityScores['P']) ? 'J' : 'P';
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

        // Recalculate scores based on all answers
        const newScores = { 'E': 0, 'I': 0, 'S': 0, 'N': 0, 'T': 0, 'F': 0, 'J': 0, 'P': 0 };
        userAnswers.forEach(answer => {
            const question = questions[answer.questionIndex];
            const selectedOption = question.options[answer.selectedOptionIndex];
            if (selectedOption && selectedOption.scores) {
                for (const trait in selectedOption.scores) {
                    newScores[trait] += selectedOption.scores[trait];
                }
            }
        });
        setPersonalityScores(newScores); // Update state

        // Calculate and set the result type
        const type = calculatePersonalityType();
        setResultType(type);
        setScreen('result'); // Move to result screen
    };

    /**
     * Resets the test to its initial state.
     */
    const restartTest = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setPersonalityScores({ 'E': 0, 'I': 0, 'S': 0, 'N': 0, 'T': 0, 'F': 0, 'J': 0, 'P': 0 });
        setResultType('');
        setMessage('');
        setScreen('start');
    };

    // This effect runs when personalityScores changes to calculate the final type
    // This is generally not needed if calculatePersonalityType is called right before setting the result screen
    // However, if logic were more complex and scores updated asynchronously, it might be useful.
    useEffect(() => {
        if (screen === 'result') {
            const type = calculatePersonalityType();
            setResultType(type);
        }
    }, [personalityScores, screen]); // Recalculate if scores or screen changes

    const currentQuestion = questions[currentQuestionIndex];
    const selectedOptionForCurrentQuestion = userAnswers.find(
        (ans) => ans.questionIndex === currentQuestionIndex
    )?.selectedOptionIndex;

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
                    WHORU <span className="text-6xl leading-none">🧙‍♂️</span> {/* Changed emoji here */}
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
                        <h2 className="mb-6 text-2xl font-semibold">
                            {currentQuestion.question}
                        </h2>
                        <div className="space-y-3">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`block w-full text-left px-5 py-3 border border-gray-300 rounded-lg cursor-pointer transition-colors duration-200 text-gray-700 hover:bg-blue-50 hover:border-blue-400 ${
                                        selectedOptionForCurrentQuestion === index ? 'bg-blue-100 border-blue-500 text-blue-800 ring-2 ring-blue-300' : ''
                                    }`}
                                    onClick={() => selectAnswer(index)}
                                >
                                    {option.text}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={previousQuestion}
                                className="px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 bg-gray-300 text-gray-800 hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 flex items-center"
                                disabled={currentQuestionIndex === 0}
                            >
                                <i className="fas fa-arrow-left mr-2"></i> পূর্ববর্তী
                            </button>
                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={nextQuestion}
                                    className="px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center"
                                >
                                    পরবর্তী <i className="fas fa-arrow-right ml-2"></i>
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
