export type Category = "funny" | "deep" | "future" | "mundane" | "spicy" | "memories";

export interface Question {
  text: string;
  category: Category;
  intensity: number; // 1-3
}

export const PREDICT_QUESTIONS: Question[] = [
  { text: "If I could only eat one cuisine for a month, which would I pick?", category: "mundane", intensity: 1 },
  { text: "What's my go-to coffee or tea order?", category: "mundane", intensity: 1 },
  { text: "Which movie have I watched the most times?", category: "memories", intensity: 1 },
  { text: "What am I most likely to forget when packing for a trip?", category: "funny", intensity: 1 },
  { text: "If I had a free Saturday with zero plans, what would I choose to do?", category: "mundane", intensity: 1 },
  { text: "Which song would I pick for a karaoke duet with you?", category: "funny", intensity: 1 },
  { text: "What's something small that always makes my day better?", category: "mundane", intensity: 1 },
  { text: "If we were ordering pizza, which topping would I fight for?", category: "funny", intensity: 1 },
  { text: "What emotion have I been feeling most this week?", category: "deep", intensity: 2 },
  { text: "What's one thing I'm looking forward to right now?", category: "future", intensity: 2 },
  { text: "What would I say is my biggest fear for our relationship?", category: "deep", intensity: 3 },
  { text: "In what way do I most want to grow in the next year?", category: "deep", intensity: 3 },
  { text: "What's a memory of us I think about often?", category: "memories", intensity: 2 },
  { text: "If I could change one thing about how we communicate, what would it be?", category: "deep", intensity: 2 },
  { text: "What would make me feel most loved today?", category: "spicy", intensity: 2 },
  { text: "What gift would genuinely surprise me?", category: "future", intensity: 2 },
  { text: "Which of these would I choose for our next date?", category: "future", intensity: 2 },
  { text: "What's a weird habit I have that you probably already know?", category: "funny", intensity: 1 },
  { text: "What is my actual love language ranking?", category: "deep", intensity: 2 },
  { text: "What would I pick: a sunrise or a sunset together?", category: "memories", intensity: 1 },
  { text: "What activity would I want us to do on our next visit?", category: "future", intensity: 2 },
  { text: "What is my biggest pet peeve?", category: "funny", intensity: 1 },
  { text: "What do I need more of in my life right now?", category: "deep", intensity: 2 },
  { text: "If I could teleport to you right now, what's the first thing I'd do?", category: "spicy", intensity: 2 },
  { text: "What fictional couple reminds me of us?", category: "funny", intensity: 1 },
  { text: "What's a tradition I'd want us to start?", category: "future", intensity: 2 },
  { text: "Which of my qualities do I hope you notice most?", category: "spicy", intensity: 2 },
  { text: "What was my first impression of you?", category: "memories", intensity: 2 },
  { text: "What am I probably overthinking about today?", category: "deep", intensity: 2 },
  { text: "What one word would I use to describe us?", category: "spicy", intensity: 1 },
];

let questionHash = 0;
export function pickDailyQuestion(seed: string, usedHashes: number[]): Question {
  const base = seed
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const day = new Date().toISOString().slice(0, 10);
  let idx = (base + day.split("-").reduce((a, b) => a + parseInt(b, 10), 0)) % PREDICT_QUESTIONS.length;
  let safety = 0;
  while (usedHashes.includes(questionHashFrom(PREDICT_QUESTIONS[idx])) && safety < PREDICT_QUESTIONS.length) {
    idx = (idx + 1) % PREDICT_QUESTIONS.length;
    safety++;
  }
  return PREDICT_QUESTIONS[idx];
}

function questionHashFrom(q: Question): number {
  let h = 0;
  for (let i = 0; i < q.text.length; i++) {
    h = (h << 5) - h + q.text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function hashQuestion(q: Question): number {
  return questionHashFrom(q);
}
