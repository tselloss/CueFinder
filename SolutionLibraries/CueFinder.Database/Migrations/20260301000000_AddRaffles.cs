using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddRaffles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Raffles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizerId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ItemImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalSpots = table.Column<int>(type: "integer", nullable: false),
                    PricePerSpot = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    EndsAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    AcceptPayPal = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AcceptRevolut = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AcceptBankTransfer = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AcceptViva = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AcceptIris = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AcceptDM = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    PaymentDetails = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "open"),
                    WinnerId = table.Column<int>(type: "integer", nullable: true),
                    WinnerSpotNumber = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    DrawnAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Raffles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Raffles_Users_OrganizerId",
                        column: x => x.OrganizerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Raffles_Users_WinnerId",
                        column: x => x.WinnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RaffleEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RaffleId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    SpotNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PaymentReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    PaidAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaffleEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaffleEntries_Raffles_RaffleId",
                        column: x => x.RaffleId,
                        principalTable: "Raffles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RaffleEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Raffle_OrganizerId",
                table: "Raffles",
                column: "OrganizerId");

            migrationBuilder.CreateIndex(
                name: "IX_Raffle_Status",
                table: "Raffles",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Raffle_EndsAt",
                table: "Raffles",
                column: "EndsAt");

            migrationBuilder.CreateIndex(
                name: "IX_RaffleEntry_Raffle_Spot",
                table: "RaffleEntries",
                columns: new[] { "RaffleId", "SpotNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RaffleEntry_UserId",
                table: "RaffleEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RaffleEntry_Status",
                table: "RaffleEntries",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RaffleEntries");
            migrationBuilder.DropTable(name: "Raffles");
        }
    }
}
