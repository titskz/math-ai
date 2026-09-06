import { Sparkles, ArrowRight, LoaderCircle } from 'lucide-react';
export default function SolveButton({ loading, onClick }) {return <button className="solve-button" onClick={onClick} disabled={loading}>{loading?<LoaderCircle size={18} className="spin"/>:<Sparkles size={18}/>}<span>{loading?'Есеп талданып жатыр...':'4 ЖИ көмегімен шығару'}</span>{!loading&&<ArrowRight size={18}/>}</button>;}
