using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CueFinder.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddCueSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CueSets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false, defaultValue: ""),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "good"),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false, defaultValue: ""),
                    IncludesPlayingCue = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IncludesBreakCue = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IncludesJumpCue = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IncludesCase = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    PlayingCueWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    PlayingCueLength = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    PlayingCueTipSize = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    PlayingCueShaftMaterial = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PlayingCueButtMaterial = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BreakCueWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    BreakCueLength = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    BreakCueTipSize = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    BreakCueShaftMaterial = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BreakCueButtMaterial = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    JumpCueWeight = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    JumpCueLength = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    JumpCueTipSize = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    JumpCueShaftMaterial = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    JumpCueButtMaterial = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CaseCapacity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CaseOpening = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CaseType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CaseColor = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CaseMaterial = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Features = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    IsSold = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    SoldDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ViewCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    AverageRating = table.Column<decimal>(type: "numeric(3,2)", nullable: false, defaultValue: 0m),
                    RatingCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'"),
                    IsFlagged = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FlagReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ModerationStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "approved"),
                    ModeratedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ModeratedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ModerationNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    LastPromptedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastUserResponseAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsHidden = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    HiddenAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CueSets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CueSets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CueSetImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CueSetId = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW() AT TIME ZONE 'UTC'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CueSetImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CueSetImages_CueSets_CueSetId",
                        column: x => x.CueSetId,
                        principalTable: "CueSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CueSet_UserId",
                table: "CueSets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CueSet_CreatedAt",
                table: "CueSets",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CueSet_IsSold",
                table: "CueSets",
                column: "IsSold");

            migrationBuilder.CreateIndex(
                name: "IX_CueSetImage_CueSetId",
                table: "CueSetImages",
                column: "CueSetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "CueSetImages");
            migrationBuilder.DropTable(name: "CueSets");
        }
    }
}
