import { Aperture, Waves, Asterisk, Orbit } from 'lucide-react';
const icons = { ChatGPT: Aperture, DeepSeek: Waves, Claude: Asterisk, Grok: Orbit };
export default function ProviderIcon({ provider }) { const Icon = icons[provider]; return <span className={`provider-icon ${provider.toLowerCase()}`}><Icon size={20} strokeWidth={1.7} /></span>; }
