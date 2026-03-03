using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Forum.Migrations
{
    /// <inheritdoc />
    public partial class AddClubTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TablesCount",
                table: "BilliardClubLocations");

            migrationBuilder.CreateTable(
                name: "BilliardClubTables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
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

            migrationBuilder.CreateIndex(
                name: "IX_BilliardClubTables_LocationId",
                table: "BilliardClubTables",
                column: "LocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BilliardClubTables");

            migrationBuilder.AddColumn<int>(
                name: "TablesCount",
                table: "BilliardClubLocations",
                type: "integer",
                nullable: true);
        }
    }
}
