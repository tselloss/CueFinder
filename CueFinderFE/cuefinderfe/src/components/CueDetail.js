import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as cueService from '../api/cueService';

export default function CueDetail({ onBack }) {
  const { id } = useParams();
  const [cue, setCue] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const data = await cueService.getCueById(id);
      setCue(data);
    }
    load();
  }, [id]);

  if (!cue) return <div className="cue-detail">Loading...</div>;

  const images = cue.images && cue.images.length > 0 ? cue.images : [];
  const currentImage = images[imageIndex] || '';

  const nextImage = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImage = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <div className="cue-detail">
      <button className="btn" onClick={onBack}>← Back</button>
      <div className="detail-card">
        <div className="carousel-container">
          {images.length > 0 ? (
            <>
              <img src={currentImage} alt={`Cue ${imageIndex + 1}`} className="carousel-image" />
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
          <p><strong>Material:</strong> {cue.material}</p>
          <p><strong>Weight:</strong> {cue.weight}</p>
          <p><strong>Length:</strong> {cue.length}</p>
          <p><strong>Tip size:</strong> {cue.tip_size}</p>
          <p><strong>Description:</strong> {cue.description}</p>
          <p><strong>Location:</strong> {cue.location}</p>
          <div style={{marginTop:10}}>
            <strong>Seller</strong>
            <div className="muted">{cue.seller_name} — {cue.seller_email} {cue.seller_phone ? '- ' + cue.seller_phone : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
