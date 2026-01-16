using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Forum.Migrations
{
    /// <inheritdoc />
    public partial class AddUsernameColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUsername",
                table: "Posts",
                type: "text",
                nullable: false,
                defaultValue: "User");

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUsername",
                table: "Discussions",
                type: "text",
                nullable: false,
                defaultValue: "User");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedByUsername",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "CreatedByUsername",
                table: "Discussions");
        }
    }
}
