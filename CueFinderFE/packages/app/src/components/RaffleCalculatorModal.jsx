import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as raffleService from '../api/raffleService';

// ── Discount formula ──────────────────────────────────────────────────────────
function discountPct(n) { return Math.min((n - 1) * 5, 25); }
function priceForNSpots(basePrice, n) { return n * basePrice * (1 - discountPct(n) / 100); }

const PAYMENT_METHODS = [
  { key: 'acceptPayPal',       label: 'PayPal' },
  { key: 'acceptRevolut',      label: 'Revolut' },
  { key: 'acceptBankTransfer', label: 'Bank Transfer / SEPA' },
  { key: 'acceptViva',         label: 'Viva Wallet' },
  { key: 'acceptIris',         label: 'IRIS Pay' },
  { key: 'acceptDM',           label: 'Arrange via DM' },
];

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2].map(n => (
        <React.Fragment key={n}>
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
            step === n ? 'bg-primary text-white' : step > n ? 'bg-primary/40 text-white' : 'bg-white/10 text-gray-500'
          }`}>{n}</div>
          {n < 2 && <div className={`h-px w-6 transition-colors ${step > 1 ? 'bg-primary/40' : 'bg-white/10'}`} />}
        </React.Fragment>
      ))}
      <span className="text-gray-500 text-xs ml-1">Step {step} of 2</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Calculator
// ─────────────────────────────────────────────────────────────────────────────
function CalculatorStep({ item, itemImageUrl, onNext, onClose }) {
  const [itemValue, setItemValue] = useState(item?.price ?? 100);
  const [spots, setSpots] = useState(20);

  const basePrice = spots > 0 ? itemValue / spots : 0;

  const tableRows = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map(n => ({
      n,
      pctOff: discountPct(n),
      priceEach: basePrice * (1 - discountPct(n) / 100),
      total: priceForNSpots(basePrice, n),
      savings: n * basePrice - priceForNSpots(basePrice, n),
    }));
  }, [basePrice]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-white/10">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">🎰 Raffle Calculator</h2>
          <StepIndicator step={1} />
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition text-xl leading-none mt-0.5">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Item preview */}
        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/10">
          {itemImageUrl ? (
            <img src={itemImageUrl} alt={item?.title} className="w-14 h-14 object-cover rounded-lg shrink-0" />
          ) : (
            <div className="w-14 h-14 bg-black/30 rounded-lg flex items-center justify-center shrink-0 text-2xl opacity-40">🎱</div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{item?.title || 'Your item'}</p>
            <p className="text-gray-400 text-xs">{item?.brand || ''}</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Item Value (€)</label>
            <input
              type="number" min={1} step={0.01} value={itemValue}
              onChange={e => setItemValue(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary focus:bg-black/40 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Number of Spots</label>
            <input
              type="number" min={2} max={500} value={spots}
              onChange={e => setSpots(Math.max(2, Math.min(500, parseInt(e.target.value) || 2)))}
              className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary focus:bg-black/40 transition"
            />
          </div>
        </div>

        {/* Slider */}
        <div>
          <input
            type="range" min={2} max={200} value={spots}
            onChange={e => setSpots(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2</span><span>100</span><span>200</span>
          </div>
        </div>

        {/* Key number callout */}
        <div className="bg-primary/15 border border-primary/30 rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Base price per spot</p>
          <p className="text-4xl font-extrabold text-white">€{basePrice.toFixed(2)}</p>
          <p className="text-gray-400 text-xs mt-1">{spots} spots · total pot €{itemValue.toFixed(2)}</p>
        </div>

        {/* Multi-spot discount table */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold text-sm">Multi-Spot Discount Table</p>
            <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 rounded-full px-2 py-0.5">auto-applied</span>
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Buyers who claim multiple spots get a tiered discount — rewarding commitment and filling your raffle faster.
          </p>
          <div className="rounded-xl overflow-hidden border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-400">
                  <th className="text-left px-3 py-2">Spots</th>
                  <th className="text-right px-3 py-2">Discount</th>
                  <th className="text-right px-3 py-2">Per spot</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-right px-3 py-2">Save</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ n, pctOff, priceEach, total, savings }) => {
                  const isBest = n === 6;
                  return (
                    <tr key={n} className={`border-t border-white/5 ${isBest ? 'bg-green-500/8' : ''}`}>
                      <td className={`px-3 py-2 font-semibold ${isBest ? 'text-green-300' : 'text-gray-200'}`}>
                        {n === 6 ? '6+' : n}
                        {n === 1 && <span className="text-gray-500 font-normal ml-1 text-xs">(base)</span>}
                        {isBest && <span className="ml-1.5 text-xs bg-green-500/20 text-green-400 rounded px-1 py-0.5">best deal</span>}
                      </td>
                      <td className="text-right px-3 py-2">
                        {pctOff > 0
                          ? <span className="text-green-400 font-semibold">−{pctOff}%</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className={`text-right px-3 py-2 ${isBest ? 'text-green-300' : 'text-gray-300'}`}>€{priceEach.toFixed(2)}</td>
                      <td className={`text-right px-3 py-2 font-semibold ${isBest ? 'text-green-300' : 'text-white'}`}>€{total.toFixed(2)}</td>
                      <td className="text-right px-3 py-2 text-green-400 font-medium">
                        {savings > 0 ? `€${savings.toFixed(2)}` : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            * Multi-spot discounts are handled off-platform. The system tracks one entry per spot.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-white/10">
        <button
          onClick={() => onNext({ itemValue, spots, basePrice })}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold transition text-base"
        >
          Continue to Raffle Setup →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Setup Form
// ─────────────────────────────────────────────────────────────────────────────
function SetupStep({ item, itemImageUrl, calcData, onBack, onClose }) {
  const navigate = useNavigate();
  const { itemValue, spots, basePrice } = calcData;

  const defaultEndsAt = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  })();

  // Only pass itemImageUrl to the API if it's a real server URL, not a local blob/data preview
  const serverImageUrl = itemImageUrl && !itemImageUrl.startsWith('data:') && !itemImageUrl.startsWith('blob:')
    ? itemImageUrl : '';

  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    itemImageUrl: serverImageUrl,
    totalSpots: spots,
    pricePerSpot: parseFloat(basePrice.toFixed(2)),
    endsAt: defaultEndsAt,
    acceptPayPal: false,
    acceptRevolut: false,
    acceptBankTransfer: false,
    acceptViva: false,
    acceptIris: false,
    acceptDM: true,
    paymentDetails: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  const totalPot = (form.totalSpots * form.pricePerSpot).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!PAYMENT_METHODS.some(m => form[m.key])) { setError('Select at least one payment method.'); return; }
    if (new Date(form.endsAt) <= new Date()) { setError('End date must be in the future.'); return; }
    try {
      setLoading(true);
      const created = await raffleService.createRaffle({
        ...form,
        totalSpots: Number(form.totalSpots),
        pricePerSpot: Number(form.pricePerSpot),
        endsAt: new Date(form.endsAt).toISOString(),
      });
      onClose();
      navigate(`/raffles/${created.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create raffle.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition text-sm">← Back</button>
            <h2 className="text-lg font-bold text-white">🎰 Raffle Setup</h2>
          </div>
          <StepIndicator step={2} />
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition text-xl leading-none mt-0.5">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Summary from calculator */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Spots', value: form.totalSpots },
            { label: 'Price / spot', value: `€${Number(form.pricePerSpot).toFixed(2)}` },
            { label: 'Total pot', value: `€${totalPot}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-primary/15 border border-primary/25 rounded-xl p-3">
              <p className="text-primary font-bold text-base">{value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Title *</label>
          <input required maxLength={200} value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Description</label>
          <textarea maxLength={2000} rows={2} value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Spots</label>
            <input type="number" min={2} max={500} required value={form.totalSpots}
              onChange={e => set('totalSpots', e.target.value)}
              className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Price / spot (€)</label>
            <input type="number" min={0.01} step={0.01} required value={form.pricePerSpot}
              onChange={e => set('pricePerSpot', e.target.value)}
              className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Raffle Ends At *</label>
          <input type="datetime-local" required value={form.endsAt} onChange={e => set('endsAt', e.target.value)}
            className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-2">Accepted Payment Methods *</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ key, label }) => (
              <label key={key} className={`flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 border transition ${
                form[key] ? 'border-primary/50 bg-primary/10 text-white' : 'border-white/10 bg-black/20 text-gray-400'
              }`}>
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} className="accent-primary" />
                <span className="text-xs">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Payment Details <span className="text-gray-500 font-normal">(shown to entrants)</span></label>
          <textarea maxLength={500} rows={2} value={form.paymentDetails} onChange={e => set('paymentDetails', e.target.value)}
            placeholder="e.g. PayPal: seller@email.com | Revolut: @handle | IBAN: GR…"
            className="w-full bg-black/30 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition resize-none placeholder-gray-600" />
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      </form>

      <div className="p-5 border-t border-white/10">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold transition text-base disabled:opacity-50"
        >
          {loading ? 'Creating Raffle…' : '🎰 Create Raffle'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — modal shell
// ─────────────────────────────────────────────────────────────────────────────
export default function RaffleCalculatorModal({ item, itemImageUrl, onClose }) {
  const [step, setStep] = useState(1);
  const [calcData, setCalcData] = useState(null);

  function handleNext(data) { setCalcData(data); setStep(2); }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-surface-1 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col shadow-2xl">
        {step === 1 && <CalculatorStep item={item} itemImageUrl={itemImageUrl} onNext={handleNext} onClose={onClose} />}
        {step === 2 && calcData && <SetupStep item={item} itemImageUrl={itemImageUrl} calcData={calcData} onBack={() => setStep(1)} onClose={onClose} />}
      </div>
    </div>
  );
}
