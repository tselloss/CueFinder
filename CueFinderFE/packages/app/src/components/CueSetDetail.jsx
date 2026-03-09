import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as cueSetService from '../api/cueSetService';
import ItemDetail from './ItemDetail.jsx';

export default function CueSetDetail({ onBack }) {
  const { id } = useParams();
  const [cueSet, setCueSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await cueSetService.getCueSetById(id);
        setCueSet(data);
      } catch (err) {
        console.error('Error loading cue set:', err);
        setError('Failed to load cue set details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const buildIncluded = (s) => {
    const parts = [];
    if (s.includesPlayingCue) parts.push('Playing Cue');
    if (s.includesBreakCue) parts.push('Break Cue');
    if (s.includesJumpCue) parts.push('Jump Cue');
    if (s.includesCase) parts.push('Case');
    return parts.join(', ') || 'Not specified';
  };

  const cueSpecLine = (weight, length, tipSize, shaft, butt) => {
    const parts = [];
    if (weight) parts.push(`${weight} oz`);
    if (length) parts.push(`${length}"`);
    if (tipSize) parts.push(`${tipSize}mm tip`);
    if (shaft) parts.push(shaft);
    if (butt) parts.push(butt);
    return parts.length ? parts.join(' · ') : null;
  };

  const specifications = cueSet ? [
    { label: 'Brand', value: cueSet.brand || 'Not specified' },
    {
      label: 'Condition',
      value: cueSet.condition || 'Not specified',
      highlight: true,
      highlightColor: cueSet.condition === 'New' ? 'accent-1' : 'brand'
    },
    { label: 'Includes', value: buildIncluded(cueSet) },
    cueSet.includesPlayingCue && {
      label: 'Playing Cue',
      value: cueSpecLine(cueSet.playingCueWeight, cueSet.playingCueLength, cueSet.playingCueTipSize, cueSet.playingCueShaftMaterial, cueSet.playingCueButtMaterial)
    },
    cueSet.includesBreakCue && {
      label: 'Break Cue',
      value: cueSpecLine(cueSet.breakCueWeight, cueSet.breakCueLength, cueSet.breakCueTipSize, cueSet.breakCueShaftMaterial, cueSet.breakCueButtMaterial)
    },
    cueSet.includesJumpCue && {
      label: 'Jump Cue',
      value: cueSpecLine(cueSet.jumpCueWeight, cueSet.jumpCueLength, cueSet.jumpCueTipSize, cueSet.jumpCueShaftMaterial, cueSet.jumpCueButtMaterial)
    },
    cueSet.includesCase && {
      label: 'Case',
      value: [cueSet.caseCapacity, cueSet.caseType, cueSet.caseColor, cueSet.caseMaterial].filter(Boolean).join(', ') || 'Included'
    },
    cueSet.features && { label: 'Notes', value: cueSet.features },
    { label: 'Location', value: cueSet.location ? `📍 ${cueSet.location}` : null },
  ].filter(spec => spec && spec.value) : [];

  return (
    <ItemDetail
      item={cueSet}
      itemType="set"
      onBack={onBack}
      specifications={specifications}
      loading={loading}
      error={error}
    />
  );
}
