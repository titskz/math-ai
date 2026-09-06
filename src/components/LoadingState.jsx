import ProviderIcon from './ProviderIcon';
import { PROVIDER_NAMES } from '../config/providers';
export function Skeleton(){return <div className="skeleton-content" aria-label="Шешім жүктеліп жатыр"><div/><div/><div/><div/></div>;}
export default function LoadingState(){return <section className="loading-state" role="status"><div className="thinking-row">{PROVIDER_NAMES.map(p=><div key={p}><ProviderIcon provider={p}/><span>{p}<small>Ойлануда<span className="dots">...</span></small></span></div>)}</div><div className="result-grid">{[0,1,2,3].map(i=><div className="result-card" key={i}><Skeleton/></div>)}</div></section>;}
