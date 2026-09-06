import { PROVIDERS, getModel } from '../config/providers';

const SYSTEM_PROMPT = `Сен математика мұғалімісің. Суреттегі есепті қадамдық шеш.
Тек JSON қайтар (markdown жоқ):
{"answer":"x = 12","method":"Қысқа әдіс атауы","solution":[{"text":"Қадам сипаттамасы","math":"2x = 24"}]}
answer — соңғы жауап, math — KaTeX/LaTeX форматында.`;

function parseModelJson(content) {
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON табылмады');
  const parsed = JSON.parse(match[0]);
  if (!parsed.answer || !Array.isArray(parsed.solution)) {
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

async function askProvider(provider, imageBase64, signal) {
  const model = getModel(provider);
  if (!model) throw new Error(`Белгісіз провайдер: ${provider}`);

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY орнатылмаған');

  const start = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://multimath-ai.github.io',
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
      max_tokens: 1200,
      temperature: 0.2,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Бос жауап');

  const parsed = parseModelJson(content);
  return {
    provider,
    status: 'completed',
    latency: Math.round((Date.now() - start) / 100) / 10,
    ...parsed,
  };
}

export async function solveProblem({ provider, imageBase64, signal, onResult } = {}) {
  if (!imageBase64) throw new Error('Сурет жоқ');

  const targets = provider
    ? PROVIDERS.filter((p) => p.name === provider)
    : PROVIDERS;

  await Promise.all(
    targets.map(async ({ name }) => {
      try {
        const result = await askProvider(name, imageBase64, signal);
        onResult?.(result);
        return result;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        const failed = { provider: name, status: 'failed' };
        onResult?.(failed);
        return failed;
      }
    }),
  );
}
