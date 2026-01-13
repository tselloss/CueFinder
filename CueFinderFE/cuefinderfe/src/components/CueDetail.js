import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as cueService from '../api/cueService';
import { useAuth } from '../auth/AuthContext';
import ItemDetail from './ItemDetail';

export default function CueDetail({ onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [cue, setCue] = useState(null);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function load() {
      const data = await cueService.getCueById(id);
      setCue(data);
    }
    load();
  }, [id]);

  // Define specifications for cues
  const specifications = cue ? [
    { label: 'Brand', value: cue.brand || 'Not specified' },
    { 
      label: 'Condition', 
      value: cue.condition || 'Not specified',
      highlight: true,
      highlightColor: cue.condition === 'New' ? 'accent-1' : 'brand'
    },
    { label: 'Material', value: cue.material || cue.shaftMaterial },
    { label: 'Weight', value: cue.weight },
    { label: 'Length', value: cue.length },
    { label: 'Tip Size', value: cue.tipSize || cue.tip_size },
    { label: 'Location', value: cue.location ? `📍 ${cue.location}` : null },
  ].filter(spec => spec.value) : [];

  return (
    <ItemDetail 
      item={cue}
      itemType="cue"
      onBack={onBack}
      specifications={specifications}
    />
  );
}
