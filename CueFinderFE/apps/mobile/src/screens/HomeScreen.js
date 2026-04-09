import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@cuefinder/auth';
import { cueService } from '@cuefinder/api/cue';

export function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [cues, setCues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCues = async () => {
      try {
        const response = await cueService.getCues();
        if (!isMounted) {
          return;
        }

        const nextCues = Array.isArray(response)
          ? response.slice(0, 6)
          : Array.isArray(response?.data)
            ? response.data.slice(0, 6)
            : [];

        setCues(nextCues);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || 'Unable to load cue listings.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCues();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Signed In</Text>
        <Text style={styles.title}>Welcome back{user?.name ? `, ${user.name}` : ''}</Text>
        <Text style={styles.description}>
          The mobile app is now using shared auth and API packages with secure session storage.
        </Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Username</Text>
        <Text style={styles.detailValue}>{user?.username || 'Unknown'}</Text>
        <Text style={styles.detailLabel}>Email</Text>
        <Text style={styles.detailValue}>{user?.email || 'Not provided'}</Text>
      </View>

      <View style={styles.listingCard}>
        <Text style={styles.sectionTitle}>Latest cues</Text>
        <Text style={styles.sectionDescription}>This data is coming through the shared @cuefinder/api package.</Text>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#9a5b2d" />
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : null}

        {!isLoading && error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !error && cues.length === 0 ? (
          <Text style={styles.emptyText}>No listings were returned from the API.</Text>
        ) : null}

        {!isLoading && !error
          ? cues.map((cue) => (
              <Pressable
                key={cue.id ?? cue.title}
                accessibilityRole="button"
                disabled={!cue.id}
                onPress={() => navigation.navigate('CueDetail', { cueId: cue.id, initialCue: cue })}
                style={({ pressed }) => [styles.listingItem, pressed && cue.id ? styles.listingItemPressed : null]}
              >
                <Text style={styles.listingTitle}>{cue.title || 'Untitled cue'}</Text>
                <Text style={styles.listingMeta}>
                  {cue.brand || 'Unknown brand'}{cue.price ? `  |  $${cue.price}` : ''}
                </Text>
              </Pressable>
            ))
          : null}
      </View>

      <Pressable accessibilityRole="button" onPress={logout} style={styles.button}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 24,
    gap: 18,
    backgroundColor: '#f6efe6',
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#1f1b17',
  },
  eyebrow: {
    marginBottom: 10,
    color: '#f4bb83',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: 14,
    color: '#fff7ef',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  description: {
    color: '#dbcbbd',
    fontSize: 16,
    lineHeight: 24,
  },
  detailCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fffaf5',
  },
  detailLabel: {
    marginTop: 8,
    marginBottom: 4,
    color: '#8a5d37',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    color: '#241d18',
    fontSize: 16,
    fontWeight: '600',
  },
  listingCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fffaf5',
  },
  sectionTitle: {
    marginBottom: 6,
    color: '#241d18',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionDescription: {
    marginBottom: 16,
    color: '#6a5b4f',
    fontSize: 14,
    lineHeight: 20,
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
  emptyText: {
    color: '#6a5b4f',
    fontSize: 14,
    lineHeight: 20,
  },
  listingItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eaded2',
  },
  listingItemPressed: {
    opacity: 0.75,
  },
  listingTitle: {
    color: '#241d18',
    fontSize: 16,
    fontWeight: '700',
  },
  listingMeta: {
    marginTop: 4,
    color: '#6a5b4f',
    fontSize: 14,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#9a5b2d',
  },
  buttonText: {
    color: '#fff9f2',
    fontSize: 16,
    fontWeight: '700',
  },
});