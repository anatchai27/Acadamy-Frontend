param(
    [string]$DbHost = $env:TEST_MYSQL_HOST,
    [int]$Port = $(if ($env:TEST_MYSQL_PORT) { [int]$env:TEST_MYSQL_PORT } else { 3306 }),
    [string]$User = $env:TEST_MYSQL_USER,
    [string]$Database = $env:TEST_MYSQL_DATABASE,
    [string]$OutputFile = "$(Join-Path $PSScriptRoot '..\..\Objective\attendance-p1-result.txt')"
)

$ErrorActionPreference = 'Stop'
$password = $env:TEST_MYSQL_PASSWORD

if ([string]::IsNullOrWhiteSpace($DbHost) -or
    [string]::IsNullOrWhiteSpace($User) -or
    [string]::IsNullOrWhiteSpace($Database) -or
    [string]::IsNullOrWhiteSpace($password)) {
    throw 'Set TEST_MYSQL_HOST, TEST_MYSQL_PORT (optional), TEST_MYSQL_USER, TEST_MYSQL_PASSWORD and TEST_MYSQL_DATABASE.'
}

if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
    throw 'The mysql client is required to run attendance verification.'
}

$query = @'
SELECT 'database_version' AS check_name, CONCAT(DATABASE(), ' / ', VERSION()) AS result
UNION ALL
SELECT 'attendance_unique_constraint', CAST(COUNT(*) AS CHAR)
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'attendances'
  AND INDEX_NAME = 'uq_attendance_session_student'
  AND SEQ_IN_INDEX IN (1, 2)
UNION ALL
SELECT 'duplicate_attendance_rows', CAST(COUNT(*) AS CHAR)
FROM (
  SELECT session_id, student_id
  FROM attendances
  GROUP BY session_id, student_id
  HAVING COUNT(*) > 1
) AS duplicates
UNION ALL
SELECT 'orphan_attendance_rows', CAST(COUNT(*) AS CHAR)
FROM attendances AS a
LEFT JOIN sessions AS s ON s.id = a.session_id
LEFT JOIN students AS st ON st.id = a.student_id
WHERE s.id IS NULL OR st.id IS NULL
UNION ALL
SELECT 'negative_enrollment_quota', CAST(COUNT(*) AS CHAR)
FROM enrollments
WHERE sessions_remaining < 0
UNION ALL
SELECT 'missing_pickup_authorization_rows', CAST(COUNT(*) AS CHAR)
FROM attendances AS a
LEFT JOIN student_pickup_authorizations AS p ON p.id = a.pickup_authorization_id
WHERE a.pickup_authorization_id IS NOT NULL AND p.id IS NULL;
'@

$previousPassword = $env:MYSQL_PWD
try {
    $env:MYSQL_PWD = $password
    $result = & mysql --protocol=TCP --host=$DbHost --port=$Port --user=$User --database=$Database --batch --raw --execute=$query
    if ($LASTEXITCODE -ne 0) {
        throw "attendance verification failed with exit code $LASTEXITCODE."
    }
}
finally {
    $env:MYSQL_PWD = $previousPassword
}

$result | Set-Content -LiteralPath $OutputFile -Encoding utf8
$result
"Attendance P1 verification written to $OutputFile"
