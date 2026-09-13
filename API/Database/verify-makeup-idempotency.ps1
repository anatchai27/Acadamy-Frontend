param(
    [string]$DbHost = $env:TEST_MYSQL_HOST,
    [int]$Port = $(if ($env:TEST_MYSQL_PORT) { [int]$env:TEST_MYSQL_PORT } else { 3306 }),
    [string]$User = $env:TEST_MYSQL_USER,
    [string]$Database = $env:TEST_MYSQL_DATABASE
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
    throw 'The mysql client is required to run this staging migration verification.'
}

$query = @'
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'makeup_bookings'
     AND column_name = 'idempotency_key') AS idempotency_column,
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE()
     AND table_name = 'makeup_bookings'
     AND index_name = 'uq_makeup_booking_idempotency') AS idempotency_index;
'@

$previousPassword = $env:MYSQL_PWD
try {
    $env:MYSQL_PWD = $password
    $result = & mysql --protocol=TCP --host=$DbHost --port=$Port --user=$User --database=$Database --batch --skip-column-names --execute=$query
    if ($LASTEXITCODE -ne 0) {
        throw "mysql verification failed with exit code $LASTEXITCODE."
    }
}
finally {
    $env:MYSQL_PWD = $previousPassword
}

$values = ($result -split '\s+') | Where-Object { $_ -ne '' }
if ($values.Count -ne 2 -or $values[0] -ne '1' -or $values[1] -ne '1') {
    throw "makeup idempotency migration is not applied. Expected column/index counts 1/1, received '$result'."
}

'makeup idempotency migration verified: idempotency_key column and unique index are present.'
