import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as raffleService from '../api/raffleService';
import { SITE_BASE_URL } from '../config/apiConfig';

const PAYMENT_METHODS = [
  { key: 'acceptPayPal',       label: 'PayPal',               icon: '💳' },
  { key: 'acceptRevolut',      label: 'Revolut',              icon: '🔄' },
  { key: 'acceptBankTransfer', label: 'Bank Transfer / SEPA', icon: '🏦' },
  { key: 'acceptViva',         label: 'Viva Wallet',          icon: '💜' },
  { key: 'acceptIris',         label: 'IRIS Pay',             icon: '🌐' },
  { key: 'acceptDM',           label: 'Arrange via DM',       icon: '💬' },
];

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return url;
}

export default function RaffleEditForm({ onBack }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingRaffle, setLoadingRaffle] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    itemImageUrl: '',
    totalSpots: 50,
    pricePerSpot: 10,
    endsAt: '',
    autoEndWhenFull: false,
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

  useEffect(() => {
    async function loadRaffle() {
      try {
        setLoadingRaffle(true);
        const raffle = await raffleService.getRaffleById(id);
        
        // Convert date to datetime-local format
        const endsAtDate = new Date(raffle.endsAt);
        const localDateTime = new Date(endsAtDate.getTime() - endsAtDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        
        setForm({
          title: raffle.title || '',
          description: raffle.description || '',
          itemImageUrl: raffle.itemImageUrl || '',
          totalSpots: raffle.totalSpots,
          pricePerSpot: raffle.pricePerSpot,
          endsAt: localDateTime,
          autoEndWhenFull: raffle.autoEndWhenFull || false,
          acceptPayPal: raffle.acceptPayPal || false,
          acceptRevolut: raffle.acceptRevolut || false,
          acceptBankTransfer: raffle.acceptBankTransfer || false,
          acceptViva: raffle.acceptViva || false,
          acceptIris: raffle.acceptIris || false,
          acceptDM: raffle.acceptDM || false,
          paymentDetails: raffle.paymentDetails || '',
        });
        
        // Set existing image preview
        if (raffle.itemImageUrl) {
          setImagePreview(getImageUrl(raffle.itemImageUrl));
        }
      } catch (err) {
        setError('Failed to load raffle. ' + (err?.response?.data?.message || ''));
      } finally {
        setLoadingRaffle(false);
      }
    }
    
    loadRaffle();
  }, [id]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setForm(f => ({ ...f, itemImageUrl: '' }));
    if (fileRef.current) fileRef.current.value = '';
  }

  const totalPot = (Number(form.totalSpots) * Number(form.pricePerSpot)).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!imagePreview && !imageFile) {
      setError('📸 Please upload an image for your raffle item.');
      return;
    }
    if (!PAYMENT_METHODS.some(m => form[m.key])) {
      setError('Please select at least one payment method.');
      return;
    }
    if (!form.endsAt) {
      setError('Please set an end date.');
      return;
    }
    if (new Date(form.endsAt) <= new Date()) {
      setError('End date must be in the future.');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = form.itemImageUrl;
      
      // Upload new image if changed
      if (imageFile) {
        setUploading(true);
        const uploadResult = await raffleService.uploadRaffleImage(imageFile);
        setUploading(false);

        if (!uploadResult?.success || !uploadResult?.imageUrl) {
          setError(uploadResult?.errorMessage || 'Image upload failed. Please try again.');
          setLoading(false);
          return;
        }
        imageUrl = uploadResult.imageUrl;
      }

      const updated = await raffleService.updateRaffle(id, {
        ...form,
        itemImageUrl: imageUrl,
        totalSpots: Number(form.totalSpots),
        pricePerSpot: Number(form.pricePerSpot),
        endsAt: new Date(form.endsAt).toISOString(),
        autoEndWhenFull: form.autoEndWhenFull,
      });
      navigate(`/raffles/${updated.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update raffle.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  if (loadingRaffle) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="text-center text-gray-500">Loading raffle...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack || (() => navigate(`/raffles/${id}`))}
          className="text-gray-400 hover:text-white transition text-sm"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">✏️ Edit Raffle</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update your raffle details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Image upload ───────────────────────────── */}
        <div className="bg-surface-2 border border-white/10 rounded-xl p-4">
          <label className="block text-sm font-medium text-white mb-3">
            Item Photo <span className="text-red-400">*</span>
          </label>

          {!imagePreview ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-xl h-44 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition group"
            >
              <span className="text-4xl opacity-40 group-hover:opacity-60 transition">📷</span>
              <p className="text-gray-400 text-sm">Click or drag &amp; drop an image</p>
              <p className="text-gray-600 text-xs">JPG, PNG, WEBP · max 10 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Basic info ────────────────────────────────────────── */}
        <div className="bg-surface-2 border border-white/10 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Item Details</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Meucci Original 97-3 Custom Cue"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              maxLength={2000}
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the item, condition, what's included, shipping details…"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition resize-none placeholder-gray-600"
            />
          </div>
        </div>

        {/* ── Spots & pricing ──────────────────────────────────── */}
        <div className="bg-surface-2 border border-white/10 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Spots &amp; Pricing</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Total Spots <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={2}
                max={1000}
                value={form.totalSpots}
                onChange={e => set('totalSpots', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Price / Spot (€) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={0.01}
                step={0.01}
                value={form.pricePerSpot}
                onChange={e => set('pricePerSpot', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-lg px-4 py-3">
            <span className="text-gray-400 text-sm">Total pot</span>
            <span className="text-primary font-bold text-xl">€{totalPot}</span>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Raffle Ends At <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={form.endsAt}
              onChange={e => set('endsAt', e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition"
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.autoEndWhenFull}
              onChange={e => set('autoEndWhenFull', e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm text-gray-300">
              Auto-close raffle when all spots are filled
            </span>
          </label>
        </div>

        {/* ── Payment ──────────────────────────────────────────── */}
        <div className="bg-surface-2 border border-white/10 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Payment Methods <span className="text-red-400">*</span>
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ key, label, icon }) => (
              <label
                key={key}
                className={`flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2.5 border transition select-none ${
                  form[key]
                    ? 'border-primary/60 bg-primary/15 text-white'
                    : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={e => set(key, e.target.checked)}
                  className="accent-primary shrink-0"
                />
                <span className="text-base leading-none">{icon}</span>
                <span className="text-xs">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Payment Details <span className="text-gray-600 font-normal">(shown to entrants)</span>
            </label>
            <textarea
              maxLength={500}
              rows={2}
              value={form.paymentDetails}
              onChange={e => set('paymentDetails', e.target.value)}
              placeholder="e.g. PayPal: seller@email.com | Revolut: @handle | IBAN: GR…"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition resize-none placeholder-gray-600"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold transition disabled:opacity-50 text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {uploading ? 'Uploading image…' : 'Updating raffle…'}
            </>
          ) : (
            '✏️ Update Raffle'
          )}
        </button>
      </form>
    </div>
  );
}
