import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cueService } from '@cuefinder/api/cue';

export function CueDetailScreen({ route }) {
  const cueId = route?.params?.cueId;
  const initialCue = route?.params?.initialCue || null;

  const [cue, setCue] = useState(initialCue);
  const [isLoading, setIsLoading] = useState(Boolean(cueId) && !initialCue);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCue = async () => {
      if (!cueId) {
        setError('No cue id was provided.');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await cueService.getCueById(cueId);
        if (!isMounted) {
          return;
        }

        const nextCue = response?.data || response;
        setCue(nextCue || null);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || 'Unable to load cue details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (!initialCue || !initialCue.id) {
      void loadCue();
    }

    return () => {
      isMounted = false;
    };
  }, [cueId, initialCue]);

  const displayPrice = useMemo(() => {
    if (!cue?.price && cue?.price !== 0) {
      return 'Not listed';
    }

    const parsed = Number(cue.price);
    return Number.isFinite(parsed) ? `$${parsed}` : String(cue.price);
  }, [cue]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.card}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#9a5b2d" />
            <Text style={styles.loadingText}>Loading cue details...</Text>
          </View>
        ) : null}

        {!isLoading && error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !error && cue ? (
          <>
            <Text style={styles.title}>{cue.title || 'Untitled cue'}</Text>
            <Text style={styles.subTitle}>{cue.brand || 'Unknown brand'}</Text>

            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>{displayPrice}</Text>

            <Text style={styles.label}>Condition</Text>
            <Text style={styles.value}>{cue.condition || 'Not provided'}</Text>

            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{cue.location || 'Not provided'}</Text>

            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{cue.description || 'No description provided.'}</Text>
          </>
        ) : null}

        {!isLoading && !error && !cue ? <Text style={styles.errorText}>Cue details are unavailable.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 24,
    backgroundColor: '#f6efe6',
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fffaf5',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#6a5b4f',
    fontSize: 14,
  },
  errorText: {
    color: '#a02626',
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: '#241d18',
    fontSize: 24,
    fontWeight: '800',
  },
  subTitle: {
    marginTop: 4,
    marginBottom: 14,
    color: '#6a5b4f',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    color: '#8a5d37',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    color: '#241d18',
    fontSize: 16,
    lineHeight: 24,
  },
});
