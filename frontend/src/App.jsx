import React, { useState, useEffect, useRef } from 'react';

// Define app ID and Firebase config (mocked as Firestore is not requested yet)
// These variables are provided globally in the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-personality-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Questions data in Bengali, with impact on personality scores
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

// Function to clean up extracted text (remove ✅, ⚠️, extra spaces)
const cleanText = (text) => {
    return text.replace(/[✅⚠️]/g, '').replace(/\s+/g, ' ').trim();
};

// Full descriptions extracted from MBTI_১৬টি_টাইপ_সম্পূর্ণ.docx
const personalityDescriptions = {
    'INTJ': {
        general: cleanText(`আপনি এমন একজন ব্যক্তি , যার মনে সবসময় নতুন নতুন পরিকল্পনা আর বড় ভাবনা ঘোরাফেরা করে। আপনি স্বভাবতই বিশ্লেষণধর্মী , সুনির্দিষ্ট এবং ভবিষ্যতমুখী। যখন অন্যরা বর্তমানের সমস্যা নিয়ে ব্যস্ত থাকে , আপনি তখন বড় ছবি দেখেন এবং কীভাবে সেটাকে দীর্ঘমেয়াদে উন্নত করা যায় তা নিয়ে ভাবেন। আপনার মানসিক শক্তি এবং কঠোর যুক্তিভিত্তিক চিন্তা আপনাকে অন্যদের থেকে আলাদা করে তোলে। আপনি নিখুঁততা এবং কার্যকারিতার প্রতি প্রবলভাবে আকৃষ্ট। অপ্রয়োজনীয় আবেগ বা অগোছালোতা আপনাকে বিরক্ত করে। আপনাকে সহজে প্রভাবিত করা যায় না এবং আপনি নিজস্ব মানদণ্ড অনুযায়ী কাজ করতে পছন্দ করেন। নতুন আইডিয়া তৈরি এবং বড় স্কেলে প্রভাব ফেলতে পারার সক্ষমতা আপনার অন্যতম শক্তি। আপনি একা কাজ করতে স্বাচ্ছন্দ্যবোধ করেন এবং সময় নষ্ট করতে পছন্দ করেন না। যদিও সামাজিকতা আপনার মূল প্রবৃত্তি নয় , তবে সঠিক লক্ষ্যের জন্য আপনি দারুণ নেতৃত্বও দেখাতে পারেন。 আপনার কাছে প্রতিটি কাজের পেছনের যুক্তি এবং কার্যকারিতা অত্যন্ত গুরুত্বপূর্ণ।`),
        strengths: [
            cleanText('বড় চিন্তা ও দূরদর্শী পরিকল্পনা'),
            cleanText('বিশ্লেষণাত্মক মানসিকতা'),
            cleanText('নতুন আইডিয়া তৈরি'),
            cleanText('সমস্যা সমাধানে দক্ষ'),
            cleanText('স্বনির্ভরতা')
        ],
        challenges: [
            cleanText('অন্যদের আবেগ বা অনুভূতির প্রতি কম মনোযোগ'),
            cleanText('সবকিছুতে পারফেকশন খোঁজা'),
            cleanText('সহানুভূতির ঘাটতি দেখাতে পারে'),
            cleanText('দলগত কাজে কখনও ধৈর্য হারানো')
        ],
        career_suggestions: [
            cleanText('স্ট্রাটেজি প্ল্যানার'),
            cleanText('সফটওয়্যার আর্কিটেক্ট'),
            cleanText('প্রজেক্ট ম্যানেজার'),
            cleanText('কনসালটেন্ট (IT / বিজনেস)'),
            cleanText('ডেটা অ্যানালিস্ট'),
            cleanText('স্টার্টআপ ফাউন্ডার'),
            cleanText('AI/ML গবেষক'),
            cleanText('কর্পোরেট লিডারশিপ রোল')
        ],
        relationship_tips: [
            cleanText('খোলাখুলি কথা বলা'),
            cleanText('অন্যের অনুভূতি বুঝে নেওয়ার চেষ্টা করা'),
            cleanText('মাঝে মাঝে পারফেকশনিজম কমানো'),
            cleanText('সম্পর্কের ছোট ছোট দিকগুলোকেও মূল্য দেয়া')
        ],
        start_small_steps: [
            cleanText('“সব নিজে করতে হবে” ভাবনা কমানো'),
            cleanText('নতুন দৃষ্টিভঙ্গি গ্রহণ করা'),
            cleanText('পারফেকশনের পাশাপাশি নমনীয় হওয়া'),
            cleanText('মাঝে মাঝে বিশ্রাম ও রিফ্রেশমেন্টের সময় রাখা')
        ]
    },
    'ENFP': {
        general: cleanText(`আপনি এমন একজন মানুষ , যার জীবনের প্রতি দৃষ্টিভঙ্গি অত্যন্ত উন্মুক্ত , রঙিন এবং আশাবাদী। নতুন আইডিয়া , অভিজ্ঞতা এবং মানুষের সাথে সংযোগ তৈরি করা আপনাকে প্রাণিত করে। আপনার কল্পনা শক্তি প্রখর , এবং আপনার মনের মধ্যে সর্বদা নতুন নতুন সম্ভাবনা জন্ম নেয়。 আপনি যেখানেই যান , সেখানে ইতিবাচক শক্তি এবং প্রাণবন্ততা ছড়িয়ে দেন。 আপনি সহজেই মানুষের সাথে বন্ধুত্ব গড়ে তুলতে পারেন এবং অন্যদের মধ্যে সেরা দিকগুলো তুলে ধরার স্বভাব রাখেন。 আপনার কথাবার্তায় উষ্ণতা এবং আন্তরিকতা থাকে , যা মানুষকে আপনার প্রতি আকৃষ্ট করে。 তবে আপনি কেবল স্বপ্নদ্রষ্টা নন— আপনি এমন একজন যিনি নিজের মূল্যবোধ নিয়ে চলেন এবং বিশ্বকে আরও ভালো করার একান্ত প্রচেষ্টা করেন。 আপনার মধ্যে নতুন কিছু শেখার এবং নতুন জায়গা এক্সplore করার অদম্য ইচ্ছা কাজ করে。 একঘেয়ে রুটিন বা কঠোর নিয়ম আপনার জন্য নয়; বরং এমন পরিবেশ যেখানে স্বাধীনতা , সৃজনশীলতা এবং মানবিক সংযোগের মূল্য রয়েছে—সেখানে আপনি সবচেয়ে উজ্জ্বল হয়ে উঠেন。 আপনার উদ্যম এবং সৃজনশীলতা আপনার সবচেয়ে বড় শক্তি হলেও , মাঝে মাঝে এইসব গুণাবলীই চ্যালেঞ্জ হয়ে দাঁড়াতে পারে。 অনেক সময় অনেক আইডিয়া একসাথে মাথায় আসে , ফলে একটি প্রকল্প শেষ না করেই আরেকটির দিকে মনোযোগ সরে যায়。 রুটিন মেনে চলা বা একঘেয়ে কাজ আপনাকে অস্থির করে তুলতে পারে。`),
        strengths: [
            cleanText('উদ্যমী এবং উচ্ছ্বল'),
            cleanText('সৃজনশীল এবং নতুন আইডিয়ায় সমৃদ্ধ'),
            cleanText('মানুষের সাথে সহজে সংযোগ স্থাপন'),
            cleanText('খোলামেলা মন'),
            cleanText('নতুন অভিজ্ঞতার প্রতি আগ্রহী')
        ],
        challenges: [
            cleanText('সহজেই মনোযোগ হারানো'),
            cleanText('অনেক কিছু একসাথে শুরু করে শেষ না করা'),
            cleanText('অতিরিক্ত আবেগপ্রবণ হওয়া'),
            cleanText('রুটিন বা কাঠামো মেনে চলা কঠিন মনে হওয়া')
        ],
        career_suggestions: [
            cleanText('ডিজিটাল মার্কেটার'),
            cleanText('কন্টেন্ট ক্রিয়েটর'),
            cleanText('স্টার্টআপ উদ্যোক্তা'),
            cleanText('পাবলিক রিলেশনস এক্সপার্ট'),
            cleanText('ব্র্যান্ড স্ট্র্যাটেজিস্ট'),
            cleanText('হিউম্যান রিসোর্স ম্যানেজার'),
            cleanText('ট্রেইনার বা কোচ'),
            cleanText('ইউটিউবার / সোশ্যাল মিডিয়া ইনফ্লুয়েন্সার')
        ],
        relationship_tips: [
            cleanText('উন্মুক্ত ও খোলামেলা যোগাযোগ'),
            cleanText('সঙ্গীর অনুভূতির প্রতি মনোযোগ'),
            cleanText('সময়ে সময়ে নিজেকে স্থির করার চেষ্টা করা'),
            cleanText('অপ্রয়োজনীয় উদ্বেগ কমানো')
        ],
        start_small_steps: [
            cleanText('কাজের ফোকাস বাড়ানো'),
            cleanText('একেকটা প্রকল্প সম্পূর্ণ করার অভ্যাস গড়ে তোলা'),
            cleanText('ভারসাম্য বজায় রাখা'),
            cleanText('সময় ব্যবস্থাপনায় মনোযোগ দেয়া')
        ]
    },
    'INFJ': {
        general: cleanText(`আপনি এমন একজন মানুষ , যার মধ্যে গভীর চিন্তা এবং মানবিক মূল্যবোধের এক অসাধারণ মিশ্রণ রয়েছে। আপনি প্রায়ই নিজের ভিতরের জগত নিয়ে ভাবেন এবং এই পৃথিবীতে মানুষের জীবনের অর্থ ও উদ্দেশ্য নিয়ে প্রশ্ন করেন। আপনার অন্তর্দৃষ্টি প্রখর , এবং অন্যদের আবেগ ও প্রয়োজনগুলো গভীরভাবে অনুভব করতে পারেন। আপনি অন্যদের জন্য ইতিবাচক পরিবর্তন আনতে আগ্রহী এবং অনেক সময় নিজের স্বার্থের চেয়েও বৃহত্তর কল্যাণকে গুরুত্ব দেন। নতুন ধারণা ও ভবিষ্যতের সম্ভাবনা নিয়ে চিন্তা করা আপনার প্রিয় কাজ। নীরব হলেও , আপনার চিন্তার গভীরতা এবং দূরদর্শিতা আপনাকে অনন্য করে তোলে। যদিও আপনি খুব সামাজিক নন , তবে ঘনিষ্ঠ সম্পর্কের ক্ষেত্রে অত্যন্ত বিশ্বস্ত এবং আন্তরিক। মাঝে মাঝে নিজের আদর্শের প্রতি অতিরিক্ত আবেগপ্রবণ হয়ে পড়তে পারেন এবং বাস্তবতাকে উপেক্ষা করার প্রবণতাও দেখা যায়।`),
        strengths: [
            cleanText('গভীর অন্তর্দৃষ্টি'),
            cleanText('মানবিক মূল্যবোধ'),
            cleanText('অন্যদের আবেগ বোঝার ক্ষমতা'),
            cleanText('উচ্চ স্তরের নৈতিকতা'),
            cleanText('সৃষ্টিশীল চিন্তা')
        ],
        challenges: [
            cleanText('বাস্তবতা থেকে দূরে সরে যাওয়া'),
            cleanText('অতিরিক্ত আদর্শবাদ'),
            cleanText('অতিরিক্ত একাকীত্ব'),
            cleanText('সমালোচনায় সহজে আহত হওয়া')
        ],
        career_suggestions: [
            cleanText('কাউন্সেলর'),
            cleanText('মনোবিজ্ঞানী'),
            cleanText('লেখক'),
            cleanText('শিক্ষাবিদ'),
            cleanText('সমাজসেবী'),
            cleanText('নন-প্রফিট লিডার'),
            cleanText('আর্ট ডিরেক্টর'),
            cleanText('মানবসম্পদ বিশেষজ্ঞ')
        ],
        relationship_tips: [
            cleanText('নিজের অনুভূতি স্পষ্টভাবে প্রকাশ করা'),
            cleanText('বাস্তবিক দৃষ্টিভঙ্গি বজায় রাখা'),
            cleanText('ঘনিষ্ঠ সম্পর্কের জন্য সময় দেয়া'),
            cleanText('নিজের আবেগ নিয়ন্ত্রণে রাখা')
        ],
        start_small_steps: [
            cleanText('বাস্তবতা মেনে চলা'),
            cleanText('সামাজিক যোগাযোগে আরও মনোযোগ দেয়া'),
            cleanText('আত্মবিশ্রাম এবং মানসিক স্বাস্থ্যের যত্ন নেওয়া'),
            cleanText('নিজের সীমাবদ্ধতাগুলো স্বীকার করা')
        ]
    },
    'ESTP': {
        general: cleanText(`আপনি এমন একজন , যিনি জীবনের প্রতিটি মুহূর্ত উপভোগ করতে চান। উত্তেজনা , চ্যালেঞ্জ , নতুন অভিজ্ঞতা—এ সবই আপনাকে অনুপ্রাণিত করে। আপনি বাস্তববাদী এবং তাৎক্ষণিক সিদ্ধান্ত নিতে ভালোবাসেন। কঠিন পরিস্থিতিতে দ্রুত এবং সাহসী পদক্ষেপ নেয়া আপনার সহজাত গুণ। আপনার চারপাশের মানুষরা আপনার উদ্যম ও প্রাণবন্ততায় মুগ্ধ হয়। তবে আপনি একঘেয়ে কাজ বা দীর্ঘ পরিকল্পনা পছন্দ করেন না। বর্তমানে বাঁচা , ঝুঁকি নেয়া এবং ফলাফল দেখার তাড়না আপনাকে চালিত করে。 আপনি প্রাকৃতিকভাবে সামাজিক এবং বন্ধুবৎসল。 তবে মাঝে মাঝে অতি-তাড়াহুড়ো সিদ্ধান্ত বা দায়িত্ব এড়ানোর প্রবণতা দেখা দেয়。`),
        strengths: [
            cleanText('সাহস ও আত্মবিশ্বাস'),
            cleanText('দ্রুত সিদ্ধান্ত গ্রহণ'),
            cleanText('বাস্তবিক চিন্তা'),
            cleanText('জীবনীশক্তি ও উদ্যম'),
            cleanText('মানুষের সাথে সহজ যোগাযোগ')
        ],
        challenges: [
            cleanText('দীর্ঘমেয়াদি পরিকল্পনায় অনীহা'),
            cleanText('অতি ঝুঁকি নেয়া'),
            cleanText('দায়িত্ব এড়ানো'),
            cleanText('আবেগের পরিবর্তনে অস্থিরতা')
        ],
        career_suggestions: [
            cleanText('উদ্যোক্তা'),
            cleanText('সেলস এক্সপার্ট'),
            cleanText('ইভেন্ট ম্যানেজার'),
            cleanText('ফটোগ্রাফার'),
            cleanText('পুলিশ বা মিলিটারি অফিসার'),
            cleanText('ট্রাভেল ব্লগার'),
            cleanText('খেলাধুলার প্রশিক্ষক'),
            cleanText('একশন ফিল্ম নির্মাতা')
        ],
        relationship_tips: [
            cleanText('প্রতিশ্রুতি দিতে শিখা'),
            cleanText('অন্যের অনুভূতি বুঝে চলা'),
            cleanText('দায়িত্বশীল আচরণ'),
            cleanText('সময়ের মূল্য দেয়া')
        ],
        start_small_steps: [
            cleanText('দীর্ঘমেয়াদি লক্ষ্য নির্ধারণ'),
            cleanText('আর্থিক ও সময় ব্যবস্থাপনায় উন্নতি'),
            cleanText('ধৈর্য বাড়ানো'),
            cleanText('মানসিক ভারসাম্য বজায় রাখা')
        ]
    },
    'INTP': {
        general: cleanText(`আপনি একেবারে স্বভাবগতভাবে একজন বিশ্লেষক। সবকিছুর গভীরে প্রবেশ করে কারণ খুঁজতে ভালোবাসেন। আপনি সাধারণত তথ্যভিত্তিক চিন্তা করেন এবং তাত্ত্বিক আলোচনা উপভোগ করেন। নতুন ধারণা , প্রযুক্তি বা আবিষ্কার নিয়ে ঘন্টার পর ঘন্টা ভাবতে পারেন। আপনার স্বাধীনতা প্রিয় এবং একা সময় কাটাতে পছন্দ করেন। প্রথাগত নিয়ম-কানুন বা রুটিন আপনার স্বভাবের সঙ্গে যায় না। বরং চিন্তার স্বাধীনতা , পরীক্ষা-নিরীক্ষা ও নতুনত্বের প্রতি আকর্ষণই আপনাকে চালিত করে। আপনার দুর্দান্ত বিশ্লেষণী ক্ষমতা থাকা সত্ত্বেও , কখনও কখনও অতিরিক্ত চিন্তায় কর্মক্ষমতা কমে যায়। বাস্তবতার সাথে সংযোগ রাখতে সচেতন হতে হয়।`),
        strengths: [
            cleanText('তাত্ত্বিক বিশ্লেষণ দক্ষতা'),
            cleanText('নতুন ধারণা তৈরি'),
            cleanText('গভীর চিন্তা'),
            cleanText('স্বাধীনতা'),
            cleanText('সমস্যার ভিন্ন দৃষ্টিভঙ্গি')
        ],
        challenges: [
            cleanText('অতিরিক্ত চিন্তা করা'),
            cleanText('বাস্তবতা থেকে বিচ্ছিন্ন হওয়া'),
            cleanText('কাজ শেষ করতে দেরি হওয়া'),
            cleanText('সামাজিক সংযোগে অনীহা')
        ],
        career_suggestions: [
            cleanText('গবেষক'),
            cleanText('সফটওয়্যার ডেভেলoper'),
            cleanText('বিজ্ঞানী'),
            cleanText('ডেটা সায়েন্টিস্ট'),
            cleanText('প্রযুক্তি পরামর্শক'),
            cleanText('প্রোডাক্ট ডিজাইনার'),
            cleanText('অধ্যাপক'),
            cleanText('রাইটার বা ব্লগার')
        ],
        relationship_tips: [
            cleanText('অনুভূতি প্রকাশ করা'),
            cleanText('অন্যের আবেগ বোঝার চেষ্টা করা'),
            cleanText('সম্পর্কের মানসিক দিক বুঝা'),
            cleanText('সময় দেয়া')
        ],
        start_small_steps: [
            cleanText('কাজের ধারাবাহিকতা বজায় রাখা'),
            cleanText('বাস্তব জীবনের প্রয়োগ বাড়ানো'),
            cleanText('সামাজিক যোগাযোগ বাড়ানো'),
            cleanText('ইতিবাচক কাজের অভ্যাস গড়ে তোলা')
        ]
    },
    'ESFJ': {
        general: cleanText(`আপনি একজন মানুষ-ভিত্তিক ব্যক্তি। মানুষের খুশি-দুঃখ , সামাজিক বন্ধন ও সম্মান আপনার কাছে অত্যন্ত গুরুত্বপূর্ণ। আপনি স্বভাবতই যত্নশীল , সহযোগী এবং দায়িত্ববান। পরিবার , বন্ধু বা কমিউনিটির কল্যাণের জন্য আপনি অক্লান্তভাবে কাজ করতে পারেন। আপনি মানুষের প্রশংসা পেতে ভালোবাসেন এবং চেনা পরিবেশে সবচেয়ে স্বাচ্ছন্দ্যবোধ করেন。 সামাজিক রীতি-নীতি বা শিষ্টাচার আপনাকে স্বাভাবিকভাবেই মানায়。 তবে মাঝে মাঝে অতিরিক্ত চিন্তা বা মানুষের সম্মতি খোঁজার প্রবণতা দেখা দিতে পারে。`),
        strengths: [
            cleanText('আন্তরিকতা'),
            cleanText('সহযোগিতাপূর্ণ মনোভাব'),
            cleanText('সংগঠিত ও দায়িত্ববান'),
            cleanText('বন্ধুত্বপূর্ণ যোগাযোগ'),
            cleanText('সামাজিক দক্ষতা')
        ],
        challenges: [
            cleanText('অন্যের মতামত নিয়ে অতিরিক্ত চিন্তা'),
            cleanText('পরিবর্তনের প্রতি অনীহা'),
            cleanText('অতিরিক্ত আত্মনিয়ন্ত্রণ'),
            cleanText('মানসিক ক্লান্তি')
        ],
        career_suggestions: [
            cleanText('শিক্ষক'),
            cleanText('নার্স'),
            cleanText('ইভেন্ট ম্যানেজার'),
            cleanText('মানবসম্পদ ব্যবস্থাপক'),
            cleanText('কাউন্সেলর'),
            cleanText('কর্পোরেট ট্রেইনার'),
            cleanText('রিলেশনশিপ ম্যানেজার'),
            cleanText('কাস্টমার সার্ভিস লিডার')
        ],
        relationship_tips: [
            cleanText('নিজের প্রয়োজন বোঝা'),
            cleanText('নিজের উপর আত্মবিশ্বাস রাখা'),
            cleanText('পরিবর্তন মেনে নেয়া'),
            cleanText('অতিরিক্ত নির্ভরতা কমানো')
        ],
        start_small_steps: [
            cleanText('নিজের সময় ও স্পেস নিশ্চিত করা'),
            cleanText('আত্মমর্যাদা বাড়ানো'),
            cleanText('নমনীয়তা বৃদ্ধি'),
            cleanText('আত্মসম্মান রক্ষা করা')
        ]
    },
    'ISFJ': {
        general: cleanText(`আপনি এমন একজন , যার মধ্যে গভীর দায়িত্ববোধ এবং অপরের প্রতি যত্নের সহজাত প্রবণতা রয়েছে。 আপনি শান্ত , আন্তরিক এবং বাস্তববাদী。 আপনার চারপাশের মানুষের সুখ-দুঃখ আপনাকে প্রভাবিত করে এবং আপনি সবসময় চেষ্টা করেন সবাইকে সাহায্য করতে。 আপনি বিশ্বাস করেন ছোট ছোট কাজের মাধ্যমেই বড় পরিবর্তন আসে。 পরিবার , বন্ধু , বা সহকর্মীদের পাশে থাকা , প্রথাগত মূল্যবোধ মেনে চলা — এগুলো আপনার কাছে গুরুত্বপূর্ণ。 আপনি সাধারণত প্রচারের আলোয় থাকতে চান না , বরং নীরবে নিজের কাজ করে যেতে পছন্দ করেন。 তবে মাঝে মাঝে নিজের চাহিদাকে অবহেলা করে অন্যের চাহিদা সামনে এগিয়ে দেন。 পরিবর্তনের সঙ্গে মানিয়ে নেওয়াও একটু সময় লাগে。`),
        strengths: [
            cleanText('আন্তরিক ও যত্নশীল মনোভাব'),
            cleanText('দায়িত্বশীলতা'),
            cleanText('সহানুভূতি'),
            cleanText('সংগঠিত ও নির্ভরযোগ্য'),
            cleanText('বাস্তবিক চিন্তা')
        ],
        challenges: [
            cleanText('নিজের অনুভূতির প্রকাশ কম'),
            cleanText('পরিবর্তনে ধীরগতি'),
            cleanText('অতিরিক্ত আত্মত্যাগ'),
            cleanText('নিজেকে দ্বিতীয় স্থানে রাখা')
        ],
        career_suggestions: [
            cleanText('শিক্ষক'),
            cleanText('নার্স'),
            cleanText('অ্যাডমিনিস্ট্রেটর'),
            cleanText('একাউন্ট্যান্ট'),
            cleanText('সামাজিক সেবাকর্মী'),
            cleanText('চিকিৎসক সহকারী'),
            cleanText('আর্কাইভিস্ট'),
            cleanText('লাইব্রেরিয়ান')
        ],
        relationship_tips: [
            cleanText('নিজের অনুভূতি খোলাখুলি প্রকাশ'),
            cleanText('পরিবর্তন গ্রহণে মন খুলে চলা'),
            cleanText('নিজের প্রয়োজনকে মূল্য দেয়া'),
            cleanText('নির্ভরশীলতার ভারসাম্য বজায় রাখা')
        ],
        start_small_steps: [
            cleanText('আত্ম-উন্নয়নে ফোকাস'),
            cleanText('নিজের ইচ্ছা ও চাহিদা চেনা'),
            cleanText('নমনীয়তা তৈরি করা'),
            cleanText('অতিরিক্ত দায়িত্ব না নেওয়া')
        ]
    },
    'ENTP': {
        general: cleanText(`আপনি এক কথায় নতুনত্বের মানুষ。 আপনার মস্তিষ্ক সর্বদা নতুন ধারণা , পদ্ধতি বা সমাধানের খোঁজে থাকে。 আপনি খুব চটপটে , কৌতূহলী এবং দ্রুত চিন্তা করতে সক্ষম。 চ্যালেঞ্জ আপনাকে মোটেই ভীত করে না — বরং উদ্দীপ্ত করে。 আপনার তর্কের দক্ষতা চমৎকার , এবং আপনি সাধারণত যে কোনো বিষয়ে নতুন দৃষ্টিভঙ্গি দিতে পারেন。 আপনি যে পরিবেশেই যান , সেখানকার স্থবিরতা ভেঙে দিতে পছন্দ করেন。 তবে অনেকবারই এক প্রকল্প শেষ না করেই অন্য কিছুতে মনোযোগ সরে যায়。`),
        strengths: [
            cleanText('উদ্ভাবনী চিন্তা'),
            cleanText('দ্রুত সমস্যা সমাধান'),
            cleanText('চমৎকার যোগাযোগ দক্ষতা'),
            cleanText('নতুন ধারার চিন্তাভাবনা'),
            cleanText('আত্মবিশ্বাস')
        ],
        challenges: [
            cleanText('সহজেই মনোযোগ হারানো'),
            cleanText('অতিরিক্ত তর্কে জড়ানো'),
            cleanText('কাজ অসমাপ্ত রেখে ফেলা'),
            cleanText('নিয়মিত কাঠামো এড়ানো')
        ],
        career_suggestions: [
            cleanText('উদ্যোক্তা'),
            cleanText('প্রোডাক্ট ডিজাইনার'),
            cleanText('ম্যানেজমেন্ট কনসালট্যান্ট'),
            cleanText('পাবলিক রিলেশনস এক্সপার্ট'),
            cleanText('ইনোভেশন লিড'),
            cleanText('প্রযুক্তি স্টার্টআপ ফাউন্ডার'),
            cleanText('মার্কেটিং স্ট্র্যাটেজিস্ট'),
            cleanText('লেখক বা স্পিকার')
        ],
        relationship_tips: [
            cleanText('মনোযোগ দিয়ে শোনা'),
            cleanText('আবেগের দিকটি উপেক্ষা না করা'),
            cleanText('প্রতিশ্রুতি রক্ষা করা'),
            cleanText('অপ্রয়োজনীয় তর্ক এড়ানো')
        ],
        start_small_steps: [
            cleanText('কাজের ফোকাস বজায় রাখা'),
            cleanText('ধৈর্যশীল হওয়া'),
            cleanText('বাস্তবতার সঙ্গে সংযোগ রাখা'),
            cleanText('সময় ব্যবস্থাপনায় মনোযোগ দেয়া')
        ]
    },
    'ISTJ': {
        general: cleanText(`আপনি অত্যন্ত দায়িত্ববান এবং সৎ。 নিয়ম-নীতি , সময়ানুবর্তিতা এবং পরিশ্রম আপনার কাছে খুব গুরুত্বপূর্ণ。 আপনি কোনো কাজ হাতে নিলে সেটি সম্পূর্ণ না করে ছাড়েন না。 আপনার নির্ভরযোগ্যতা ও একাগ্রতার কারণে সবাই আপনাকে ভরসা করে。 আপনি প্রথাগত পথেই চলতে পছন্দ করেন , এবং পরিবর্তনের ব্যাপারে সতর্ক。 বিশৃঙ্খলা বা অস্পষ্টতা আপনার জন্য অস্বস্তির কারণ。 বাস্তবিক চিন্তা , ধারাবাহিক কর্মক্ষমতা এবং কৌশলগত পরিকল্পনা আপনার শক্তি。 তবে কখনো কখনো আপনি নতুনত্ব বা আবেগের প্রতি কম সংবেদনশীল হয়ে পড়তে পারেন。`),
        strengths: [
            cleanText('দায়িত্বশীলতা'),
            cleanText('সংগঠিত মনোভাব'),
            cleanText('বাস্তবিক চিন্তা'),
            cleanText('নির্ভরযোগ্যতা'),
            cleanText('সময়ানুবর্তিতা')
        ],
        challenges: [
            cleanText('পরিবর্তনের প্রতি অনীহা'),
            cleanText('আবেগের প্রতি কম সংবেদনশীলতা'),
            cleanText('অতিরিক্ত নিয়মানুবর্তিতা'),
            cleanText('নমনীয়তার অভাব')
        ],
        career_suggestions: [
            cleanText('অ্যাকাউন্ট্যান্ট'),
            cleanText('প্রকৌশলী'),
            cleanText('প্রশাসনিক ম্যানেজার'),
            cleanText('আইনজীবী'),
            cleanText('পুলিশ অফিসার'),
            cleanText('আর্থিক পরামর্শক'),
            cleanText('প্রজেক্ট ম্যানেজার'),
            cleanText('তথ্য বিশ্লেষক')
        ],
        relationship_tips: [
            cleanText('নমনীয়তা শিখা'),
            cleanText('আবেগ বোঝার চেষ্টা'),
            cleanText('পরিবর্তন মেনে নেয়া'),
            cleanText('পার্টনারের প্রয়োজন বোঝা')
        ],
        start_small_steps: [
            cleanText('নতুন চিন্তা গ্রহণ'),
            cleanText('সামাজিক যোগাযোগ বাড়ানো'),
            cleanText('নিজের সীমাবদ্ধতা চেনা'),
            cleanText('জীবনে ভারসাম্য বজায় রাখা')
        ]
    },
    'ISFP': {
        general: cleanText(`আপনি একজন নরম স্বভাবের , সংবেদনশীল এবং গভীরভাবে সৃষ্টিশীল মানুষ。 সৌন্দর্য , নান্দনিকতা এবং অভিজ্ঞতার প্রতি আপনার এক অনন্য আকর্ষণ রয়েছে。 আপনি সাধারণত শান্ত এবং অন্তর্মুখী , কিন্তু নিজের পছন্দের বিষয় নিয়ে দারুণ উচ্ছ্বসিত হতে পারেন。 আপনি স্বাধীনভাবে কাজ করতে ভালোবাসেন এবং নিজের মত করে জীবন যাপন করতে চান。 আপনি প্রচলিত নিয়ম-নীতির বাইরে গিয়ে নতুন কিছু তৈরি করতে আগ্রহী。 মানুষ বা পরিবেশের প্রতি সংবেদনশীলতা আপনার অন্যতম বৈশিষ্ট্য。 তবে কখনো কখনো অতিরিক্ত সংবেদনশীলতা বা সিদ্ধান্তহীনতা দেখা দিতে পারে。`),
        strengths: [
            cleanText('সৃজনশীলতা'),
            cleanText('সংবেদনশীলতা'),
            cleanText('নান্দনিক উপলব্ধি'),
            cleanText('স্বাধীনতা'),
            cleanText('সহানুভূতি')
        ],
        challenges: [
            cleanText('সিদ্ধান্তহীনতা'),
            cleanText('অতিরিক্ত সংবেদনশীলতা'),
            cleanText('কাঠামোগত কাজ এড়ানো'),
            cleanText('সময় ব্যবস্থাপনায় দুর্বলতা')
        ],
        career_suggestions: [
            cleanText('শিল্পী'),
            cleanText('গ্রাফিক ডিজাইনার'),
            cleanText('ফটোগ্রাফার'),
            cleanText('ফ্যাশন ডিজাইনার'),
            cleanText('মেকআপ আর্টিস্ট'),
            cleanText('মিউজিশিয়ান'),
            cleanText('ইন্টেরিয়র ডিজাইনার'),
            cleanText('লেখক বা কবি')
        ],
        relationship_tips: [
            cleanText('খোলাখুলি যোগাযোগ'),
            cleanText('নিজের সীমারেখা নির্ধারণ'),
            cleanText('আবেগকে নিয়ন্ত্রণে রাখা'),
            cleanText('সময়ানুবর্তিতা বজায় রাখা')
        ],
        start_small_steps: [
            cleanText('সময় ব্যবস্থাপনা উন্নত করা'),
            cleanText('আত্মবিশ্বাস বাড়ানো'),
            cleanText('কাঠামোগত চিন্তা শেখা'),
            cleanText('ব্যক্তিগত লক্ষ্য নির্ধারণ করা')
        ]
    },
    'ESTJ': {
        general: cleanText(`আপনি এমন একজন , যার মধ্যে নেতৃত্বগুণ এবং সংগঠিতভাবে কাজ করার সহজাত ক্ষমতা রয়েছে。 নিয়ম , কাঠামো , এবং সুনির্দিষ্ট পরিকল্পনা — এগুলো আপনার প্রিয়。 আপনি দ্রুত সিদ্ধান্ত নিতে পারেন এবং দায়িত্ব নিতেও পিছপা হন না。 আপনার বাস্তবিক চিন্তা , কঠোর পরিশ্রম এবং কর্তব্যপরায়ণতা আশেপাশের সবাইকে প্রভাবিত করে。 দলকে সঠিক পথে চালিত করা , সমস্যার দ্রুত সমাধান দেয়া — এটাই আপনার শক্তি。 তবে মাঝে মাঝে আপনি অতিরিক্ত নিয়ন্ত্রণপ্রবণ হয়ে পড়তে পারেন এবং নমনীয়তার অভাব দেখা যায়。 আবেগের প্রতি কম মনোযোগ দেয়ার প্রবণতাও থাকতে পারে。`),
        strengths: [
            cleanText('নেতৃত্বগুণ'),
            cleanText('সংগঠিত চিন্তা'),
            cleanText('দ্রুত সিদ্ধান্ত গ্রহণ'),
            cleanText('বাস্তবিক সমাধান'),
            cleanText('সময়ানুবর্তিতা')
        ],
        challenges: [
            cleanText('নমনীয়তার অভাব'),
            cleanText('আবেগের প্রতি কম মনোযোগ'),
            cleanText('অতিরিক্ত নিয়ন্ত্রণ'),
            cleanText('কঠোর মনোভাব')
        ],
        career_suggestions: [
            cleanText('ম্যানেজার'),
            cleanText('প্রশাসনিক পরিচালক'),
            cleanText('প্রকল্প ব্যবস্থাপক'),
            cleanText('আইন প্রয়োগকারী কর্মকর্তা'),
            cleanText('মিলিটারি অফিসার'),
            cleanText('ব্যবসার মালিক'),
            cleanText('অপারেশনস ম্যানেজার'),
            cleanText('স্কুল অ্যাডমিনিস্ট্রেটর')
        ],
        relationship_tips: [
            cleanText('নমনীয়তা বাড়ানো'),
            cleanText('পার্টনারের মতামতকে সম্মান করা'),
            cleanText('আবেগ বোঝার চেষ্টা করা'),
            cleanText('খোলামেলা আলোচনায় মনোযোগ দেয়া')
        ],
        start_small_steps: [
            cleanText('নমনীয়ভাবে চিন্তা করা'),
            cleanText('আবেগের গুরুত্ব বোঝা'),
            cleanText('দলে সবার মতামত শোনা'),
            cleanText('আত্মবিশ্রাম নেয়া')
        ]
    },
    'INFP': {
        general: cleanText(`আপনি একজন গভীরভাবে চিন্তাশীল , কল্পনাপ্রিয় এবং মূল্যবোধ-কেন্দ্রিক মানুষ。 আপনি নিজের আদর্শ নিয়ে চলেন এবং ন্যায়-অন্যায় , মানবতা , সৌন্দর্য এসব বিষয়ে অত্যন্ত সংবেদনশীল。 আপনার মধ্যে গভীর সৃজনশীলতা এবং মানুষের মঙ্গলের জন্য কাজ করার ইচ্ছা রয়েছে。 আপনি একান্তভাবে বিশ্বাস করেন , এক একজন মানুষও দুনিয়ায় ইতিবাচক পরিবর্তন আনতে পারে。 তবে মাঝে মাঝে বাস্তবতা থেকে দূরে সরে যাওয়া , অতিরিক্ত আবেগপ্রবণতা এবং সিদ্ধান্ত নিতে বিলম্ব হওয়ার প্রবণতা থাকতে পারে。`),
        strengths: [
            cleanText('আদর্শবাদ'),
            cleanText('সৃজনশীলতা'),
            cleanText('গভীর অন্তর্দৃষ্টি'),
            cleanText('মানবিক চিন্তা'),
            cleanText('ন্যায়বোধ')
        ],
        challenges: [
            cleanText('বাস্তবতা থেকে দূরে থাকা'),
            cleanText('অতিরিক্ত আবেগপ্রবণতা'),
            cleanText('সিদ্ধান্তহীনতা'),
            cleanText('অপ্রয়োজনীয় আত্মসমালোচনা')
        ],
        career_suggestions: [
            cleanText('লেখক'),
            cleanText('কবি'),
            cleanText('মানবাধিকার কর্মী'),
            cleanText('শিল্পী'),
            cleanText('থেরাপিস্ট'),
            cleanText('শিক্ষক'),
            cleanText('ডিজাইনার'),
            cleanText('সৃজনশীল কন্টেন্ট নির্মাতা')
        ],
        relationship_tips: [
            cleanText('বাস্তবতাকে গ্রহণ করা'),
            cleanText('নিজের অনুভূতি প্রকাশ করা'),
            cleanText('পার্টনারের বাস্তবিক দিক বুঝা'),
            cleanText('ছোটখাটো বিষয়ে মন খারাপ না করা')
        ],
        start_small_steps: [
            cleanText('বাস্তব চিন্তা শেখা'),
            cleanText('কাজের ধারাবাহিকতা বজায় রাখা'),
            cleanText('আত্মসমালোচনা কমানো'),
            cleanText('আত্মবিশ্বাস তৈরি করা')
        ]
    },
    'ESFP': {
        general: cleanText(`আপনি জীবনকে পুরোপুরি উপভোগ করেন。 মুহূর্তের আনন্দ , মানুষের হাসি , নতুন অভিজ্ঞতা — এগুলো আপনার জীবনযাপনের মূলমন্ত্র。 আপনি স্বাভাবিকভাবেই প্রাণবন্ত , বন্ধুবৎসল এবং সামাজিক。 আপনি মানুষের মাঝে থাকতে ভালোবাসেন এবং তাদের খুশি করতে পছন্দ করেন。 প্রায়ই নতুন কিছুতে নিজেকে যুক্ত করেন এবং জীবনে একঘেয়েমি সহ্য করতে পারেন না。 তবে মাঝে মাঝে ভবিষ্যতের পরিকল্পনায় কম মনোযোগ দেয়া বা দায়িত্ব এড়িয়ে যাওয়ার প্রবণতা থাকতে পারে。`),
        strengths: [
            cleanText('প্রাণবন্ততা'),
            cleanText('মানুষের সঙ্গে সহজে সংযোগ'),
            cleanText('সামাজিকতা'),
            cleanText('মুহূর্ত উপভোগ করার ক্ষমতা'),
            cleanText('সহজাত আনন্দ')
        ],
        challenges: [
            cleanText('ভবিষ্যতের পরিকল্পনায় অনীহা'),
            cleanText('অতিরিক্ত খরচের প্রবণতা'),
            cleanText('দায়িত্ব এড়ানো'),
            cleanText('কাজ অসমাপ্ত রেখে দেয়া')
        ],
        career_suggestions: [
            cleanText('ইভেন্ট প্ল্যানার'),
            cleanText('পারফর্মার'),
            cleanText('পর্যটন গাইড'),
            cleanText('রেস্টুরেন্ট ম্যানেজার'),
            cleanText('কাস্টমার সার্ভিস'),
            cleanText('বিক্রয় প্রতিনিধি'),
            cleanText('ফ্যাশন বা বিউটি কনসাল্ট্যান্ট'),
            cleanText('মিডিয়া পার্সোনালিটি')
        ],
        relationship_tips: [
            cleanText('ভবিষ্যৎ ভাবা'),
            cleanText('দায়িত্ববান আচরণ'),
            cleanText('পার্টনারের অনুভূতি বোঝা'),
            cleanText('বেশি খরচ এড়ানো')
        ],
        start_small_steps: [
            cleanText('সময় ব্যবস্থাপনা'),
            cleanText('ভবিষ্যৎ লক্ষ্য নির্ধারণ'),
            cleanText('ধৈর্যশীল হওয়া'),
            cleanText('ব্যালেন্স তৈরি করা')
        ]
    },
    'ISTP': {
        general: cleanText(`আপনি এক কথায় ' ডুয়ার ' — চিন্তা নয় , কাজ ! আপনি বাস্তবিক সমস্যা মাটিতে দাঁড়িয়ে সমাধান করতে পছন্দ করেন。 হাতে-কলমে কিছু তৈরি করা , মেশিন বা প্রযুক্তির সঙ্গে কাজ করা — এগুলো আপনার স্বাভাবিক শক্তি。 আপনি স্বাধীনভাবে কাজ করতে ভালোবাসেন এবং অপ্রয়োজনীয় নিয়ম-কানুন এড়িয়ে চলেন。 আপনি চুপচাপ কিন্তু প্রখর পর্যবেক্ষণশক্তি সম্পন্ন。 তবে মাঝে মাঝে আবেগ প্রকাশ কম এবং সামাজিক সংযোগের ক্ষেত্রে দূরত্ব দেখা দিতে পারে。`),
        strengths: [
            cleanText('হাতে-কলমে দক্ষতা'),
            cleanText('বাস্তবিক সমস্যা সমাধানে পটু'),
            cleanText('স্বাধীনতা'),
            cleanText('বিশ্লেষণী চিন্তা'),
            cleanText('শান্ত, স্থিতধী')
        ],
        challenges: [
            cleanText('আবেগের প্রকাশ কম'),
            cleanText('সামাজিক দূরত্ব'),
            cleanText('দায়িত্ব এড়ানো'),
            cleanText('রুটিন কাজ অপছন্দ')
        ],
        career_suggestions: [
            cleanText('প্রকৌশলী'),
            cleanText('টেকনিক্যাল বিশেষজ্ঞ'),
            cleanText('মেকানিক'),
            cleanText('সফটওয়্যার ডেভেলoper'),
            cleanText('ড্রোন পাইলট'),
            cleanText('আর্মি বা পুলিশ টেকনিক্যাল ইউনিট'),
            cleanText('পেশাদার গেমার'),
            cleanText('সাইবার সিকিউরিটি এক্সপার্ট')
        ],
        relationship_tips: [
            cleanText('অনুভূতি প্রকাশ করা'),
            cleanText('দায়িত্বশীল থাকা'),
            cleanText('পার্টনারের আবেগ বোঝা'),
            cleanText('সঙ্গীকে সময় দেয়া')
        ],
        start_small_steps: [
            cleanText('সামাজিক যোগাযোগ বাড়ানো'),
            cleanText('কাজের ফোকাস বজায় রাখা'),
            cleanText('দায়িত্ববান আচরণ'),
            cleanText('নমনীয়তা শেখা')
        ]
    },
    'ENTJ': {
        general: cleanText(`আপনি একজন স্বাভাবিক নেতা。 লক্ষ্য নির্ধারণ , রোডম্যাপ তৈরি , এবং সেই লক্ষ্য অর্জনে দলকে সংগঠিত করতে আপনি পারদর্শী。 আপনি বড় চিন্তা করেন এবং ভবিষ্যতের জন্য কৌশলগত পরিকল্পনা করতে ভালোবাসেন。 আপনার আত্মবিশ্বাস , সিদ্ধান্তগ্রহণ ক্ষমতা এবং দৃঢ়তার জন্য সবাই আপনাকে ফলো করে。 আপনি ফলাফল-ভিত্তিক এবং সময় নষ্ট একদমই পছন্দ করেন না。 তবে মাঝে মাঝে মানুষের আবেগের দিকটি উপেক্ষিত হয়ে যায়。`),
        strengths: [
            cleanText('নেতৃত্বগুণ'),
            cleanText('লক্ষ্যভিত্তিক চিন্তা'),
            cleanText('কৌশলগত পরিকল্পনা'),
            cleanText('সংগঠিত ও দৃঢ় মনোভাব'),
            cleanText('ফলাফলমুখী চিন্তা')
        ],
        challenges: [
            cleanText('আবেগের প্রতি কম মনোযোগ'),
            cleanText('নমনীয়তার অভাব'),
            cleanText('কঠোর মনোভাব'),
            cleanText('ব্যক্তিগত সম্পর্কের ক্ষেত্রে কম সময় দেয়া')
        ],
        career_suggestions: [
            cleanText('কর্পোরেট এক্সিকিউটিভ'),
            cleanText('স্ট্রাটেজি কনসালট্যান্ট'),
            cleanText('প্রজেক্ট ম্যানেজার'),
            cleanText('উদ্যোক্তা'),
            cleanText('রাজনীতিবিদ'),
            cleanText('অপারেশনস হেড'),
            cleanText('ইনভেস্টমেন্ট ব্যাংকার'),
            cleanText('আইনি পরামর্শক')
        ],
        relationship_tips: [
            cleanText('নমনীয় হওয়া'),
            cleanText('পার্টনারের অনুভূতি বোঝা'),
            cleanText('কাজ ও সম্পর্কের ভারসাম্য বজায় রাখা'),
            cleanText('মনোযোগ দিয়ে শোনা')
        ],
        start_small_steps: [
            cleanText('আবেগ বোঝার চেষ্টা'),
            cleanText('নমনীয়তা শেখা'),
            cleanText('আত্মবিশ্রাম নেয়া'),
            cleanText('সম্পর্কের ছোট ছোট বিষয়কে মূল্য দেয়া')
        ]
    },
    'ENFJ': {
        general: cleanText(`আপনি এমন একজন ব্যক্তি , যিনি স্বাভাবিকভাবেই অন্যদের অনুপ্রাণিত করেন。 আপনার কথা , আচরণ , এবং উপস্থিতিতেই ইতিবাচক শক্তি ছড়িয়ে পড়ে。 আপনি দলের মানুষ , এবং সবার ভালোর জন্য কাজ করতে ভালোবাসেন。 আপনার মধ্যে রয়েছে দারুণ সহানুভূতি , নেতৃত্বদানের ক্ষমতা এবং মানুষের শক্তিকে জাগিয়ে তোলার গুণ。 আপনাকে প্রায়ই গাইড , শিক্ষক বা মেন্টরের ভূমিকায় দেখা যায়。 তবে মাঝে মাঝে নিজেকে উপেক্ষা করে অন্যের প্রয়োজনকেই বেশি গুরুত্ব দেন。`),
        strengths: [
            cleanText('অনুপ্রেরণার উৎস'),
            cleanText('সহানুভূতি'),
            cleanText('নেতৃত্বগুণ'),
            cleanText('মানুষের বিকাশে আগ্রহী'),
            cleanText('যোগাযোগ দক্ষতা')
        ],
        challenges: [
            cleanText('নিজেকে অবহেলা করা'),
            cleanText('অতিরিক্ত চাপ নেওয়া'),
            cleanText('অন্যের অনুমোদনের প্রতি অতিরিক্ত নির্ভরতা'),
            cleanText('মাঝে মাঝে অতিরিক্ত আবেগপ্রবণ হয়ে পড়া')
        ],
        career_suggestions: [
            cleanText('শিক্ষক'),
            cleanText('কোচ বা মেন্টর'),
            cleanText('পাবলিক স্পিকার'),
            cleanText('নন-প্রফিট সংগঠক'),
            cleanText('এইচআর ম্যানেজার'),
            cleanText('লাইফ কোচ'),
            cleanText('ট্রেইনার'),
            cleanText('থেরাপিস্ট')
        ],
        relationship_tips: [
            cleanText('নিজের প্রয়োজনকে গুরুত্ব দেয়া'),
            cleanText('আত্মবিশ্রাম নেয়া'),
            cleanText('পার্টনারের স্বাধীনতা দেয়া'),
            cleanText('অতিরিক্ত নিয়ন্ত্রণ এড়ানো')
        ],
        start_small_steps: [
            cleanText('নিজের সীমারেখা নির্ধারণ'),
            cleanText('দায়িত্বের ভারসাম্য রাখা'),
            cleanText('নিজের জন্য সময় বের করা'),
            cleanText('আত্মবিশ্বাস ধরে রাখা')
        ]
    },
};


const App = () => {
    const [screen, setScreen] = useState('start'); // 'start', 'test', 'result'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // userAnswers now stores object where key is questionIndex (number) and value is selectedScaleIndex (number 0-6)
    const [userAnswers, setUserAnswers] = useState({});
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

    // Using useRef to hold a mutable value that doesn't trigger re-renders
    // This will help in ensuring the submitTest has the absolutely latest answers
    const latestUserAnswers = useRef(userAnswers);

    // Update the ref whenever userAnswers state changes
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
        // Do not clear message automatically if it's a critical "answer the question" message
        // The message will be cleared on selectAnswer or previousQuestion
        if (msg !== "অনুগ্রহ করে এই প্রশ্নের উত্তর দিন।") {
             setTimeout(() => {
                setMessage('');
            }, 3000);
        }
    };

    /**
     * Handles the selection of an answer option on the 7-point scale.
     * Stores the selected index (0-6). No automatic navigation from here.
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

        // Use setTimeout to allow state to update before navigating or submitting
        // This is crucial for auto-next/submit based on latest state
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            } else {
                // If it's the last question, directly call submitTest
                // This ensures auto-submit on last question answered
                // We pass true to indicate it's an auto-submit from selectAnswer
                submitTest(true); 
            }
        }, 50); // Small delay to allow state update to complete
    };

    /**
     * Moves to the next question. This function will be called directly by the Next button.
     * It will first check if an answer has been provided for the current question.
     */
    const nextQuestion = () => {
        // Check if the current question has been answered using the LATEST value from ref
        if (latestUserAnswers.current[currentQuestionIndex] === undefined) {
            showMessage("অনুগ্রহ করে এই প্রশ্নের উত্তর দিন।");
            return;
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            setMessage(''); // Clear message if successfully moving forward
        } else {
            // If it's the last question and Next is clicked, submit.
            // This caters to manual 'Next' click on the very last question.
            submitTest(false); // Pass false to indicate manual submit
        }
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
     * @returns {string} The 5-letter personality type.
     */
    const calculatePersonalityType = () => {
        // Use the LATEST userAnswers from the ref for calculation
        const answersToCalculate = latestUserAnswers.current;

        // Recalculate all scores from userAnswers just before final type calculation
        const tempScores = {
            'E': 0, 'I': 0, 'S': 0, 'N': 0,
            'T': 0, 'F': 0, 'J': 0, 'P': 0,
            'A': 0, 'X': 0
        };

        // This check is now more robust as userAnswers is an object and keys directly map to question indices
        if (Object.keys(answersToCalculate).length !== questions.length) {
            console.error("Not all questions answered when calculating personality type. Current answers:", Object.keys(answersToCalculate).length, "Total questions:", questions.length);
            return "UNKNOWN"; // Return a specific error type
        }


        Object.keys(answersToCalculate).forEach(qIndexStr => {
            const qIndex = parseInt(qIndexStr);
            const answerValue = answersToCalculate[qIndex];
            const question = questions[qIndex];

            const [trait1, trait2] = question.traitPair;
            const scoreValue = answerValue - 3; // Map 0-6 to -3 to +3

            if (scoreValue > 0) {
                tempScores[trait1] += scoreValue;
            } else if (scoreValue < 0) {
                tempScores[trait2] += Math.abs(scoreValue);
            }
        });


        let type = '';
        type += (tempScores['E'] >= tempScores['I']) ? 'E' : 'I';
        type += (tempScores['S'] >= tempScores['N']) ? 'S' : 'N';
        type += (tempScores['T'] >= tempScores['F']) ? 'T' : 'F';
        type += (tempScores['J'] >= tempScores['P']) ? 'J' : 'P';
        type += (tempScores['A'] >= tempScores['X']) ? 'A' : 'X';
        return type;
    };

    /**
     * Submits the test, calculates scores, and displays results.
     * @param {boolean} isAutoSubmit - True if called automatically from selectAnswer, false if from manual button click.
     */
    const submitTest = (isAutoSubmit = false) => { // Added isAutoSubmit parameter
        // Get the absolute latest answers for validation and calculation
        const answersToSubmit = latestUserAnswers.current;

        // Check if the current (50th) question has been answered.
        // This is a direct check on the latest state.
        if (answersToSubmit[currentQuestionIndex] === undefined) {
            showMessage("অনুগ্রহ করে এই প্রশ্নের উত্তর দিন।", 'error');
            return;
        }

        // Verify that ALL questions have been answered.
        // This is the most critical check: ensure every question index has an answer.
        if (Object.keys(answersToSubmit).length !== questions.length) {
            showMessage("অনুগ্রহ করে সব প্রশ্নের উত্তর দিন।", 'error');
            return;
        }
        
        // If we reach here, all answers are present and valid. Proceed with calculation.
        const newScores = {
            'E': 0, 'I': 0, 'S': 0, 'N': 0,
            'T': 0, 'F': 0, 'J': 0, 'P': 0,
            'A': 0, 'X': 0
        };

        Object.keys(answersToSubmit).forEach(qIndexStr => {
            const qIndex = parseInt(qIndexStr);
            const answerValue = answersToSubmit[qIndex];
            const question = questions[qIndex];

            const [trait1, trait2] = question.traitPair;
            const scoreValue = answerValue - 3; // Map 0-6 to -3 to +3

            if (scoreValue > 0) {
                newScores[trait1] += scoreValue;
            } else if (scoreValue < 0) {
                newScores[trait2] += Math.abs(scoreValue);
            }
        });
        setPersonalityScores(newScores); // Update scores state

        // Calculate final type using the just-calculated scores
        const finalCalculatedType = calculatePersonalityTypeFromScores(newScores);
        setResultType(finalCalculatedType); // Set the result type
        setScreen('result'); // Move to result screen
    };

    /**
     * Resets the test to its initial state.
     */
    const restartTest = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers({}); // Reset to empty object
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

    // This useEffect hook is solely responsible for calculating and setting the result type
    // once the 'result' screen is active. It uses the latest data from `latestUserAnswers.current`.
    useEffect(() => {
        if (screen === 'result') {
            const calculatedType = calculatePersonalityType(); // This will use latestUserAnswers.current
            setResultType(calculatedType);
        }
    }, [screen]); // Only depend on screen changing to 'result'


    // Helper function to calculate type from given scores (used in submitTest and useEffect)
    const calculatePersonalityTypeFromScores = (scores) => {
        let type = '';
        type += (scores['E'] >= scores['I']) ? 'E' : 'I';
        type += (scores['S'] >= scores['N']) ? 'S' : 'N';
        type += (scores['T'] >= scores['F']) ? 'T' : 'F';
        type += (scores['J'] >= scores['P']) ? 'J' : 'P';
        type += (scores['A'] >= scores['X']) ? 'A' : 'X';
        return type;
    };


    const currentQuestion = questions[currentQuestionIndex];
    // Find the selected index for the current question (from the object)
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
                            {/* Removed the Next button entirely, as requested, now that auto-advance works */}
                            {/* The submitTest will be automatically called when the 50th question is answered */}
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
                            {/* Dynamically display general description or fallback */}
                            {personalityDescriptions[resultType]?.general || personalityDescriptions[resultType.substring(0, 4)]?.general || 'আপনার ব্যক্তিত্বের ধরণ সম্পর্কে একটি সংক্ষিপ্ত বর্ণনা।'}
                        </p>

                        {/* Updated Personal Development Section */}
                        { (personalityDescriptions[resultType]?.start_small_steps || personalityDescriptions[resultType.substring(0, 4)]?.start_small_steps) && (
                            <div className="text-left mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-2xl font-semibold mb-3 text-gray-700">স্টার্ট স্মল স্টেপস:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {(personalityDescriptions[resultType]?.start_small_steps || personalityDescriptions[resultType.substring(0, 4)]?.start_small_steps)?.map((tip, idx) => (
                                        <li key={idx}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Updated Career Suggestions Section */}
                        { (personalityDescriptions[resultType]?.career_suggestions || personalityDescriptions[resultType.substring(0, 4)]?.career_suggestions) && (
                            <div className="text-left mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-2xl font-semibold mb-3 text-gray-700">ক্যারিয়ার সাজেশন্স:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {(personalityDescriptions[resultType]?.career_suggestions || personalityDescriptions[resultType.substring(0, 4)]?.career_suggestions)?.map((suggestion, idx) => (
                                        <li key={idx}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {/* New Strengths Section */}
                        { (personalityDescriptions[resultType]?.strengths || personalityDescriptions[resultType.substring(0, 4)]?.strengths) && (
                            <div className="text-left mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-2xl font-semibold mb-3 text-gray-700">আপনার শক্তি:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {(personalityDescriptions[resultType]?.strengths || personalityDescriptions[resultType.substring(0, 4)]?.strengths)?.map((strength, idx) => (
                                        <li key={idx}>{strength}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* New Challenges Section */}
                        { (personalityDescriptions[resultType]?.challenges || personalityDescriptions[resultType.substring(0, 4)]?.challenges) && (
                            <div className="text-left mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-2xl font-semibold mb-3 text-gray-700">আপনার চ্যালেঞ্জ:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {(personalityDescriptions[resultType]?.challenges || personalityDescriptions[resultType.substring(0, 4)]?.challenges)?.map((challenge, idx) => (
                                        <li key={idx}>{challenge}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* New Relationship Tips Section */}
                        { (personalityDescriptions[resultType]?.relationship_tips || personalityDescriptions[resultType.substring(0, 4)]?.relationship_tips) && (
                            <div className="text-left mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-2xl font-semibold mb-3 text-gray-700">সম্পর্ক টিপস:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {(personalityDescriptions[resultType]?.relationship_tips || personalityDescriptions[resultType.substring(0, 4)]?.relationship_tips)?.map((tip, idx) => (
                                        <li key={idx}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

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
                © 2025 WHORU. এটি শুরু একটি টেস্ট নয় — এটি আপনার নিজের সাথে একটি সংলাপ। নিজেকে জানার এই যাত্রায়... আপনি কি প্রস্তুত?
            </footer>
        </div>
    );
};

export default App;
