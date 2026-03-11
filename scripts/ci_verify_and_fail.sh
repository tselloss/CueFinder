#!/usr/bin/env bash
set -euo pipefail

# CI verification wrapper: runs a set of safety queries and fails if any problematic
# counts are non-zero. Produces `verification_status.txt` with OK or FAIL for later
# jobs to consume.

PSQL_CMD=(psql -v ON_ERROR_STOP=1 -t -A -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}")

failed=0
output_lines=()

run_count_query() {
  local label="$1"; shift
  local sql="$1"; shift
  local cnt
  cnt="$(${PSQL_CMD[@]} -c "$sql")" || cnt=0
  cnt="$(echo "$cnt" | tr -d '\r' | tr -d '[:space:]')"
  output_lines+=("$label:$cnt")
  if [[ "$cnt" =~ ^[0-9]+$ ]] && [ "$cnt" -gt 0 ]; then
    echo "[WARN] $label -> $cnt"
    failed=1
  else
    echo "[OK] $label -> $cnt"
  fi
}

echo "Running verification queries..."

# Duplicate usernames/emails
run_count_query dup_usernames "SELECT COUNT(*) FROM (SELECT \"Username\" FROM \"Users\" GROUP BY \"Username\" HAVING COUNT(*) > 1) t;"
run_count_query dup_emails "SELECT COUNT(*) FROM (SELECT \"Email\" FROM \"Users\" GROUP BY \"Email\" HAVING COUNT(*) > 1) t;"
run_count_query dup_categories "SELECT COUNT(*) FROM (SELECT \"Name\" FROM \"Categories\" GROUP BY \"Name\" HAVING COUNT(*) > 1) t;"

# Orphaned user references
run_count_query orphan_notifications_userid "SELECT COUNT(*) FROM \"Notifications\" n LEFT JOIN \"Users\" u ON n.\"UserId\" = u.\"Id\" WHERE u.\"Id\" IS NULL;"
run_count_query orphan_notifications_triggeredby "SELECT COUNT(*) FROM \"Notifications\" n LEFT JOIN \"Users\" u ON n.\"TriggeredByUserId\" = u.\"Id\" WHERE n.\"TriggeredByUserId\" IS NOT NULL AND u.\"Id\" IS NULL;"
run_count_query orphan_discussions_createdby "SELECT COUNT(*) FROM \"Discussions\" d LEFT JOIN \"Users\" u ON d.\"CreatedByUserId\" = u.\"Id\" WHERE u.\"Id\" IS NULL;"
run_count_query orphan_posts_createdby "SELECT COUNT(*) FROM \"Posts\" p LEFT JOIN \"Users\" u ON p.\"CreatedByUserId\" = u.\"Id\" WHERE u.\"Id\" IS NULL;"
run_count_query orphan_postlikes_userid "SELECT COUNT(*) FROM \"PostLikes\" pl LEFT JOIN \"Users\" u ON pl.\"UserId\" = u.\"Id\" WHERE u.\"Id\" IS NULL;"
run_count_query orphan_postmentions_mentioneduser "SELECT COUNT(*) FROM \"PostMentions\" pm LEFT JOIN \"Users\" u ON pm.\"MentionedUserId\" = u.\"Id\" WHERE u.\"Id\" IS NULL;"

# NULL timestamps
run_count_query posts_null_createdat "SELECT COUNT(*) FROM \"Posts\" WHERE \"CreatedAt\" IS NULL;"
run_count_query discussions_null_createdat "SELECT COUNT(*) FROM \"Discussions\" WHERE \"CreatedAt\" IS NULL;"

# Write machine-readable status
if [ "$failed" -eq 0 ]; then
  echo "OK" > verification_status.txt
else
  echo "FAIL" > verification_status.txt
fi

echo "Verification summary:"
for line in "${output_lines[@]}"; do
  echo "  $line"
done

if [ "$failed" -eq 1 ]; then
  echo "One or more verification checks failed. See warnings above."
  exit 1
fi

echo "All verification checks passed. verification_status.txt written."
