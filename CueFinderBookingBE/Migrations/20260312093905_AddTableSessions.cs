using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinderBookingBE.Migrations
{
    /// <inheritdoc />
    public partial class AddTableSessions : Migration
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
                name: "BuddyPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LocationName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    PlayDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    StartTime = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SkillLevel = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuddyPosts", x => x.Id);
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

            migrationBuilder.CreateTable(
                name: "BuddyRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BuddyPostId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SkillLevel = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReviewScore = table.Column<int>(type: "integer", nullable: true),
                    ReviewNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuddyRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BuddyRequests_BuddyPosts_BuddyPostId",
                        column: x => x.BuddyPostId,
                        principalTable: "BuddyPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BilliardClubTables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    HourlyRate = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BilliardClubTables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BilliardClubTables_BilliardClubLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "BilliardClubLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateTable(
                name: "TableSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TableId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HourlyRate = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    TotalMinutes = table.Column<int>(type: "integer", nullable: true),
                    TotalCost = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    StartedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TableSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TableSessions_BilliardClubTables_TableId",
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

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubTables_LocationId_Name",
                table: "BilliardClubTables",
                columns: new[] { "LocationId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_BuddyPosts_Status",
                table: "BuddyPosts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BuddyPosts_UserId",
                table: "BuddyPosts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BuddyRequests_BuddyPostId",
                table: "BuddyRequests",
                column: "BuddyPostId");

            migrationBuilder.CreateIndex(
                name: "IX_BuddyRequests_RequesterId",
                table: "BuddyRequests",
                column: "RequesterId");

            migrationBuilder.CreateIndex(
                name: "IX_TableSessions_EndedAt",
                table: "TableSessions",
                column: "EndedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TableSessions_RecordId",
                table: "TableSessions",
                column: "RecordId");

            migrationBuilder.CreateIndex(
                name: "IX_TableSessions_StartedAt",
                table: "TableSessions",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TableSessions_TableId",
                table: "TableSessions",
                column: "TableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BilliardClubBookings");

            migrationBuilder.DropTable(
                name: "BilliardClubCoOwners");

            migrationBuilder.DropTable(
                name: "BuddyRequests");

            migrationBuilder.DropTable(
                name: "TableSessions");

            migrationBuilder.DropTable(
                name: "BuddyPosts");

            migrationBuilder.DropTable(
                name: "BilliardClubTables");

            migrationBuilder.DropTable(
                name: "BilliardClubLocations");

            migrationBuilder.DropTable(
                name: "BilliardClubRecords");
        }
    }
}
