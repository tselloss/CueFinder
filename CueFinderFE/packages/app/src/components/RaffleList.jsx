import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as raffleService from '../api/raffleService';
import { useAuth } from '../auth/AuthContext';
import { SITE_BASE_URL } from '../config/apiConfig';

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return url;
}

function RaffleCard({ raffle, onClick }) {
  const { t } = useTranslation();
  const pct = raffle.totalSpots > 0
    ? Math.round((raffle.totalClaimed / raffle.totalSpots) * 100)
    : 0;

  const endsAt = new Date(raffle.endsAt);
  const now    = new Date();
  const diffMs = endsAt - now;
  const diffDays = Math.ceil(diffMs / 86400000);

  function timeLabel() {
    if (raffle.status === 'drawn')     return t('raffle.card.drawn');
    if (raffle.status === 'cancelled') return t('raffle.card.cancelled');
    if (diffMs <= 0)    return t('raffle.card.ended');
    if (diffDays === 0) return t('raffle.card.endsToday');
    if (diffDays === 1) return t('raffle.card.endsTomorrow');
    return t('raffle.card.endsInDays', { days: diffDays });
  }

  return (
    <div
      onClick={onClick}
      className="bg-surface-2 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
    >
      {/* Item image */}
      <div className="relative h-40 bg-black/30 flex items-center justify-center overflow-hidden">
        {getImageUrl(raffle.itemImageUrl) ? (
          <img
            src={getImageUrl(raffle.itemImageUrl)}
            alt={raffle.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl opacity-30">🎱</span>
        )}
        <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-semibold
          ${raffle.status === 'open' ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
            raffle.status === 'drawn' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
            'bg-gray-500/20 text-gray-400 border border-gray-500/40'}`}
        >
          {raffle.status.toUpperCase()}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-1 truncate">{raffle.title}</h3>
        <p className="text-gray-500 text-xs mb-3">by {raffle.organizerName || raffle.organizerUsername}</p>

        {/* Progress bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{raffle.totalClaimed}/{raffle.totalSpots} {t('raffle.card.spots')}</span>
            <span>{raffle.spotsAvailable} {t('raffle.card.left')}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <span className="text-primary font-bold text-sm">€{raffle.pricePerSpot}{t('raffle.card.perSpot')}</span>
          <span className="text-gray-500 text-xs">{timeLabel()}</span>
        </div>

        {raffle.status === 'drawn' && raffle.winnerUsername && (
          <p className="mt-2 text-yellow-400 text-xs font-medium">🏆 {raffle.winnerName || raffle.winnerUsername}</p>
        )}
      </div>
    </div>
  );
}

export default function RaffleList({ onBack }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open'); // open | drawn | all

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await raffleService.getRaffles(filter === 'all' ? null : filter);
        setRaffles(data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('raffle.pageTitle')}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{t('raffle.pageSubtitle')}</p>
        </div>
        {user && (
          <button
            onClick={() => navigate('/raffles/create')}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-semibold text-sm transition"
          >
            {t('raffle.createRaffle')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['open', 'drawn', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition
              ${filter === f
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-gray-400 hover:text-white border border-white/10'}`}
          >
            {f === 'all' ? t('raffle.filter.all') : f === 'open' ? t('raffle.filter.active') : t('raffle.filter.drawn')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">{t('raffle.loading')}</div>
      ) : raffles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🎰</p>
          <p className="text-gray-400">{t('raffle.noRaffles')}</p>
          {user && (
            <button
              onClick={() => navigate('/raffles/create')}
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-semibold text-sm transition"
            >
              {t('raffle.createFirst')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {raffles.map(r => (
            <RaffleCard
              key={r.id}
              raffle={r}
              onClick={() => navigate(`/raffles/${r.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
