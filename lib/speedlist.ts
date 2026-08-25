export const SPEEDLIST_PROMPTS = [
  "Things that remind you of me",
  "Places we want to visit together",
  "Foods we want to eat together",
  "Songs that describe us",
  "Small things you love about me",
  "Things we do when we finally meet",
  "Movies we want to watch together",
  "Ways we say 'I miss you' without words",
  "Things that make us laugh",
  "Gifts we'd love to receive",
  "Habits we've picked up from each other",
  "Things we want to learn together",
  "Moments we can't wait to experience",
  "Things that make us feel close even far apart",
  "Compliments we want to give each other",
];

export function pickPromptFor(dayKey: string) {
  const hash = dayKey.split("-").reduce((a, b) => a + parseInt(b, 10), 0);
  return SPEEDLIST_PROMPTS[hash % SPEEDLIST_PROMPTS.length];
}
