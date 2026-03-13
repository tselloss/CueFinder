import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getClubRecords } from '../api/clubService.js';
import { CUEFINDER_SITE_URL } from '../config/siteConfig.js';

const isLogoUrl = (value) => (value || '').trim().length > 0;

export default function Home() {
  const { t } = useTranslation();
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    getClubRecords()
      .then((data) => setClubs(Array.isArray(data) ? data : []))
      .catch(() => setClubs([]));
  }, []);

  const logos = useMemo(() => {
    return clubs
      .map((club) => ({
        id: club.id,
        name: club.ownerName || t('home.clubFallback'),
        logoUrl: club.logoUrl || club.socialLink || ''
      }))
      .filter((club) => isLogoUrl(club.logoUrl));
  }, [clubs, t]);

  const carouselItems = logos.length > 0 ? [...logos, ...logos] : [];

  return (
    <section className="card">
      <div className="home-hero">
        <h1>{t('home.title')}</h1>
        <p className="home-hero-tagline">{t('home.tagline')}</p>
        <p className="home-hero-note">{t('home.ownerNote')}</p>
        <div className="home-cta-row">
          <Link to="/clubs" style={{ textDecoration: 'none' }}>
            <button className="primary" style={{ marginTop: 0 }}>
              {t('home.browseClubs')} →
            </button>
          </Link>
        </div>
      </div>

      <div className="logo-carousel">
        <h2>{t('home.featuredClubs')}</h2>
        {carouselItems.length === 0 ? (
          <p className="muted">{t('home.noLogos')}</p>
        ) : (
          <div className="logo-track">
            {carouselItems.map((club, index) => (
              <div className="logo-card" key={`${club.id}-${index}`}>
                <img src={club.logoUrl} alt={`${club.name} logo`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <a href={CUEFINDER_SITE_URL} target="_blank" rel="noreferrer" className="cuefinder-promo">
        <div className="cuefinder-promo-text">
          <strong style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>🎯 {t('home.promoTitle')}</strong>
          <span className="muted" style={{ fontSize: '0.85rem' }}>{t('home.promoText')}</span>
        </div>
        <span className="cuefinder-promo-cta">{t('home.promoCta')}</span>
      </a>
    </section>
  );
}
