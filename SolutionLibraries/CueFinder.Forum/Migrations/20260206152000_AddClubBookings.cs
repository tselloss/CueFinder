using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Forum.Migrations
{
    /// <inheritdoc />
    public partial class AddClubBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BilliardClubBookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TableId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CustomerEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CustomerPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilliardClubBookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BilliardClubBookings_BilliardClubLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "BilliardClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BilliardClubBookings_BilliardClubRecords_RecordId",
                        column: x => x.RecordId,
                        principalTable: "BilliardClubRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BilliardClubBookings_BilliardClubTables_TableId",
                        column: x => x.TableId,
                        principalTable: "BilliardClubTables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubBookings_CreatedByUserId",
                table: "BilliardClubBookings",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubBookings_LocationId",
                table: "BilliardClubBookings",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubBookings_RecordId",
                table: "BilliardClubBookings",
                column: "RecordId");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubBookings_StartTime",
                table: "BilliardClubBookings",
                column: "StartTime");

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubBookings_TableId",
                table: "BilliardClubBookings",
                column: "TableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BilliardClubBookings");
        }
    }
}
