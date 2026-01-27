using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddAccessories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accessories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AccessoryType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Material = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Size = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Color = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsSold = table.Column<bool>(type: "boolean", nullable: false),
                    SoldDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    AverageRating = table.Column<decimal>(type: "numeric", nullable: false),
                    RatingCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accessories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accessories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AccessoryImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccessoryId = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AltText = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessoryImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessoryImages_Accessories_AccessoryId",
                        column: x => x.AccessoryId,
                        principalTable: "Accessories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accessory_CreatedAt",
                table: "Accessories",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Accessory_IsSold",
                table: "Accessories",
                column: "IsSold");

            migrationBuilder.CreateIndex(
                name: "IX_Accessory_UserId",
                table: "Accessories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessoryImage_AccessoryId",
                table: "AccessoryImages",
                column: "AccessoryId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessoryImage_Primary",
                table: "AccessoryImages",
                columns: new[] { "AccessoryId", "IsPrimary" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessoryImages");

            migrationBuilder.DropTable(
                name: "Accessories");
        }
    }
}
