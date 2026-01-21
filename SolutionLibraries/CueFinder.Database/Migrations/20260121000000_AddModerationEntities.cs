using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    IsAIFlagged = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    AdminUserId = table.Column<int>(type: "integer", nullable: true),
                    FlaggedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
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
                    UserReportCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsBeingReviewed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ReviewingAdminId = table.Column<int>(type: "integer", nullable: true),
                    ReviewStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AddedToQueueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
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
                    ReportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
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
                name: "IX_ModerationQueue_BeingReviewed",
                table: "ModerationQueues",
                column: "IsBeingReviewed");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueue_Priority",
                table: "ModerationQueues",
                column: "Priority");

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
        }
    }
}
