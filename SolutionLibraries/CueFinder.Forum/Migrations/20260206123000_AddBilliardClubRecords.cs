using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Forum.Migrations
{
    /// <inheritdoc />
    public partial class AddBilliardClubRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BilliardClubRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OwnerEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OwnerPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SocialLink = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilliardClubRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BilliardClubCoOwners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordId = table.Column<Guid>(type: "uuid", nullable: false),
                    CoOwnerUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CoOwnerUsername = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilliardClubCoOwners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BilliardClubCoOwners_BilliardClubRecords_RecordId",
                        column: x => x.RecordId,
                        principalTable: "BilliardClubRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BilliardClubLocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    City = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Region = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Country = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    TablesCount = table.Column<int>(type: "integer", nullable: true),
                    OpeningHours = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    SpecialNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Latitude = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Longitude = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilliardClubLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BilliardClubLocations_BilliardClubRecords_RecordId",
                        column: x => x.RecordId,
                        principalTable: "BilliardClubRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubCoOwners_RecordId_Email",
                table: "BilliardClubCoOwners",
                columns: new[] { "RecordId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubLocations_RecordId",
                table: "BilliardClubLocations",
                column: "RecordId");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubRecords_OwnerUserId",
                table: "BilliardClubRecords",
                column: "OwnerUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BilliardClubCoOwners");

            migrationBuilder.DropTable(
                name: "BilliardClubLocations");

            migrationBuilder.DropTable(
                name: "BilliardClubRecords");
        }
    }
}
