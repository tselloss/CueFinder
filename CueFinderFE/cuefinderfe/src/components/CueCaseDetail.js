import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as cueCaseService from '../api/cueCaseService';
import { useAuth } from '../auth/AuthContext';
import ItemDetail from './ItemDetail';

export default function CueCaseDetail({ onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [cueCase, setCueCase] = useState(null);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function load() {
      const data = await cueCaseService.getCueCaseById(id);
      setCueCase(data);
    }
    load();
  }, [id]);

  // Define specifications for cases
  const specifications = cueCase ? [
    { label: 'Brand', value: cueCase.brand || 'Not specified' },
    { 
      label: 'Condition', 
      value: cueCase.condition || 'Not specified',
      highlight: true,
      highlightColor: cueCase.condition === 'Excellent' || cueCase.condition === 'New' ? 'accent-1' : 'brand'
    },
    { label: 'Capacity', value: cueCase.capacity },
    { label: 'Opening', value: cueCase.opening },
    { label: 'Type', value: cueCase.type },
    { label: 'Material', value: cueCase.material },
    { label: 'Color', value: cueCase.color },
    { label: 'Outer Dimensions', value: cueCase.outerDimensions },
    { label: 'Pocket Space', value: cueCase.pocketSpace },
    { label: 'Handle/Extension Space', value: cueCase.handleExtensionSpace },
    { label: 'Weight', value: cueCase.caseWeight },
    { label: 'Location', value: cueCase.location ? `📍 ${cueCase.location}` : null },
  ].filter(spec => spec.value) : [];

  return (
    <ItemDetail 
      item={cueCase}
      itemType="case"
      onBack={onBack}
      specifications={specifications}
    />
  );
}
