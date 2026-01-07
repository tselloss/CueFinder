import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as cueService from '../api/cueService';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function CueDetail({ onBack }) {
  const { id } = useParams();
  const [cue, setCue] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await cueService.getCueById(id);
      setCue(data);
    }
    load();
  }, [id]);

  if (!cue) return <div className="cue-detail">Loading...</div>;

  const images = cue.images && cue.images.length > 0 ? cue.images : [];
  const currentImage = getImageUrl(images[imageIndex]);

  const nextImage = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImage = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const nextImageFullscreen = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImageFullscreen = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <div className="cue-detail">
      <button className="btn" onClick={onBack}>← Back</button>
      <div className="detail-card">
        <div className="carousel-container">
          {images.length > 0 ? (
            <>
              <img 
                src={currentImage} 
                alt={`Cue ${imageIndex + 1}`} 
                className="carousel-image" 
                onClick={openFullscreen}
                style={{ cursor: 'pointer' }}
              />
              {images.length > 1 && (
                <>
                  <button className="carousel-btn prev-btn" onClick={prevImage}>‹</button>
                  <button className="carousel-btn next-btn" onClick={nextImage}>›</button>
                  <div className="carousel-dots">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`dot ${idx === imageIndex ? 'active' : ''}`}
                        onClick={() => setImageIndex(idx)}
                      ></span>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="image-placeholder">No images available</div>
          )}
        </div>
        <div className="info">
          <h2>{cue.brand} {cue.title} {cue.is_sold && <span className="badge">SOLD</span>}</h2>
          <p className="price">${(cue.price||0).toFixed(2)}</p>
          <p><strong>Condition:</strong> {cue.condition}</p>
          <p className="hide-mobile"><strong>Material:</strong> {cue.material}</p>
          <p className="hide-mobile"><strong>Weight:</strong> {cue.weight}</p>
          <p className="hide-mobile"><strong>Length:</strong> {cue.length}</p>
          <p className="hide-mobile"><strong>Tip size:</strong> {cue.tip_size}</p>
          <p className="hide-mobile"><strong>Description:</strong> {cue.description}</p>
          <p className="hide-mobile"><strong>Location:</strong> {cue.location}</p>
          <div style={{marginTop:10}}>
            <strong>Seller</strong>
            <div className="muted">{cue.seller_name} — {cue.seller_email} {cue.seller_phone ? '- ' + cue.seller_phone : ''}</div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && (
        <div className="fullscreen-viewer" onClick={closeFullscreen}>
          <button className="fullscreen-close" onClick={closeFullscreen}>✕</button>
          <img 
            src={currentImage} 
            alt={`Cue ${imageIndex + 1}`} 
            className="fullscreen-image"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button 
                className="carousel-btn prev-btn fullscreen-nav" 
                onClick={(e) => { e.stopPropagation(); prevImageFullscreen(); }}
              >
                ‹
              </button>
              <button 
                className="carousel-btn next-btn fullscreen-nav" 
                onClick={(e) => { e.stopPropagation(); nextImageFullscreen(); }}
              >
                ›
              </button>
              <div className="fullscreen-counter">
                {imageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
