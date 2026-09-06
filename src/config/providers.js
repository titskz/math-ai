export const PROVIDERS = [
  { name: 'ChatGPT', model: 'openai/gpt-4o-mini' },
  { name: 'DeepSeek', model: 'deepseek/deepseek-v4-flash-vision-exp' },
  { name: 'Claude', model: 'anthropic/claude-3.5-sonnet' },
  { name: 'Grok', model: 'x-ai/grok-2-vision-1212' },
];

export const PROVIDER_NAMES = PROVIDERS.map((p) => p.name);

export function getModel(provider) {
  return PROVIDERS.find((p) => p.name === provider)?.model;
}
