import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as raffleService from '../api/raffleService';

/**
 * SpinWheel modal.
 * Shows an animated spinning slots / ticker effect, then reveals the winner.
 *
 * Props:
 *   raffle           – RaffleResponseDto (must be status "drawn" with winnerId set)
 *   onClose          – callback to close the modal
 *   onWinnerCardSaved – optional callback(updatedRaffle) after winner card is persisted
 */
export default function SpinWheel({ raffle, onClose, onWinnerCardSaved }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState('ready'); // ready | spinning | revealing | done
  const [displayName, setDisplayName] = useState('???');
  const intervalRef = useRef(null);

  // Recording
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);

  const paidEntries = (raffle.entries || []).filter(e => e.status === 'paid');

  // ── Spin animation ──────────────────────────────────────────────────────────
  const startSpin = useCallback(() => {
    setPhase('spinning');

    if (paidEntries.length === 0) {
      setDisplayName(raffle.winnerUsername || `User #${raffle.winnerId}` || '???');
      setPhase('done');
      return;
    }

    let tick = 0;
    intervalRef.current = setInterval(() => {
      const rnd = paidEntries[Math.floor(Math.random() * paidEntries.length)];
      setDisplayName(rnd.username);
      tick++;
      if (tick > 40) {
        clearInterval(intervalRef.current);
        let slowTick = 0;
        const slow = setInterval(() => {
          const rnd2 = paidEntries[Math.floor(Math.random() * paidEntries.length)];
          setDisplayName(rnd2.username);
          slowTick++;
          if (slowTick > 8) {
            clearInterval(slow);
            setPhase('revealing');
            setTimeout(() => {
              setDisplayName(raffle.winnerUsername || `User #${raffle.winnerId}`);
              setPhase('done');
            }, 600);
          }
        }, 200);
      }
    }, 60);
  }, [paidEntries, raffle.winnerUsername, raffle.winnerId]);

  // Stop recording 1.5 s after winner is revealed
  useEffect(() => {
    if (phase === 'done' && recording && mediaRecorderRef.current?.state === 'recording') {
      const t = setTimeout(() => {
        mediaRecorderRef.current.stop();
        setRecording(false);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase, recording]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  // ── Screen recording ────────────────────────────────────────────────────────
  async function startRecordingAndSpin() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);

      // Brief pause so the recording is actually capturing before spin starts
      setTimeout(startSpin, 400);
    } catch {
      // User cancelled the screen-picker — just spin without recording
      startSpin();
    }
  }

  // ── Winner card (canvas PNG) ────────────────────────────────────────────────
  function buildWinnerCanvas() {
    const W = 600, H = 360;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.textAlign = 'center';

    ctx.font = '56px serif';
    ctx.fillText('🏆', W / 2, 85);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('RAFFLE WINNER', W / 2, 122);

    const winnerName = `@${raffle.winnerUsername || raffle.winnerId}`;
    ctx.font = `bold ${winnerName.length > 20 ? 28 : 38}px monospace`;
    ctx.fillStyle = '#fde68a';
    ctx.fillText(winnerName, W / 2, 185);

    if (raffle.winnerSpotNumber) {
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Spot #${raffle.winnerSpotNumber}`, W / 2, 218);
    }

    const title = raffle.title?.length > 55 ? raffle.title.slice(0, 54) + '…' : (raffle.title || '');
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(title, W / 2, 258);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), W / 2, 290);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('billiardscuefinder.com', W / 2, 330);

    return canvas;
  }

  function downloadWinnerCard() {
    const canvas = buildWinnerCanvas();
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raffle-winner-${raffle.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Auto-upload winner card when spin is done
  useEffect(() => {
    if (phase !== 'done') return;
    const canvas = buildWinnerCanvas();
    canvas.toBlob(async blob => {
      if (!blob) return;
      try {
        const updated = await raffleService.saveWinnerCard(raffle.id, blob);
        if (onWinnerCardSaved) onWinnerCardSaved(updated);
      } catch {
        // Silent — card download still works manually
      }
    }, 'image/png');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-sm text-center p-8 shadow-2xl">
        <div className="text-4xl mb-4">🎰</div>
        <h2 className="text-xl font-bold text-white mb-6">
          {phase === 'ready' ? t('raffle.spin.readyTitle') : t('raffle.spin.drawingTitle')}
        </h2>

        {/* Pre-spin — choose recording option */}
        {phase === 'ready' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm mb-4">
              {t('raffle.spin.readyNote')}
            </p>
            <button
              onClick={startRecordingAndSpin}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center justify-center gap-2"
            >
              {t('raffle.spin.recordAndSpin')}
            </button>
            <button
              onClick={startSpin}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-semibold transition text-sm"
            >
              {t('raffle.spin.spinOnly')}
            </button>
          </div>
        )}

        {/* Slot display — shown during spin and when done */}
        {phase !== 'ready' && (
          <>
            <div className={`rounded-xl border-2 py-6 px-4 mb-6 transition-all duration-500
              ${phase === 'done'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-primary/60 bg-primary/5'}`}
            >
              <p className={`text-2xl font-mono font-bold transition-all duration-300
                ${phase === 'done' ? 'text-yellow-300 scale-110' : 'text-primary animate-pulse'}`}
              >
                {displayName}
              </p>
              {phase === 'done' && raffle.winnerSpotNumber && (
                <p className="text-sm text-gray-400 mt-1">{t('raffle.detail.spotNumber', { n: raffle.winnerSpotNumber })}</p>
              )}
            </div>

            {/* Spinning indicator + recording badge */}
            {phase !== 'done' && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <p className="text-gray-500 text-sm animate-pulse">{t('raffle.spin.spinning')}</p>
                {recording && (
                  <span className="flex items-center gap-1 text-xs text-red-400 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    REC
                  </span>
                )}
              </div>
            )}

            {/* Winner actions */}
            {phase === 'done' && (
              <>
                <p className="text-green-400 font-semibold mb-4">{t('raffle.spin.congratulations')}</p>
                <div className="flex flex-col gap-2 mb-3">
                  <button
                    onClick={downloadWinnerCard}
                    className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition text-sm"
                  >
                    {t('raffle.spin.saveCard')}
                  </button>
                  {recordingUrl && (
                    <a
                      href={recordingUrl}
                      download={`raffle-spin-${raffle.id}.webm`}
                      className="w-full py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold transition text-sm text-center block"
                    >
                      {t('raffle.spin.downloadRecording')}
                    </a>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-lg border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition text-sm"
                >
                  {t('common.close')}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
