namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Settings for email service configuration
    /// </summary>
    public class EmailSettings
    {
        /// <summary>
        /// SMTP server hostname (e.g., smtp.gmail.com)
        /// </summary>
        public string SmtpServer { get; set; } = string.Empty;

        /// <summary>
        /// SMTP server port (default: 587 for TLS, 465 for SSL)
        /// </summary>
        public int SmtpPort { get; set; } = 587;

        /// <summary>
        /// Email address to send from
        /// </summary>
        public string FromEmail { get; set; } = string.Empty;

        /// <summary>
        /// Display name for the sender
        /// </summary>
        public string FromName { get; set; } = "CueFinder Admin";

        /// <summary>
        /// SMTP server password/API key
        /// </summary>
        public string SmtpPassword { get; set; } = string.Empty;

        /// <summary>
        /// Whether to use SSL/TLS encryption
        /// </summary>
        public bool EnableSsl { get; set; } = true;
    }
}
