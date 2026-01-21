using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Forum.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationToForumContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FlagReason",
                table: "Posts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "Posts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "Posts",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeratedByUserId",
                table: "Posts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationNotes",
                table: "Posts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationStatus",
                table: "Posts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FlagReason",
                table: "Discussions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "Discussions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "Discussions",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeratedByUserId",
                table: "Discussions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationNotes",
                table: "Discussions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationStatus",
                table: "Discussions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FlagReason",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "ModeratedByUserId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "ModerationNotes",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "FlagReason",
                table: "Discussions");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "Discussions");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "Discussions");

            migrationBuilder.DropColumn(
                name: "ModeratedByUserId",
                table: "Discussions");

            migrationBuilder.DropColumn(
                name: "ModerationNotes",
                table: "Discussions");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Discussions");
        }
    }
}
