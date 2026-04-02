using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    [Migration("20260402000000_AddAutoEndWhenFullToRaffles")]
    public partial class AddAutoEndWhenFullToRaffles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AutoEndWhenFull",
                table: "Raffles",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoEndWhenFull",
                table: "Raffles");
        }
    }
}
