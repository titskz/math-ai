import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, RotateCcw, Plus } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import UploadCard from './components/UploadCard';
import SolveButton from './components/SolveButton';
import LoadingState from './components/LoadingState';
import ConsensusCard from './components/ConsensusCard';
import AiResultCard from './components/AiResultCard';
import { solveProblem } from './data/solveProblem';
import { imageToBase64 } from './utils/image';
import { PROVIDER_NAMES } from './config/providers';

const initialResults = () => PROVIDER_NAMES.map((provider) => ({ provider, status: 'loading' }));

export default function App() {
  const [dark, setDark] = useState(false);
  const [image, setImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const controllers = useRef(new Set());
  const generation = useRef(0);
  const toastTimer = useRef();
  const imageRef = useRef(null);
  const validation = useRef(0);

  function cancel() {
    generation.current++;
    controllers.current.forEach((c) => c.abort());
    controllers.current.clear();
    setLoading(false);
    setResults([]);
  }

  function reset() {
    validation.current++;
    cancel();
    if (imageRef.current) URL.revokeObjectURL(imageRef.current.url);
    imageRef.current = null;
    setImage(null);
    setError('');
  }

  async function onFile(file) {
    if (!file) return;
    const version = ++validation.current;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('PNG, JPG немесе WEBP форматындағы суретті таңдаңыз.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Көлемі 10 МБ-тан аспайтын суретті таңдаңыз.');
      return;
    }
    const url = URL.createObjectURL(file);
    const check = new Image();
    check.src = url;
    try {
      await check.decode();
    } catch {
      URL.revokeObjectURL(url);
      if (version === validation.current) setError('Сурет ашылмады. Басқа суретті таңдаңыз.');
      return;
    }
    if (version !== validation.current) {
      URL.revokeObjectURL(url);
      return;
    }
    cancel();
    if (imageRef.current) URL.revokeObjectURL(imageRef.current.url);
    const next = { url, name: file.name };
    imageRef.current = next;
    setImage(next);
    setError('');
  }

  useEffect(() => {
    const paste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (item) {
        e.preventDefault();
        onFile(item.getAsFile());
      }
    };
    window.addEventListener('paste', paste);
    return () => window.removeEventListener('paste', paste);
  }, []);

  useEffect(
    () => () => {
      controllers.current.forEach((c) => c.abort());
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.url);
      clearTimeout(toastTimer.current);
      validation.current++;
    },
    [],
  );

  async function run(provider) {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      setError('OpenRouter API кілті орнатылмаған. GitHub Secrets немесе .env.local тексеріңіз.');
      return;
    }

    const epoch = generation.current;
    const controller = new AbortController();
    controllers.current.add(controller);

    if (provider) {
      setResults((rs) => rs.map((r) => (r.provider === provider ? { ...r, status: 'loading' } : r)));
    } else {
      setLoading(true);
      setResults(initialResults());
    }

    try {
      const imageBase64 = await imageToBase64(imageRef.current.url);
      if (epoch !== generation.current) return;

      await solveProblem({
        provider,
        imageBase64,
        signal: controller.signal,
        onResult: (result) => {
          if (epoch !== generation.current) return;
          setResults((rs) =>
            provider
              ? rs.map((r) => (r.provider === provider ? result : r))
              : rs.map((r) => (r.provider === result.provider ? result : r)),
          );
        },
      });
    } catch (e) {
      if (e.name !== 'AbortError') {
        if (provider) {
          setResults((rs) => rs.map((r) => (r.provider === provider ? { ...r, status: 'failed' } : r)));
        } else {
          setError('Қате пайда болды. Қайталап көріңіз.');
        }
      }
    } finally {
      controllers.current.delete(controller);
      if (epoch === generation.current && !provider) setLoading(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setToast('Көшірілді');
    } catch {
      setToast('Алмасу буфері қолжетімсіз. Мәтінді белгілеп, көшіріңіз.');
    }
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }

  return (
    <div className={`app ${dark ? 'dark' : ''}`}>
      <Header dark={dark} onToggle={() => setDark((v) => !v)} />
      <main>
        <Hero />
        <div className="workspace">
          <div className="section-label">
            <span>
              <span className="section-number">01</span>СІЗДІҢ ЕСЕБІҢІЗ
            </span>
            <span>Бір сурет. Төрт шешім.</span>
          </div>
          <UploadCard image={image} onFile={onFile} onRemove={reset} error={error} />
          {image && (
            <div className="solve-area">
              <div className="demo-controls">
                <button onClick={reset} className="reset-button">
                  <RotateCcw size={14} />
                  Тазалау
                </button>
              </div>
              <SolveButton loading={loading} onClick={() => run()} />
            </div>
          )}
          {!image && (
            <div className="flow">
              <span>
                <b>1</b>Суретті жүктеңіз
              </span>
              <ArrowRight size={14} />
              <span>
                <b>2</b>Төрт шешім алыңыз
              </span>
              <ArrowRight size={14} />
              <span>
                <b>3</b>Жауаптарды салыстырыңыз
              </span>
            </div>
          )}
        </div>
        {loading && <LoadingState />}
        {results.length > 0 && (
          <section className="results" aria-label="ЖИ жауаптары">
            <div className="results-title">
              <div>
                <div className="eyebrow">ТӨРТ ШЕШІМ — БІР ЖЕРДЕ</div>
                <h2>ЖИ жауаптары</h2>
              </div>
              <button onClick={reset}>
                <Plus size={16} />
                Жаңа есеп
              </button>
            </div>
            <ConsensusCard results={results} />
            <div className="result-grid">
              {results.map((r) => (
                <AiResultCard key={r.provider} result={r} onCopy={copy} onRegenerate={run} />
              ))}
            </div>
            <p className="results-note">
              Сәйкестік жауаптардың ұқсастығын көрсетеді, олардың дұрыстығына кепілдік бермейді.
            </p>
          </section>
        )}
      </main>
      <footer className="page-footer">
        <span>
          MultiMath AI <span className="footer-dot">·</span> Білімге жаңа көзқарас.
        </span>
        <span>
          OpenRouter арқылы <span className="footer-dot">·</span> ChatGPT · DeepSeek · Claude · Grok
        </span>
      </footer>
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className="toast">
            <Check size={16} />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
