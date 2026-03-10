import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as raffleService from '../api/raffleService';
import * as messageService from '../api/messageService';
import { useAuth } from '../auth/AuthContext';
import { SITE_BASE_URL } from '../config/apiConfig';
import SpotGrid from './SpotGrid';
import SpinWheel from './SpinWheel';
import VerifiedBadge from './VerifiedBadge';

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return url;
}

const PAYMENT_LABELS = {
  acceptPayPal:       'PayPal',
  acceptRevolut:      'Revolut',
  acceptBankTransfer: 'Bank Transfer / SEPA',
  acceptViva:         'Viva Wallet',
  acceptIris:         'IRIS Pay',
  acceptDM:           'DM Seller',
};

// Options a buyer sees when claiming a spot
const PAYMENT_OPTIONS = [
  { flag: 'acceptPayPal',       value: 'paypal',        label: 'PayPal' },
  { flag: 'acceptRevolut',      value: 'revolut',       label: 'Revolut' },
  { flag: 'acceptBankTransfer', value: 'bankTransfer',  label: 'Bank Transfer / SEPA' },
  { flag: 'acceptViva',         value: 'viva',          label: 'Viva Wallet' },
  { flag: 'acceptIris',         value: 'iris',          label: 'IRIS Pay' },
  { flag: 'acceptDM',           value: 'dm',            label: 'Arrange via DM' },
];

const METHOD_LABEL = Object.fromEntries(PAYMENT_OPTIONS.map(m => [m.value, m.label]));

function formatTimeLeft(expiresAt) {
  const ms = new Date(expiresAt) - new Date();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function RaffleDetail({ onBack }) {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [raffle, setRaffle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [entering, setEntering] = useState(false);
  const [enterError, setEnterError] = useState('');
  const [enterSuccess, setEnterSuccess] = useState('');

  const [drawing, setDrawing] = useState(false);
  const [showWheel, setShowWheel] = useState(false);

  const [verifyEntryId, setVerifyEntryId] = useState(null);
  const [verifyPayment, setVerifyPayment] = useState('');
  const [verifyRef, setVerifyRef] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [showMsgBox, setShowMsgBox] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await raffleService.getRaffleById(id);
      setRaffle(data);
    } catch {
      setError('Failed to load raffle.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isOrganizer = user && raffle && user.id === raffle.organizerId;
  const isOpen      = raffle?.status === 'open';
  const isDrawn     = raffle?.status === 'drawn';

  async function handleEnter() {
    if (!selectedSpot || !selectedMethod) return;
    setEnterError('');
    setEnterSuccess('');
    try {
      setEntering(true);
      await raffleService.enterRaffle(raffle.id, selectedSpot, selectedMethod);
      setEnterSuccess(t('raffle.claim.success', { n: selectedSpot }));
      setSelectedSpot(null);
      setSelectedMethod('');
      await load();
    } catch (err) {
      setEnterError(err?.response?.data?.message || 'Failed to claim spot.');
    } finally {
      setEntering(false);
    }
  }

  async function handleDraw() {
    if (!window.confirm(t('raffle.detail.drawConfirm'))) return;
    try {
      setDrawing(true);
      const updated = await raffleService.drawWinner(raffle.id);
      setRaffle(updated);
      setShowWheel(true);

      // Winner is notified server-side via system message
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to draw winner.');
    } finally {
      setDrawing(false);
    }
  }

  async function handleVerify(entryId) {
    try {
      setVerifying(true);
      await raffleService.verifyEntry(raffle.id, entryId, verifyPayment, verifyRef);
      setVerifyEntryId(null);
      setVerifyPayment('');
      setVerifyRef('');
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to verify entry.');
    } finally {
      setVerifying(false);
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  async function handleSendMsg(e) {
    e.preventDefault();
    if (!msgText.trim()) return;
    setMsgError('');
    try {
      setMsgSending(true);
      await messageService.sendMessage({
        recipientId: raffle.organizerId,
        cueId: null,
        subject: `Question about raffle: ${raffle.title}`,
        content: msgText.trim(),
        messageType: 'message',
      });
      setMsgSent(true);
      setMsgText('');
    } catch (err) {
      setMsgError(err?.response?.data?.message || 'Failed to send message.');
    } finally {
      setMsgSending(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;
  if (error)   return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!raffle) return null;

  const pct = raffle.totalSpots > 0
    ? Math.round((raffle.totalClaimed / raffle.totalSpots) * 100)
    : 0;

  const acceptedMethods = Object.entries(PAYMENT_LABELS)
    .filter(([key]) => raffle[key])
    .map(([, label]) => label);

  const myEntries = user
    ? (raffle.entries || []).filter(e => e.userId === user.id)
    : [];

  const pendingEntries = isOrganizer
    ? (raffle.entries || []).filter(e => e.status === 'pending')
    : [];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Back */}
      <button
        onClick={onBack || (() => navigate('/raffles'))}
        className="text-gray-400 hover:text-white transition text-sm mb-4 block"
      >
        {t('raffle.allRaffles')}
      </button>

      {/* Winner banner */}
      {isDrawn && raffle.winnerUsername && (
        <div className="mb-5 rounded-xl bg-yellow-500/10 border border-yellow-500/40 overflow-hidden">
          {getImageUrl(raffle.winnerCardImageUrl) ? (
            <img
              src={getImageUrl(raffle.winnerCardImageUrl)}
              alt="Winner card"
              className="w-full max-h-64 object-contain bg-[#0f172a]"
            />
          ) : (
            <div className="p-4 text-center">
              <p className="text-yellow-300 text-lg font-bold">{t('raffle.detail.winnerLabel')} {raffle.winnerName || raffle.winnerUsername}</p>
              {raffle.winnerSpotNumber && (
                <p className="text-yellow-400/70 text-sm">{t('raffle.detail.spotNumber', { n: raffle.winnerSpotNumber })}</p>
              )}
            </div>
          )}
          {getImageUrl(raffle.winnerCardImageUrl) && (
            <div className="px-4 py-2 text-center border-t border-yellow-500/20">
              <p className="text-yellow-300 font-bold">{t('raffle.detail.winnerLabel')} {raffle.winnerName || raffle.winnerUsername}</p>
              {raffle.winnerSpotNumber && (
                <p className="text-yellow-400/70 text-xs">{t('raffle.detail.spotNumber', { n: raffle.winnerSpotNumber })}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — image + info */}
        <div>
          {getImageUrl(raffle.itemImageUrl) ? (
            <img
              src={getImageUrl(raffle.itemImageUrl)}
              alt={raffle.title}
              className="w-full rounded-xl object-cover max-h-72 mb-4"
            />
          ) : (
            <div className="w-full rounded-xl bg-black/30 flex items-center justify-center h-48 mb-4">
              <span className="text-6xl opacity-20">🎱</span>
            </div>
          )}

          <h1 className="text-xl font-bold text-white mb-1">{raffle.title}</h1>
          <div className="flex items-center justify-between mb-3">
            <Link
              to={`/sellers/${raffle.organizerId}`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
            >
              <span>by {raffle.organizerName || `@${raffle.organizerUsername}`}</span>
              <VerifiedBadge isVerified={raffle.organizerIsVerified} />
            </Link>
            {user && !isOrganizer && (
              <button
                onClick={() => { setShowMsgBox(v => !v); setMsgSent(false); setMsgError(''); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition"
              >
                {t('raffle.detail.messageSeller')}
              </button>
            )}
          </div>

          {/* Message compose box */}
          {user && !isOrganizer && showMsgBox && (
            <div className="mb-4 p-3 bg-surface-2 border border-white/10 rounded-xl">
              {msgSent ? (
                <div className="flex items-center justify-between">
                  <p className="text-green-400 text-sm">{t('raffle.detail.msgSent')}</p>
                  <button
                    onClick={() => { setMsgSent(false); setShowMsgBox(false); }}
                    className="text-gray-500 text-xs hover:text-white transition"
                  >
                    {t('common.close')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMsg} className="space-y-2">
                  <label className="block text-xs text-gray-400">{t('inbox.sendMessage')} — {raffle.organizerName || raffle.organizerUsername}</label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder={t('raffle.detail.messagePlaceholder')}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition resize-none placeholder-gray-600"
                  />
                  {msgError && <p className="text-red-400 text-xs">{msgError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={msgSending || !msgText.trim()}
                      className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-semibold transition disabled:opacity-50"
                    >
                      {msgSending ? t('common.sending') : t('common.send')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMsgBox(false)}
                      className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {raffle.description && (
            <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">{raffle.description}</p>
          )}

          {/* Stats */}
          <div className="bg-surface-2 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{t('raffle.detail.pricePerSpot')}</span>
              <span className="text-primary font-bold">€{raffle.pricePerSpot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('raffle.detail.totalSpots')}</span>
              <span className="text-white">{raffle.totalSpots}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('raffle.detail.claimed')}</span>
              <span className="text-white">{raffle.totalClaimed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('raffle.detail.paid')}</span>
              <span className="text-green-400">{raffle.totalPaid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('raffle.detail.available')}</span>
              <span className="text-teal-400">{raffle.spotsAvailable}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 mt-1">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('raffle.detail.ends')}</span>
              <span className="text-white">{new Date(raffle.endsAt).toLocaleDateString('el-GR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('raffle.detail.status')}</span>
              <span className={`font-semibold ${
                isOpen ? 'text-green-400' :
                isDrawn ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {raffle.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Payment methods */}
          {acceptedMethods.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">{t('raffle.detail.acceptedPayments')}</p>
              <div className="flex flex-wrap gap-2">
                {acceptedMethods.map(m => (
                  <span key={m} className="text-xs px-2 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full">
                    {m}
                  </span>
                ))}
              </div>
              {raffle.paymentDetails && (
                <div className="mt-2 p-3 bg-surface-2 border border-white/10 rounded-lg flex items-start justify-between gap-2">
                  <p className="text-gray-300 text-xs break-all">{raffle.paymentDetails}</p>
                  <button
                    onClick={() => copyText(raffle.paymentDetails)}
                    className="text-primary text-xs shrink-0 hover:underline"
                  >
                    {t('raffle.detail.copy')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Organizer draw button */}
          {isOrganizer && isOpen && raffle.totalPaid > 0 && (
            <button
              onClick={handleDraw}
              disabled={drawing}
              className="mt-4 w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition disabled:opacity-50"
            >
              {drawing ? t('raffle.detail.drawing') : t('raffle.detail.drawNow')}
            </button>
          )}

          {isOrganizer && isOpen && raffle.totalPaid === 0 && (
            <p className="mt-3 text-gray-500 text-sm text-center">{t('raffle.detail.verifyFirst')}</p>
          )}
        </div>

        {/* Right — spot grid + entry */}
        <div>
          <h2 className="text-white font-semibold mb-3">{t('raffle.detail.spotGrid')}</h2>

          <SpotGrid
            raffle={raffle}
            currentUserId={user?.id}
            onSelectSpot={isOpen && user && !isOrganizer ? setSelectedSpot : null}
            selectedSpot={selectedSpot}
          />

          {/* Entry panel */}
          {isOpen && user && !isOrganizer && (
            <div className="mt-4 p-4 bg-surface-2 border border-white/10 rounded-xl">
              {selectedSpot ? (() => {
                const availableMethods = PAYMENT_OPTIONS.filter(m => raffle[m.flag]);
                return (
                  <>
                    <p className="text-white font-semibold mb-1">{t('raffle.detail.claimSpot', { n: selectedSpot })}</p>
                    <p className="text-gray-400 text-xs mb-3">
                      {t('raffle.detail.cost')} <span className="text-primary font-semibold">€{raffle.pricePerSpot}</span> · {t('raffle.detail.timeLimit')}
                    </p>
                    <p className="text-xs text-gray-300 mb-2 font-medium">{t('raffle.detail.howToPay')}</p>
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {availableMethods.map(m => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setSelectedMethod(m.value)}
                          className={`text-xs px-2 py-2 rounded-lg border transition text-left ${
                            selectedMethod === m.value
                              ? 'border-primary bg-primary/20 text-white font-semibold'
                              : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {selectedMethod === 'dm' && (
                      <div className="mb-3 p-2.5 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-300">{t('raffle.detail.dmNote')}</p>
                        <button
                          type="button"
                          onClick={() => { setShowMsgBox(true); setMsgSent(false); setMsgError(''); }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/80 text-white font-semibold transition shrink-0"
                        >
                          {t('raffle.detail.messageSeller')}
                        </button>
                      </div>
                    )}
                    {enterError && <p className="text-red-400 text-xs mb-2">{enterError}</p>}
                    {enterSuccess && <p className="text-green-400 text-xs mb-2">{enterSuccess}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handleEnter}
                        disabled={entering || !selectedMethod}
                        className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white font-semibold text-sm transition disabled:opacity-50"
                      >
                        {entering ? t('raffle.detail.claiming') : t('raffle.detail.claimSpot', { n: selectedSpot })}
                      </button>
                      <button
                        onClick={() => { setSelectedSpot(null); setSelectedMethod(''); }}
                        className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition text-sm"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </>
                );
              })() : (
                <p className="text-gray-400 text-sm text-center">{t('raffle.detail.clickToEnter')}</p>
              )}
            </div>
          )}

          {!user && isOpen && (
            <div className="mt-4 p-4 bg-surface-2 border border-white/10 rounded-xl text-center">
              <p className="text-gray-400 text-sm mb-2">{t('raffle.detail.loginToEnter')}</p>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-semibold transition"
              >
                {t('common.login')}
              </button>
            </div>
          )}

          {/* My entries (non-organizer) */}
          {myEntries.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">{t('raffle.detail.yourSpots')}</p>
              <div className="space-y-2">
                {myEntries.map(e => (
                  <div key={e.id} className="p-3 bg-surface-2 border border-white/10 rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{t('raffle.detail.spotNumber', { n: e.spotNumber })}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {e.status === 'paid' ? t('raffle.detail.statusPaid') : t('raffle.detail.statusPendingPayment')}
                      </span>
                    </div>
                    {e.paymentMethod && (
                      <p className="text-gray-500 text-xs mt-1">{t('raffle.detail.via')} {METHOD_LABEL[e.paymentMethod] || e.paymentMethod}</p>
                    )}
                    {e.status === 'pending' && e.pendingExpiresAt && (
                      <p className="text-orange-400 text-xs mt-0.5">⏱ {formatTimeLeft(e.pendingExpiresAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entrants list — visible to all */}
          {raffle.entries?.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-gray-400 mb-2">
                {t('raffle.detail.entrants', { count: raffle.entries.length })}
              </p>
              <div className="bg-surface-2 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-3 py-2">{t('raffle.detail.colSpot')}</th>
                      <th className="text-left px-3 py-2">{t('raffle.detail.colUser')}</th>
                      <th className="text-right px-3 py-2">{t('raffle.detail.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffle.entries.map(e => (
                      <tr key={e.id} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-2 text-white font-semibold">#{e.spotNumber}</td>
                        <td className="px-3 py-2 text-gray-300">
                          {e.name || e.username}
                          {raffle.winnerId && e.userId === raffle.winnerId && (
                            <span className="ml-1 text-yellow-400">🏆</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            e.status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {e.status === 'paid' ? t('raffle.detail.statusPaid') : t('raffle.detail.statusPending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Organizer: verify pending entries */}
          {isOrganizer && pendingEntries.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">{t('raffle.detail.pendingEntries')}</p>
              <div className="space-y-2">
                {pendingEntries.map(e => (
                  <div key={e.id} className="p-3 bg-surface-2 border border-white/10 rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-white">Spot #{e.spotNumber} — {e.name || e.username}</span>
                        {e.paymentMethod && (
                          <span className="ml-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                            {METHOD_LABEL[e.paymentMethod] || e.paymentMethod}
                          </span>
                        )}
                        {e.pendingExpiresAt && (
                          <span className="ml-1 text-xs text-orange-400">· {formatTimeLeft(e.pendingExpiresAt)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => setVerifyEntryId(verifyEntryId === e.id ? null : e.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {verifyEntryId === e.id ? t('common.cancel') : t('raffle.detail.markPaid')}
                      </button>
                    </div>
                    {verifyEntryId === e.id && (
                      <div className="mt-2 space-y-2">
                        <input
                          placeholder={t('raffle.detail.paymentMethodPlaceholder')}
                          value={verifyPayment}
                          onChange={ev => setVerifyPayment(ev.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-xs"
                        />
                        <input
                          placeholder={t('raffle.detail.paymentRefPlaceholder')}
                          value={verifyRef}
                          onChange={ev => setVerifyRef(ev.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-xs"
                        />
                        <button
                          onClick={() => handleVerify(e.id)}
                          disabled={verifying}
                          className="w-full py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition disabled:opacity-50"
                        >
                          {verifying ? t('common.saving') : t('raffle.detail.confirmPayment')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spin Wheel modal */}
      {showWheel && (
        <SpinWheel
          raffle={raffle}
          onClose={() => setShowWheel(false)}
          onWinnerCardSaved={updated => setRaffle(updated)}
        />
      )}
    </div>
  );
}
