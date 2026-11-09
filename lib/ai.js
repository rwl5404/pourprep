// Calls the Anthropic API to turn a bar's menu, specs, and policies into a training kit.
// The API key lives in the ANTHROPIC_API_KEY environment variable, never in code.

const MODEL = process.env.AI_MODEL || 'claude-haiku-5-5';

const SYSTEM = `You are PourPrep, an expert bar manager who writes training material for new seasonal bartenders and barbacks.
You will receive a bar's own menu, cocktail specs, and house policies. Build training that is specific to THIS bar:
use its exact drink names, pours, glassware, garnishes, prices, and rules. Never invent drinks or policies that are not in the material.
If the material is thin, work with what is there and keep items accurate rather than padding.

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{
  "guide": {
    "overview": "2-3 sentence welcome that says what this bar is and what a new hire must master first",
    "sections": [
      { "title": "short section title", "points": ["concise, specific bullet", "..."] }
    ]
  },
  "flashcards": [
    { "front": "a drink name or policy question", "back": "the exact spec or answer" }
  ],
  "quiz": [
    {
      "question": "a question about this bar's specs or policies",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "one sentence on why the correct option is right, citing the bar's material"
    }
  ]
}

Rules:
- guide: 4-6 sections (e.g. signature cocktails, pours & measurements, beer/wine, service & closing, house policies). 3-6 points each.
- flashcards: 12 cards, mostly cocktail specs (ingredients, amounts, glass, garnish), some policies.
- quiz: 10 multiple-choice questions, exactly 4 options each, "answer" is the 0-based index of the correct option.
  Wrong options must be plausible (e.g. a neighbouring pour size or another drink's garnish). Vary the position of the correct answer.`;

export async function generateKit({ barName, material }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set in Vercel environment variables.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 6000,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Bar name: ${barName}\n\nBar material (menu, specs, policies):\n"""\n${material}\n"""\n\nBuild the training kit JSON now.`,
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `AI request failed (${res.status})`);
  }

  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  return normalizeKit(parseJson(text));
}

function parseJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('The AI response was not valid JSON. Try again.');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error('The AI response was not valid JSON. Try again.');
  }
}

function normalizeKit(raw) {
  const str = (v) => (typeof v === 'string' ? v.trim() : '');

  const sections = Array.isArray(raw?.guide?.sections) ? raw.guide.sections : [];
  const guide = {
    overview: str(raw?.guide?.overview),
    sections: sections
      .map((s) => ({
        title: str(s?.title),
        points: (Array.isArray(s?.points) ? s.points : []).map(str).filter(Boolean),
      }))
      .filter((s) => s.title && s.points.length),
  };

  const flashcards = (Array.isArray(raw?.flashcards) ? raw.flashcards : [])
    .map((c) => ({ front: str(c?.front), back: str(c?.back) }))
    .filter((c) => c.front && c.back);

  const quiz = (Array.isArray(raw?.quiz) ? raw.quiz : [])
    .map((q) => {
      const options = (Array.isArray(q?.options) ? q.options : []).map(str).filter(Boolean);
      const answer = Number(q?.answer);
      return { question: str(q?.question), options, answer, explanation: str(q?.explanation) };
    })
    .filter(
      (q) => q.question && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length
    );

  if (!guide.sections.length && !flashcards.length && !quiz.length) {
    throw new Error('The AI returned an empty kit. Add more detail to your material and try again.');
  }
  return { guide, flashcards, quiz };
}
