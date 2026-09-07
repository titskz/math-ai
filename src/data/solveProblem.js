import { PROVIDERS, getModel } from '../config/providers';

const SYSTEM_PROMPT = `Сен математика мұғалімісің. Суреттегі есепті қадамдық шеш.
Тек JSON қайтар (markdown жоқ, қосымша мәтін жоқ):
{"answer":"x = 12","method":"Қысқа әдіс","solution":[{"text":"Қадам","math":"2x = 24"}]}
answer — соңғы жауап. math — KaTeX/LaTeX, backslash-терді JSON-да экранда (\\\\frac).`;

function normalizeParsed(parsed) {
  if (!parsed?.answer || !Array.isArray(parsed.solution)) {
    throw new Error('Жауап форматы дұрыс емес');
  }
  return {
    answer: String(parsed.answer),
    method: String(parsed.method || 'Қадамдық шешу'),
    solution: parsed.solution.map((step) => ({
      text: String(step.text || ''),
      math: String(step.math || ''),
    })),
  };
}

function fallbackParse(content) {
  const answer =
    content.match(/"answer"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1]?.replace(/\\"/g, '"') ||
    content.match(/"answer"\s*:\s*'([^']*)'/)?.[1];
  const method =
    content.match(/"method"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1]?.replace(/\\"/g, '"') ||
    'Қадамдық шешу';

  const steps = [];
  const stepRe = /"text"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"math"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = stepRe.exec(content))) {
    steps.push({
      text: match[1].replace(/\\"/g, '"'),
      math: match[2].replace(/\\"/g, '"'),
    });
  }

  if (!answer && steps.length === 0) {
    throw new Error('JSON парсинг қатесі');
  }

  return {
    answer: answer || 'Жауап табылмады',
    method,
    solution: steps.length ? steps : [{ text: content.slice(0, 400), math: '' }],
  };
}

function parseModelJson(content) {
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON табылмады');

  const raw = match[0];
  try {
    return normalizeParsed(JSON.parse(raw));
  } catch {
    try {
      const fixed = raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      return normalizeParsed(JSON.parse(fixed));
    } catch {
      return fallbackParse(cleaned);
    }
  }
}

function parseApiError(text, status) {
  try {
    const data = JSON.parse(text);
    return data.error?.message || data.message || `HTTP ${status}`;
  } catch {
    return text?.slice(0, 120) || `HTTP ${status}`;
  }
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

async function askProviderOnce(provider, imageBase64, signal) {
  const model = getModel(provider);
  if (!model) throw new Error(`Белгісіз провайдер: ${provider}`);

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER API кілті орнатылмаған');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://titskz.github.io/math-ai/',
      'X-Title': 'MultiMath AI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Суреттегі математикалық есепті шеш.' },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 2500,
      temperature: 0.2,
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(parseApiError(await res.text(), res.status));
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Бос жауап');

  return parseModelJson(content);
}

async function askProvider(provider, imageBase64, signal) {
  const start = Date.now();
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await wait(800 * attempt, signal);
      const parsed = await askProviderOnce(provider, imageBase64, signal);
      return {
        provider,
        status: 'completed',
        latency: Math.round((Date.now() - start) / 100) / 10,
        ...parsed,
      };
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      lastError = e;
    }
  }

  throw lastError || new Error('Белгісіз қате');
}

export async function solveProblem({ provider, imageBase64, signal, onResult } = {}) {
  if (!imageBase64) throw new Error('Сурет жоқ');

  const targets = provider
    ? PROVIDERS.filter((p) => p.name === provider)
    : PROVIDERS;

  await Promise.all(
    targets.map(async ({ name }, index) => {
      try {
        if (index > 0) await wait(index * 250, signal);
        const result = await askProvider(name, imageBase64, signal);
        onResult?.(result);
        return result;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        const failed = {
          provider: name,
          status: 'failed',
          error: e.message || 'Белгісіз қате',
        };
        onResult?.(failed);
        return failed;
      }
    }),
  );
}
