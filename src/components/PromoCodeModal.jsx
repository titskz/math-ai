import { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, AlertCircle, Clock, Ban } from 'lucide-react';
import { PROMO_ERRORS, validatePromoCodeAsync } from '../data/promoCodes';

const LENGTH = 5;
const CHAR_RE = /[A-Z0-9]/;

const ERROR_ICONS = {
  invalid: AlertCircle,
  expired: Clock,
  used: Ban,
};

export default function PromoCodeModal({ onSuccess }) {
  const [digits, setDigits] = useState(() => Array(LENGTH).fill(''));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputs = useRef([]);

  const code = digits.join('');
  const complete = code.length === LENGTH && digits.every(Boolean);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function clearError() {
    if (error) setError(null);
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function setChar(index, value) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    clearError();
    if (char && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LENGTH);
    if (!pasted) return;
    const next = Array(LENGTH).fill('');
    pasted.split('').forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    clearError();
    const focusIndex = Math.min(pasted.length, LENGTH - 1);
    inputs.current[focusIndex]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      clearError();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleChange(index, e) {
    const val = e.target.value;
    if (val.length > 1) {
      handlePaste({ preventDefault: () => {}, clipboardData: { getData: () => val } });
      return;
    }
    if (!val || CHAR_RE.test(val)) setChar(index, val);
  }

  async function submit(e) {
    e?.preventDefault();
    if (!complete || loading) return;

    setLoading(true);
    setError(null);

    const result = await validatePromoCodeAsync(code);
    setLoading(false);

    if (result.ok) {
      onSuccess(result.session);
      return;
    }

    setError(result.reason);
    triggerShake();
    inputs.current[0]?.focus();
    inputs.current[0]?.select();
  }

  const ErrorIcon = error ? ERROR_ICONS[error] : null;
  const errorInfo = error ? PROMO_ERRORS[error] : null;

  return (
    <div className="promo-overlay" role="presentation">
      <div className={`promo-modal ${shake ? 'shake' : ''}`} role="dialog" aria-modal="true" aria-labelledby="promo-title">
        <div className="promo-modal-header">
          <div className="promo-title-wrap">
            <span className="promo-icon" aria-hidden="true">
              <KeyRound size={18} />
            </span>
            <h2 id="promo-title">Промокод</h2>
          </div>
        </div>

        <p className="promo-lead">5 таңбалы промокодты енгізіңіз — есептерді шешуге қол жеткізіңіз</p>

        <form onSubmit={submit}>
          <div className={`promo-cells ${error ? 'has-error' : ''}`} onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                className="promo-cell"
                type="text"
                inputMode="text"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={1}
                value={digit}
                aria-label={`Промокод ${i + 1}-ші әріп`}
                disabled={loading}
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          <p className="promo-hint">Сандар және лatin бас әріптері (A–Z, 0–9)</p>

          {errorInfo && (
            <div className={`promo-error promo-error-${error}`} role="alert">
              {ErrorIcon && <ErrorIcon size={16} />}
              <div>
                <strong>{errorInfo.title}</strong>
                <span>{errorInfo.hint}</span>
              </div>
            </div>
          )}

          <button type="submit" className="promo-submit" disabled={!complete || loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Тексерілуде...
              </>
            ) : (
              'Бастау'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
