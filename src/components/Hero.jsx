import { Sparkles } from 'lucide-react';
import ProviderIcon from './ProviderIcon';
import { PROVIDER_NAMES } from '../config/providers';
export default function Hero(){ return <section className="hero"><div className="badge"><Sparkles size={13}/> ЖИ көмегімен есеп шығару</div><h1>Бір есеп.<br/><span>Төрт ЖИ шешімі.</span></h1><p>Есептің суретін жүктеп,<br className="desktop-break"/> ChatGPT, DeepSeek, Claude және Grok жауаптарын салыстырыңыз.</p><div className="provider-row">{PROVIDER_NAMES.map(p=><div key={p}><ProviderIcon provider={p}/><span>{p}</span></div>)}</div></section>; }
