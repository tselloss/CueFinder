namespace CueFinder.Auth.Interfaces
{
    /// <summary>
    /// Interface for SMS/Viber messaging service
    /// </summary>
    public interface ISmsService
    {
        /// <summary>
        /// Send verification code via SMS
        /// </summary>
        Task<bool> SendVerificationCodeAsync(string phoneNumber, string code, string method = "SMS");

        /// <summary>
        /// Send magic link via SMS/Viber
        /// </summary>
        Task<bool> SendMagicLinkAsync(string phoneNumber, string magicLink, string method = "Viber");

        /// <summary>
        /// Send verification code and magic link
        /// </summary>
        Task<bool> SendVerificationWithLinkAsync(string phoneNumber, string code, string magicLink, string method = "Viber");
    }
}
