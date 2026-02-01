namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Email service interface for sending email notifications
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Send an email to a single recipient
        /// </summary>
        /// <param name="to">Recipient email address</param>
        /// <param name="subject">Email subject</param>
        /// <param name="body">Email body (HTML or plain text)</param>
        /// <param name="isHtml">Whether the body is HTML (default: true)</param>
        /// <returns>Task representing the async operation</returns>
        Task SendAsync(string to, string subject, string body, bool isHtml = true);

        /// <summary>
        /// Send an email to multiple recipients
        /// </summary>
        /// <param name="recipients">List of recipient email addresses</param>
        /// <param name="subject">Email subject</param>
        /// <param name="body">Email body (HTML or plain text)</param>
        /// <param name="isHtml">Whether the body is HTML (default: true)</param>
        /// <returns>Task representing the async operation</returns>
        Task SendBatchAsync(IEnumerable<string> recipients, string subject, string body, bool isHtml = true);

        /// <summary>
        /// Check if email service is properly configured
        /// </summary>
        /// <returns>True if service is configured and ready to send</returns>
        bool IsConfigured();
    }
}
