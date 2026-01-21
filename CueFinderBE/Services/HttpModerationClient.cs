using System.Net.Http.Json;
using System.Text.Json;
using CueFinder.Extensions.Moderation;

namespace CueFinderBE.Services
{
    /// <summary>
    /// HTTP client for calling CueFinderModerator microservice
    /// </summary>
    public interface IHttpModerationClient
    {
        Task<ModerationResult> ScanImageAsync(string imagePath, int userId, int? cueId = null, int? cueCaseId = null);
        Task<object?> CheckImageHashAsync(string hash);
        Task<IEnumerable<object>> GetPendingFlagsAsync(int limit = 50);
        Task<bool> ApproveFlagAsync(int flagId, int adminUserId, string notes = "");
        Task<bool> RejectFlagAsync(int flagId, int adminUserId, string notes = "", bool banUser = false);
        Task<IEnumerable<object>> CheckSimilarImagesAsync(string hash, int tolerance = 5);
    }

    public class HttpModerationClient : IHttpModerationClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<HttpModerationClient> _logger;

        public HttpModerationClient(HttpClient httpClient, ILogger<HttpModerationClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<ModerationResult> ScanImageAsync(string imagePath, int userId, int? cueId = null, int? cueCaseId = null)
        {
            try
            {
                var request = new { imagePath, userId, cueId, cueCaseId };
                var response = await _httpClient.PostAsJsonAsync("/api/moderation/scan-image", request);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Image scan failed with status {response.StatusCode}");
                    return new ModerationResult { IsUnsafe = false, ErrorMessage = "Moderation service error" };
                }

                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ModerationResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return result ?? new ModerationResult { IsUnsafe = false };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling moderation service for image scan");
                return new ModerationResult { IsUnsafe = false, ErrorMessage = ex.Message };
            }
        }

        public async Task<object?> CheckImageHashAsync(string hash)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/moderation/check-hash/{hash}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Hash check failed with status {response.StatusCode}");
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<JsonElement>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling moderation service for hash check");
                return null;
            }
        }

        public async Task<IEnumerable<object>> GetPendingFlagsAsync(int limit = 50)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/moderation/pending?limit={limit}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Get pending failed with status {response.StatusCode}");
                    return Enumerable.Empty<object>();
                }

                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<IEnumerable<JsonElement>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return result?.Cast<object>() ?? Enumerable.Empty<object>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling moderation service for pending flags");
                return Enumerable.Empty<object>();
            }
        }

        public async Task<bool> ApproveFlagAsync(int flagId, int adminUserId, string notes = "")
        {
            try
            {
                var request = new { adminUserId, notes };
                var response = await _httpClient.PostAsJsonAsync($"/api/moderation/approve/{flagId}", request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling moderation service for approve");
                return false;
            }
        }

        public async Task<bool> RejectFlagAsync(int flagId, int adminUserId, string notes = "", bool banUser = false)
        {
            try
            {
                var request = new { adminUserId, notes, banUser };
                var response = await _httpClient.PostAsJsonAsync($"/api/moderation/reject/{flagId}", request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling moderation service for reject");
                return false;
            }
        }

        public async Task<IEnumerable<object>> CheckSimilarImagesAsync(string hash, int tolerance = 5)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/moderation/similar/{hash}?tolerance={tolerance}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Similar images check failed with status {response.StatusCode}");
                    return Enumerable.Empty<object>();
                }

                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<IEnumerable<JsonElement>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return result?.Cast<object>() ?? Enumerable.Empty<object>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling moderation service for similar images");
                return Enumerable.Empty<object>();
            }
        }
    }
}
