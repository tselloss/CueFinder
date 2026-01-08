using System.Threading;

namespace CueFinder.Extensions.Caching;

/// <summary>
/// Tracks cache statistics
/// </summary>
public class CacheStatistics
{
    private long _hits;
    private long _misses;
    private long _sets;

    /// <summary>
    /// Total number of cache hits
    /// </summary>
    public long Hits => _hits;

    /// <summary>
    /// Total number of cache misses
    /// </summary>
    public long Misses => _misses;

    /// <summary>
    /// Total number of cache sets
    /// </summary>
    public long Sets => _sets;

    /// <summary>
    /// Cache hit ratio (0-1)
    /// </summary>
    public double HitRatio
    {
        get
        {
            var total = _hits + _misses;
            return total == 0 ? 0 : (double)_hits / total;
        }
    }

    internal void RecordHit() => Interlocked.Increment(ref _hits);
    internal void RecordMiss() => Interlocked.Increment(ref _misses);
    internal void RecordSet() => Interlocked.Increment(ref _sets);

    /// <summary>
    /// Resets all statistics
    /// </summary>
    public void Reset()
    {
        Interlocked.Exchange(ref _hits, 0);
        Interlocked.Exchange(ref _misses, 0);
        Interlocked.Exchange(ref _sets, 0);
    }

    public override string ToString()
    {
        return $"Hits: {Hits}, Misses: {Misses}, Sets: {Sets}, Hit Ratio: {HitRatio:P2}";
    }
}
