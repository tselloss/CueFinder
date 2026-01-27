using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddBilliardTableSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BilliardTableId",
                table: "Ratings",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BilliardTables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Brand = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    TableSize = table.Column<string>(type: "text", nullable: false),
                    TableType = table.Column<string>(type: "text", nullable: false),
                    PlayingSurface = table.Column<string>(type: "text", nullable: false),
                    FeltType = table.Column<string>(type: "text", nullable: false),
                    FrameMaterial = table.Column<string>(type: "text", nullable: false),
                    PocketType = table.Column<string>(type: "text", nullable: true),
                    Features = table.Column<string>(type: "text", nullable: true),
                    ManufactureYear = table.Column<int>(type: "integer", nullable: true),
                    Condition = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    IsSold = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    SoldDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    AverageRating = table.Column<decimal>(type: "numeric", nullable: false),
                    RatingCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    IsFlagged = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FlagReason = table.Column<string>(type: "text", nullable: true),
                    ModerationStatus = table.Column<string>(type: "text", nullable: false, defaultValue: "approved"),
                    ModeratedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ModeratedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModerationNotes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilliardTables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BilliardTables_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BilliardTableImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BilliardTableId = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilliardTableImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BilliardTableImages_BilliardTables_BilliardTableId",
                        column: x => x.BilliardTableId,
                        principalTable: "BilliardTables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavedBilliardTables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    BilliardTableId = table.Column<int>(type: "integer", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    UserId1 = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedBilliardTables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavedBilliardTables_BilliardTables_BilliardTableId",
                        column: x => x.BilliardTableId,
                        principalTable: "BilliardTables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SavedBilliardTables_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SavedBilliardTables_Users_UserId1",
                        column: x => x.UserId1,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_BilliardTableId",
                table: "Ratings",
                column: "BilliardTableId");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardTableImage_BilliardTableId",
                table: "BilliardTableImages",
                column: "BilliardTableId");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardTableImage_Primary",
                table: "BilliardTableImages",
                columns: new[] { "BilliardTableId", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_BilliardTable_CreatedAt",
                table: "BilliardTables",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardTable_IsFlagged",
                table: "BilliardTables",
                column: "IsFlagged");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardTable_IsSold",
                table: "BilliardTables",
                column: "IsSold");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardTable_UserId",
                table: "BilliardTables",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedBilliardTable_Unique_User_Table",
                table: "SavedBilliardTables",
                columns: new[] { "UserId", "BilliardTableId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedBilliardTables_BilliardTableId",
                table: "SavedBilliardTables",
                column: "BilliardTableId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedBilliardTables_UserId1",
                table: "SavedBilliardTables",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_BilliardTables_BilliardTableId",
                table: "Ratings",
                column: "BilliardTableId",
                principalTable: "BilliardTables",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_BilliardTables_BilliardTableId",
                table: "Ratings");

            migrationBuilder.DropTable(
                name: "BilliardTableImages");

            migrationBuilder.DropTable(
                name: "SavedBilliardTables");

            migrationBuilder.DropTable(
                name: "BilliardTables");

            migrationBuilder.DropIndex(
                name: "IX_Ratings_BilliardTableId",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "BilliardTableId",
                table: "Ratings");
        }
    }
}
