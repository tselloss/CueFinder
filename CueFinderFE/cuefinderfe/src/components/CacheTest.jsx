import React, { useState } from 'react';
import { Box, Button, Card, Typography, CircularProgress, Alert } from 'grommet';

/**
 * Cache Performance Test Component
 * 
 * Simple component to test backend caching performance
 * Shows before/after response times
 */
const CacheTestSimple = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const endpoint = '/api/cues/1'; // Change to any endpoint you want to test

      // First request (no cache)
      console.log('Making first request...');
      const start1 = performance.now();
      const response1 = await fetch(endpoint);
      await response1.json();
      const duration1 = (performance.now() - start1).toFixed(2);

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));

      // Second request (should be cached)
      console.log('Making second request...');
      const start2 = performance.now();
      const response2 = await fetch(endpoint);
      await response2.json();
      const duration2 = (performance.now() - start2).toFixed(2);

      const speedup = (parseFloat(duration1) / parseFloat(duration2)).toFixed(1);
      const improvement = (((parseFloat(duration1) - parseFloat(duration2)) / parseFloat(duration1)) * 100).toFixed(0);
      const isCached = parseFloat(duration2) < 20;

      setResults({
        firstDuration: duration1,
        secondDuration: duration2,
        speedup,
        improvement,
        isCached,
        endpoint
      });

    } catch (err) {
      setError(err.message);
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box pad="medium" gap="medium">
      <Box>
        <Typography size="xlarge" weight="bold">
          🧪 Cache Performance Test
        </Typography>
        <Typography color="text-weak">
          Click the button to test if backend caching is working
        </Typography>
      </Box>

      <Button
        primary
        label={loading ? 'Testing...' : 'Run Cache Test'}
        onClick={runTest}
        disabled={loading}
        icon={loading ? <CircularProgress size="small" /> : undefined}
      />

      {error && (
        <Alert type="error" message={`Error: ${error}`} />
      )}

      {results && (
        <Box gap="small">
          <Card background="light-2" pad="medium">
            <Box gap="small">
              <Typography size="medium" weight="bold">
                📊 Results for {results.endpoint}
              </Typography>

              <Box direction="row" gap="large" wrap>
                <Box>
                  <Typography size="small" color="text-weak">
                    First Request (Database)
                  </Typography>
                  <Typography size="xxlarge" weight="bold">
                    {results.firstDuration}ms
                  </Typography>
                </Box>

                <Box>
                  <Typography size="small" color="text-weak">
                    Second Request (Cache)
                  </Typography>
                  <Typography 
                    size="xxlarge" 
                    weight="bold" 
                    color={results.isCached ? 'status-ok' : 'status-warning'}
                  >
                    {results.secondDuration}ms {results.isCached && '⚡'}
                  </Typography>
                </Box>

                <Box>
                  <Typography size="small" color="text-weak">
                    Speed Improvement
                  </Typography>
                  <Typography size="xxlarge" weight="bold" color="status-ok">
                    {results.speedup}x
                  </Typography>
                </Box>

                <Box>
                  <Typography size="small" color="text-weak">
                    Performance Gain
                  </Typography>
                  <Typography size="xxlarge" weight="bold" color="status-ok">
                    {results.improvement}%
                  </Typography>
                </Box>
              </Box>

              <Box 
                pad="small" 
                background={results.isCached ? 'status-ok' : 'status-warning'}
                round="small"
              >
                <Typography color="white">
                  {results.isCached 
                    ? '✅ Cache is working! Response was served from cache.' 
                    : '⚠️ Response time suggests data may not be cached. Check backend configuration.'}
                </Typography>
              </Box>
            </Box>
          </Card>

          <Card background="light-1" pad="medium">
            <Typography size="small" weight="bold">
              💡 What These Numbers Mean:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <Typography size="small">
                  <strong>First Request:</strong> Fetched from database (slower)
                </Typography>
              </li>
              <li>
                <Typography size="small">
                  <strong>Second Request:</strong> Should be from cache (much faster)
                </Typography>
              </li>
              <li>
                <Typography size="small">
                  <strong>Good cache performance:</strong> 10-50x speedup
                </Typography>
              </li>
              <li>
                <Typography size="small">
                  <strong>Cached response:</strong> Usually &lt; 20ms
                </Typography>
              </li>
            </ul>
          </Card>
        </Box>
      )}

      <Card background="light-3" pad="medium">
        <Typography size="small" weight="bold">
          🔍 How to Test Manually:
        </Typography>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>
            <Typography size="small">
              Open DevTools (F12) → Network tab
            </Typography>
          </li>
          <li>
            <Typography size="small">
              Navigate to any page (e.g., cue details)
            </Typography>
          </li>
          <li>
            <Typography size="small">
              Note the API response time (e.g., 150ms)
            </Typography>
          </li>
          <li>
            <Typography size="small">
              Refresh the page
            </Typography>
          </li>
          <li>
            <Typography size="small">
              Response should be 10-50x faster (e.g., 5ms)
            </Typography>
          </li>
        </ol>
      </Card>
    </Box>
  );
};

export default CacheTestSimple;
