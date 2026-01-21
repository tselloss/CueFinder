using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationToMainContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BanReason",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BannedAt",
                table: "Users",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HidePhone",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsBanned",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FlagReason",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "Messages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "Messages",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModeratedByUserId",
                table: "Messages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationNotes",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationStatus",
                table: "Messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FlagReason",
                table: "Cues",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "Cues",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "Cues",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModeratedByUserId",
                table: "Cues",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationNotes",
                table: "Cues",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationStatus",
                table: "Cues",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FlagReason",
                table: "CueCases",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "CueCases",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "CueCases",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModeratedByUserId",
                table: "CueCases",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationNotes",
                table: "CueCases",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationStatus",
                table: "CueCases",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "FlaggedImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ImageHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CueId = table.Column<int>(type: "integer", nullable: true),
                    CueCaseId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    FlagReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "other"),
                    AIConfidenceScore = table.Column<double>(type: "double precision", nullable: true),
                    IsAIFlagged = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    AdminUserId = table.Column<int>(type: "integer", nullable: true),
                    FlaggedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlaggedImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlaggedImages_Users_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FlaggedImages_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ModerationQueues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FlaggedImageId = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    UserReportCount = table.Column<int>(type: "integer", nullable: false),
                    IsBeingReviewed = table.Column<bool>(type: "boolean", nullable: false),
                    ReviewingAdminId = table.Column<int>(type: "integer", nullable: true),
                    ReviewStartedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    AddedToQueueAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModerationQueues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModerationQueues_FlaggedImages_FlaggedImageId",
                        column: x => x.FlaggedImageId,
                        principalTable: "FlaggedImages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ModerationQueues_Users_ReviewingAdminId",
                        column: x => x.ReviewingAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "UserReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReportingUserId = table.Column<int>(type: "integer", nullable: false),
                    FlaggedImageId = table.Column<int>(type: "integer", nullable: false),
                    ReportReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ReportedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserReports_FlaggedImages_FlaggedImageId",
                        column: x => x.FlaggedImageId,
                        principalTable: "FlaggedImages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserReports_Users_ReportingUserId",
                        column: x => x.ReportingUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FlaggedImage_CasesStatus",
                table: "FlaggedImages",
                columns: new[] { "CueCaseId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FlaggedImage_CueStatus",
                table: "FlaggedImages",
                columns: new[] { "CueId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FlaggedImage_Hash",
                table: "FlaggedImages",
                column: "ImageHash");

            migrationBuilder.CreateIndex(
                name: "IX_FlaggedImage_Status",
                table: "FlaggedImages",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_FlaggedImage_UserId",
                table: "FlaggedImages",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FlaggedImages_AdminUserId",
                table: "FlaggedImages",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueue_BeingReviewed",
                table: "ModerationQueues",
                column: "IsBeingReviewed");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueue_Priority",
                table: "ModerationQueues",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueues_FlaggedImageId",
                table: "ModerationQueues",
                column: "FlaggedImageId");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueues_ReviewingAdminId",
                table: "ModerationQueues",
                column: "ReviewingAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReport_FlaggedImageId",
                table: "UserReports",
                column: "FlaggedImageId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReport_ReportingUserId",
                table: "UserReports",
                column: "ReportingUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModerationQueues");

            migrationBuilder.DropTable(
                name: "UserReports");

            migrationBuilder.DropTable(
                name: "FlaggedImages");

            migrationBuilder.DropColumn(
                name: "BanReason",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BannedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "HidePhone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsBanned",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "FlagReason",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ModeratedByUserId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ModerationNotes",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "FlagReason",
                table: "Cues");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "Cues");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "Cues");

            migrationBuilder.DropColumn(
                name: "ModeratedByUserId",
                table: "Cues");

            migrationBuilder.DropColumn(
                name: "ModerationNotes",
                table: "Cues");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Cues");

            migrationBuilder.DropColumn(
                name: "FlagReason",
                table: "CueCases");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "CueCases");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "CueCases");

            migrationBuilder.DropColumn(
                name: "ModeratedByUserId",
                table: "CueCases");

            migrationBuilder.DropColumn(
                name: "ModerationNotes",
                table: "CueCases");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "CueCases");
        }
    }
}
