/**
 * Simple Cache Performance Tester
 * 
 * Add this to your frontend and call testCache() from console or a button
 */

export const testCache = async () => {
  console.log('🧪 Starting Cache Performance Test...\n');
  console.log('━'.repeat(60));
  
  const baseUrl = 'http://localhost:5000'; // Adjust if needed
  const endpoints = [
    { url: '/api/cues/1', label: 'Get Cue #1' },
    { url: '/api/users/1', label: 'Get User #1' },
    { url: '/api/cues?page=1&pageSize=10', label: 'Get Cue List' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n📊 Testing: ${endpoint.label}`);
    console.log(`   Endpoint: ${endpoint.url}`);
    
    // First request (no cache)
    const start1 = performance.now();
    try {
      await fetch(`${baseUrl}${endpoint.url}`);
      const duration1 = (performance.now() - start1).toFixed(2);
      console.log(`   ⏱️  First request:  ${duration1}ms (from database)`);
      
      // Small delay to ensure first request completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second request (should be cached)
      const start2 = performance.now();
      await fetch(`${baseUrl}${endpoint.url}`);
      const duration2 = (performance.now() - start2).toFixed(2);
      
      const speedup = (parseFloat(duration1) / parseFloat(duration2)).toFixed(1);
      const improvement = (((parseFloat(duration1) - parseFloat(duration2)) / parseFloat(duration1)) * 100).toFixed(0);
      const isCached = parseFloat(duration2) < 20;
      
      console.log(`   ⚡ Second request: ${duration2}ms ${isCached ? '(from cache!)' : '(possible cache miss)'}`);
      console.log(`   📈 Performance: ${speedup}x faster (${improvement}% improvement)`);
      
      results.push({
        endpoint: endpoint.label,
        firstRequest: `${duration1}ms`,
        secondRequest: `${duration2}ms`,
        speedup: `${speedup}x`,
        improvement: `${improvement}%`,
        cached: isCached ? '✅' : '❌'
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        endpoint: endpoint.label,
        error: error.message,
        cached: '❌'
      });
    }
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.table(results);
  
  const cachedCount = results.filter(r => r.cached === '✅').length;
  const totalCount = results.length;
  
  console.log('\n' + '━'.repeat(60));
  if (cachedCount === totalCount) {
    console.log('✅ All requests were cached! Cache is working perfectly! 🎉');
  } else if (cachedCount > 0) {
    console.log(`⚠️  ${cachedCount}/${totalCount} requests were cached. Check configuration.`);
  } else {
    console.log('❌ No requests were cached. Cache may not be enabled.');
    console.log('💡 Check: appsettings.json → Caching.EnableCaching = true');
  }
  console.log('━'.repeat(60) + '\n');
  
  return results;
};

// Make it globally available for easy testing
if (typeof window !== 'undefined') {
  window.testCache = testCache;
}

export default testCache;
