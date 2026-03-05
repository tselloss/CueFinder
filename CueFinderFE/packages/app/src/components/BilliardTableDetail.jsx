import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as billiardTableService from '../api/billiardTableService';
import ItemDetail from './ItemDetail.jsx';

export default function BilliardTableDetail({ onBack }) {
  const { id } = useParams();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await billiardTableService.getTableById(id);
        // Normalize: if API returns raw entity (userId/user) instead of DTO (sellerId/sellerName),
        // map the fields so ItemDetail always gets the expected shape.
        if (data && !data.sellerId && (data.userId || data.user)) {
          data.sellerId = data.userId || data.user?.id;
          data.sellerName = data.user?.name || data.user?.username || '';
          data.sellerEmail = data.user?.email || '';
          data.sellerPhone = data.user?.phone || null;
          data.sellerHidePhone = data.user?.hidePhone ?? false;
          data.sellerIsVerified = data.user?.isVerified ?? false;
        }
        setTable(data);
      } catch (err) {
        console.error('Error loading table:', err);
        setError('Failed to load table details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const specifications = table ? [
    { label: 'Brand', value: table.brand || 'Not specified' },
    { label: 'Table Size', value: table.tableSize || 'Not specified' },
    { label: 'Table Type', value: table.tableType || 'Not specified' },
    { label: 'Playing Surface', value: table.playingSurface || 'Not specified' },
    { label: 'Felt Type', value: table.feltType || 'Not specified' },
    { label: 'Frame Material', value: table.frameMaterial || 'Not specified' },
    { label: 'Pocket Type', value: table.pocketType },
    { label: 'Features', value: table.features },
    {
      label: 'Condition',
      value: table.condition || 'Not specified',
      highlight: true,
      highlightColor: table.condition === 'mint' ? 'accent-1' : 'brand'
    },
    { label: 'Year Manufactured', value: table.manufactureYear },
    { label: 'Location', value: table.location ? `📍 ${table.location}` : null },
  ].filter(spec => spec.value) : [];

  return (
    <ItemDetail
      item={table}
      itemType="table"
      onBack={onBack}
      specifications={specifications}
      loading={loading}
      error={error}
    />
  );
}
