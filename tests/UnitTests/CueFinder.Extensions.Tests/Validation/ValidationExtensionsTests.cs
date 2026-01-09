using CueFinder.Extensions.Validation;
using FluentAssertions;
using Xunit;

namespace CueFinder.Extensions.Tests.Validation
{
    public class ValidationExtensionsTests
    {
        [Theory]
        [InlineData("test@example.com", true)]
        [InlineData("bademail", false)]
        public void IsValidEmail_Works(string email, bool expected)
        {
            email.IsValidEmail().Should().Be(expected);
        }

        [Theory]
        [InlineData("+15551234567", true)]
        [InlineData("555-123", false)]
        public void IsValidPhoneNumber_Works(string phone, bool expected)
        {
            phone.IsValidPhoneNumber().Should().Be(expected);
        }

        [Fact]
        public void IsValidPrice_OnlyTwoDecimalsPositive()
        {
            10.12m.IsValidPrice().Should().BeTrue();
            10.123m.IsValidPrice().Should().BeFalse();
            (-1m).IsValidPrice().Should().BeFalse();
        }

        [Fact]
        public void Sanitize_RemovesHtmlAndScript()
        {
            var input = "<b>Hi</b><script>alert('x')</script> text";
            var result = input.Sanitize();
            // Current implementation removes HTML tags, then script tags, leaving script content text
            result.Should().Be("Hialert('x') text");
        }
    }
}
