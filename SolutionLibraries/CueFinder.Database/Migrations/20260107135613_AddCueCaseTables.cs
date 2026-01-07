using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddCueCaseTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CueCases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CaseCapacity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CaseOpening = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CaseType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Color = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CaseMaterial = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OuterDimensions = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PocketSpace = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HandleExtensionSpace = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CaseWeight = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsSold = table.Column<bool>(type: "boolean", nullable: false),
                    SoldDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    AverageRating = table.Column<decimal>(type: "numeric", nullable: false),
                    RatingCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CueCases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CueCases_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CueCaseImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CueCaseId = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CueCaseImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CueCaseImages_CueCases_CueCaseId",
                        column: x => x.CueCaseId,
                        principalTable: "CueCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CueCaseImage_CueCaseId",
                table: "CueCaseImages",
                column: "CueCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CueCaseImage_Primary",
                table: "CueCaseImages",
                columns: new[] { "CueCaseId", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_CueCase_CreatedAt",
                table: "CueCases",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CueCase_IsSold",
                table: "CueCases",
                column: "IsSold");

            migrationBuilder.CreateIndex(
                name: "IX_CueCase_Price",
                table: "CueCases",
                column: "Price");

            migrationBuilder.CreateIndex(
                name: "IX_CueCase_UserId",
                table: "CueCases",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CueCaseImages");

            migrationBuilder.DropTable(
                name: "CueCases");
        }
    }
}
