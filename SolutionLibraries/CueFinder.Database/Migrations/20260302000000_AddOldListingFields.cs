using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddOldListingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cues
            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "Cues",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "Cues",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPromptedAt",
                table: "Cues",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUserResponseAt",
                table: "Cues",
                type: "timestamp without time zone",
                nullable: true);

            // CueCases
            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "CueCases",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "CueCases",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPromptedAt",
                table: "CueCases",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUserResponseAt",
                table: "CueCases",
                type: "timestamp without time zone",
                nullable: true);

            // BilliardTables
            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "BilliardTables",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "BilliardTables",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPromptedAt",
                table: "BilliardTables",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUserResponseAt",
                table: "BilliardTables",
                type: "timestamp without time zone",
                nullable: true);

            // Accessories
            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "Accessories",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "Accessories",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPromptedAt",
                table: "Accessories",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUserResponseAt",
                table: "Accessories",
                type: "timestamp without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "IsHidden", table: "Cues");
            migrationBuilder.DropColumn(name: "HiddenAt", table: "Cues");
            migrationBuilder.DropColumn(name: "LastPromptedAt", table: "Cues");
            migrationBuilder.DropColumn(name: "LastUserResponseAt", table: "Cues");

            migrationBuilder.DropColumn(name: "IsHidden", table: "CueCases");
            migrationBuilder.DropColumn(name: "HiddenAt", table: "CueCases");
            migrationBuilder.DropColumn(name: "LastPromptedAt", table: "CueCases");
            migrationBuilder.DropColumn(name: "LastUserResponseAt", table: "CueCases");

            migrationBuilder.DropColumn(name: "IsHidden", table: "BilliardTables");
            migrationBuilder.DropColumn(name: "HiddenAt", table: "BilliardTables");
            migrationBuilder.DropColumn(name: "LastPromptedAt", table: "BilliardTables");
            migrationBuilder.DropColumn(name: "LastUserResponseAt", table: "BilliardTables");

            migrationBuilder.DropColumn(name: "IsHidden", table: "Accessories");
            migrationBuilder.DropColumn(name: "HiddenAt", table: "Accessories");
            migrationBuilder.DropColumn(name: "LastPromptedAt", table: "Accessories");
            migrationBuilder.DropColumn(name: "LastUserResponseAt", table: "Accessories");
        }
    }
}
