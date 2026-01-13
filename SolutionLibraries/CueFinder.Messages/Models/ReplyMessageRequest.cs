using System.ComponentModel.DataAnnotations;

namespace CueFinder.Messages.Models
{
    /// <summary>
    /// Request model for replying to a message
    /// </summary>
    public class ReplyMessageRequest
    {
        /// <summary>
        /// Reply message content
        /// </summary>
        [Required(ErrorMessage = "Message content is required")]
        [StringLength(5000, MinimumLength = 1, ErrorMessage = "Message must be between 1 and 5000 characters")]
        public string Content { get; set; } = string.Empty;
    }
}
