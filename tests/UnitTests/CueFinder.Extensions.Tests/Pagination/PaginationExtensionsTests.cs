using CueFinder.Extensions.Pagination;
using FluentAssertions;
using Xunit;

namespace CueFinder.Extensions.Tests.Pagination
{
    public class PaginationExtensionsTests
    {
        [Fact]
        public void Paginate_IEnumerable_BoundsAndCount()
        {
            var data = Enumerable.Range(1, 50);
            var page = data.Paginate(page: 2, pageSize: 10).ToList();
            page.Should().HaveCount(10);
            page.First().Should().Be(11);
        }

        [Fact]
        public void ValidatePaginationParams_ClampsValues()
        {
            var (p, s) = PaginationExtensions.ValidatePaginationParams(0, 1000);
            p.Should().Be(1);
            s.Should().Be(100);
        }

        [Fact]
        public void ToPaginatedResult_ComputesMetadata()
        {
            var items = new[] {1,2,3};
            var result = items.ToPaginatedResult(page: 1, pageSize: 2, totalCount: 3);
            result.TotalPages.Should().Be(2);
            result.HasNextPage.Should().BeTrue();
            result.HasPreviousPage.Should().BeFalse();
        }
    }
}
