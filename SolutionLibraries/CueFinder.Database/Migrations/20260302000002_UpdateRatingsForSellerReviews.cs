using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    [Migration("20260302000002_UpdateRatingsForSellerReviews")]
    public partial class UpdateRatingsForSellerReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old unique index on (CueId, RatedByUserId)
            migrationBuilder.DropIndex(
                name: "IX_Rating_Unique_User_Cue",
                table: "Ratings");

            // Make CueId nullable
            migrationBuilder.AlterColumn<int>(
                name: "CueId",
                table: "Ratings",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            // Add ListingType column
            migrationBuilder.AddColumn<string>(
                name: "ListingType",
                table: "Ratings",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            // Add ListingId column
            migrationBuilder.AddColumn<int>(
                name: "ListingId",
                table: "Ratings",
                type: "integer",
                nullable: true);

            // Add new unique partial index: one review per (reviewer, listingType, listingId)
            migrationBuilder.Sql(
                @"CREATE UNIQUE INDEX ""IX_Rating_Unique_Reviewer_Listing""
                  ON ""Ratings"" (""RatedByUserId"", ""ListingType"", ""ListingId"")
                  WHERE ""ListingType"" IS NOT NULL AND ""ListingId"" IS NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Rating_Unique_Reviewer_Listing"";");

            migrationBuilder.DropColumn(
                name: "ListingType",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "ListingId",
                table: "Ratings");

            migrationBuilder.AlterColumn<int>(
                name: "CueId",
                table: "Ratings",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldNullable: true,
                oldType: "integer");

            migrationBuilder.CreateIndex(
                name: "IX_Rating_Unique_User_Cue",
                table: "Ratings",
                columns: new[] { "CueId", "RatedByUserId" },
                unique: true);
        }
    }
}
