import { useEffect, useMemo, useState } from 'react';
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
      <h1>{t('home.title')}</h1>
      <p>{t('home.tagline')}</p>
      <p className="muted">{t('home.ownerNote')}</p>

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

      <div className="cuefinder-promo">
        <h3>{t('home.promoTitle')}</h3>
        <p className="muted">{t('home.promoText')}</p>
        <a href={CUEFINDER_SITE_URL} target="_blank" rel="noreferrer">
          {t('home.promoCta')}
        </a>
      </div>
    </section>
  );
}
