import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

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
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          🧪 Cache Performance Test
        </h2>
        <p className="text-gray-400">
          Click the button to test if backend caching is working
        </p>
      </div>

      <button
        onClick={runTest}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Testing...
          </>
        ) : (
          'Run Cache Test'
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-red-200">Error: {error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              📊 Results for {results.endpoint}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  First Request (Database)
                </p>
                <p className="text-2xl font-bold text-white">
                  {results.firstDuration}ms
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Second Request (Cache)
                </p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${results.isCached ? 'text-green-400' : 'text-yellow-400'}`}>
                  {results.secondDuration}ms {results.isCached && '⚡'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Speed Improvement
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {results.speedup}x
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Performance Gain
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {results.improvement}%
                </p>
              </div>
            </div>

            <div className={`p-3 rounded ${results.isCached ? 'bg-green-900 border border-green-700' : 'bg-yellow-900 border border-yellow-700'}`}>
              <p className={results.isCached ? 'text-green-200' : 'text-yellow-200'}>
                {results.isCached 
                  ? '✅ Cache is working! Response was served from cache.' 
                  : '⚠️ Response time suggests data may not be cached. Check backend configuration.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h4 className="text-sm font-bold text-white mb-3">
              💡 What These Numbers Mean:
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <strong>First Request:</strong> Fetched from database (slower)
              </li>
              <li>
                <strong>Second Request:</strong> Should be from cache (much faster)
              </li>
              <li>
                <strong>Good cache performance:</strong> 10-50x speedup
              </li>
              <li>
                <strong>Cached response:</strong> Usually &lt; 20ms
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-sm font-bold text-white mb-3">
          🔍 How to Test Manually:
        </h4>
        <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
          <li>Open DevTools (F12) → Network tab</li>
          <li>Navigate to any page (e.g., cue details)</li>
          <li>Note the API response time (e.g., 150ms)</li>
          <li>Refresh the page</li>
          <li>Response should be 10-50x faster (e.g., 5ms)</li>
        </ol>
      </div>
export default CacheTestSimple;
