export interface WyrQuestion {
  optionA: string;
  optionB: string;
}

export const WYR_QUESTIONS: WyrQuestion[] = [
  { optionA: "Be able to read each other's minds", optionB: "Be able to teleport to each other instantly" },
  { optionA: "Spend a weekend in a cozy cabin with no wifi", optionB: "Spend a weekend in a busy city with no plans" },
  { optionA: "Have dinner cooked for you every night", optionB: "Never have to do dishes again" },
  { optionA: "Watch the sunrise together", optionB: "Watch the sunset together" },
  { optionA: "Receive a long handwritten letter", optionB: "Receive a surprise voice note every morning" },
  { optionA: "Be the funniest couple", optionB: "Be the most adventurous couple" },
  { optionA: "Always know what the other is feeling", optionB: "Always know what the other wants to eat" },
  { optionA: "Have a double date with your past selves", optionB: "Have a double date with your future selves" },
  { optionA: "Speak every language together", optionB: "Travel to every country together" },
  { optionA: "Be famous as a couple", optionB: "Be completely anonymous together" },
  { optionA: "Have unlimited time but no money", optionB: "Have unlimited money but no free time" },
  { optionA: "Live somewhere hot all year", optionB: "Live somewhere cold all year" },
  { optionA: "Always have to dress fancy", optionB: "Always have to wear pajamas" },
  { optionA: "Go a week with no texts, only calls", optionB: "Go a week with no calls, only texts" },
  { optionA: "Have a date every single day", optionB: "Have one big date every month" },
  { optionA: "Be able to see a replay of your best memory", optionB: "Be able to see a preview of your next big one" },
  { optionA: "Share a bubble bath with snacks", optionB: "Share a blanket fort with movies" },
  { optionA: "Get matching tattoos", optionB: "Get matching ridiculous haircuts" },
  { optionA: "Write a love song together", optionB: "Paint a terrible portrait of each other" },
  { optionA: "Have breakfast in bed every morning", optionB: "Have a midnight snack date every night" },
];

export function hashWyr(q: WyrQuestion) {
  return q.optionA
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}
