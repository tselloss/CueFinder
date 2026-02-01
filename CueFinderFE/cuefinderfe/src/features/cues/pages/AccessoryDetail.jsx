import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as accessoryService from '../../../api/accessoryService';
import ItemDetail from '../../../components/ItemDetail.jsx';

export default function AccessoryDetail({ onBack }) {
  const { id } = useParams();
  const [accessory, setAccessory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await accessoryService.getAccessoryById(id);
        setAccessory(data);
      } catch (err) {
        console.error('Error loading accessory:', err);
        setError('Failed to load accessory details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Define specifications for accessories
  const specifications = accessory ? [
    { label: 'Brand', value: accessory.brand || 'Not specified' },
    { 
      label: 'Condition', 
      value: accessory.condition || 'Not specified',
      highlight: true,
      highlightColor: accessory.condition === 'New' ? 'accent-1' : 'brand'
    },
    { label: 'Type', value: accessory.accessoryType || 'Not specified' },
    { label: 'Material', value: accessory.material || 'Not specified' },
    { label: 'Size', value: accessory.size || 'Not specified' },
    { label: 'Color', value: accessory.color || 'Not specified' },
    { label: 'Location', value: accessory.location ? `📍 ${accessory.location}` : null },
  ].filter(spec => spec.value) : [];

  return (
    <ItemDetail 
      item={accessory}
      itemType="accessory"
      onBack={onBack}
      specifications={specifications}
      loading={loading}
      error={error}
    />
  );
}
