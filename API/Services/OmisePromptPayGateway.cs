using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace academy_API.Services;

public sealed class OmiseOptions
{
    public const string SectionName = "Omise";

    public string SecretKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string PreviousWebhookSecret { get; set; } = string.Empty;
    public string ApiBaseUrl { get; set; } = "https://api.omise.co/";
    public string LiffId { get; set; } = string.Empty;
    public bool EnableInstallments { get; set; }
}

public sealed class OmisePromptPayGateway(
    HttpClient httpClient,
    IOptions<OmiseOptions> options) : IOmisePromptPayGateway
{
    private const decimal MinimumAmount = 20m;
    private const decimal MaximumAmount = 150_000m;
    private const int MaximumSignatureAgeSeconds = 300;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly OmiseOptions _options = options.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.SecretKey);
    public bool InstallmentsEnabled => IsConfigured && _options.EnableInstallments && !string.IsNullOrWhiteSpace(_options.LiffId);
    public bool IsInstallmentPlanAvailable(decimal amount, string bankType, int installmentTerm) =>
        InstallmentsEnabled
        && amount >= MinimumAmount
        && amount <= MaximumAmount
        && amount * 100m == decimal.Truncate(amount * 100m)
        && InstallmentPlans.TryGetValue(bankType, out var plan)
        && amount >= plan.MinimumAmount
        && plan.Terms.Contains(installmentTerm);

    public async Task<OmiseCharge> CreateChargeAsync(
        decimal amount,
        string referenceId,
        string description,
        CancellationToken ct = default)
    {
        var minorUnits = ToMinorUnits(amount);
        if (string.IsNullOrWhiteSpace(referenceId))
            throw new ArgumentException("A unique reference ID is required.", nameof(referenceId));

        using var request = CreateAuthorizedRequest(HttpMethod.Post, "charges");
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["amount"] = minorUnits.ToString(CultureInfo.InvariantCulture),
            ["currency"] = "THB",
            ["source[type]"] = "promptpay",
            ["ref_id"] = referenceId,
            ["description"] = description ?? string.Empty
        });

        return await SendAsync(request, ct);
    }

    public async Task<OmiseCharge> CreateInstallmentChargeAsync(
        decimal amount,
        string referenceId,
        string description,
        string bankType,
        int installmentTerm,
        int childId,
        long batchId,
        CancellationToken ct = default)
    {
        if (!InstallmentsEnabled)
            throw new InvalidOperationException("Omise installments are not enabled for this application.");
        if (!IsInstallmentPlanAvailable(amount, bankType, installmentTerm))
            throw new ArgumentOutOfRangeException(nameof(installmentTerm), "The selected installment plan is not available for this amount.");
        if (string.IsNullOrWhiteSpace(referenceId))
            throw new ArgumentException("A unique reference ID is required.", nameof(referenceId));
        if (childId <= 0 || batchId <= 0)
            throw new ArgumentOutOfRangeException(nameof(batchId), "A valid child and payment batch are required.");
        var returnUri = $"https://liff.line.me/{Uri.EscapeDataString(_options.LiffId)}/liff/payments/{childId}?paymentBatchId={batchId}";

        var amountInMinorUnits = ToMinorUnits(amount);
        using var sourceRequest = CreateAuthorizedRequest(HttpMethod.Post, "sources");
        sourceRequest.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["amount"] = amountInMinorUnits.ToString(CultureInfo.InvariantCulture),
            ["currency"] = "THB",
            ["type"] = bankType,
            ["installment_term"] = installmentTerm.ToString(CultureInfo.InvariantCulture)
        });
        var source = await SendAsync<OmiseSource>(sourceRequest, ct);

        using var chargeRequest = CreateAuthorizedRequest(HttpMethod.Post, "charges");
        chargeRequest.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["amount"] = amountInMinorUnits.ToString(CultureInfo.InvariantCulture),
            ["currency"] = "THB",
            ["source"] = source.Id,
            ["ref_id"] = referenceId,
            ["description"] = description ?? string.Empty,
            ["return_uri"] = returnUri
        });

        return await SendAsync(chargeRequest, ct);
    }

    public async Task<OmiseCharge> GetChargeAsync(string chargeId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(chargeId) || chargeId.Contains('/'))
            throw new ArgumentException("A valid Omise charge ID is required.", nameof(chargeId));

        using var request = CreateAuthorizedRequest(HttpMethod.Get, $"charges/{Uri.EscapeDataString(chargeId)}");
        return await SendAsync(request, ct);
    }

    public bool VerifyWebhookSignature(string timestamp, string signatures, byte[] rawBody)
    {
        if (string.IsNullOrWhiteSpace(timestamp)
            || string.IsNullOrWhiteSpace(signatures)
            || rawBody is null
            || !long.TryParse(timestamp, NumberStyles.None, CultureInfo.InvariantCulture, out var unixTimestamp))
            return false;

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (Math.Abs(now - unixTimestamp) > MaximumSignatureAgeSeconds)
            return false;

        var secrets = new[] { _options.WebhookSecret, _options.PreviousWebhookSecret }
            .Where(secret => !string.IsNullOrWhiteSpace(secret));
        if (!secrets.Any()) return false;

        var signedPayload = Encoding.UTF8.GetBytes($"{timestamp}.").Concat(rawBody).ToArray();
        var suppliedSignatures = signatures.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        foreach (var secret in secrets)
        {
            byte[] key;
            try
            {
                key = Convert.FromBase64String(secret);
            }
            catch (FormatException)
            {
                continue;
            }

            var expected = HMACSHA256.HashData(key, signedPayload);
            foreach (var supplied in suppliedSignatures)
            {
                try
                {
                    var actual = Convert.FromHexString(supplied);
                    if (actual.Length == expected.Length && CryptographicOperations.FixedTimeEquals(actual, expected))
                        return true;
                }
                catch (FormatException)
                {
                    // Ignore malformed signatures and check any rotated signature that follows.
                }
            }
        }

        return false;
    }

    private HttpRequestMessage CreateAuthorizedRequest(HttpMethod method, string path)
    {
        if (string.IsNullOrWhiteSpace(_options.SecretKey))
            throw new InvalidOperationException("Omise is not configured. Set Omise:SecretKey on the API server.");

        var baseUrl = Uri.TryCreate(_options.ApiBaseUrl, UriKind.Absolute, out var configuredBaseUrl)
            ? configuredBaseUrl
            : throw new InvalidOperationException("Omise:ApiBaseUrl must be an absolute URL.");
        if (baseUrl.Scheme != Uri.UriSchemeHttps && !baseUrl.IsLoopback)
            throw new InvalidOperationException("Omise:ApiBaseUrl must use HTTPS outside localhost.");

        var request = new HttpRequestMessage(method, new Uri(baseUrl, path));
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.SecretKey}:"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        return request;
    }

    private async Task<OmiseCharge> SendAsync(HttpRequestMessage request, CancellationToken ct)
        => await SendAsync<OmiseCharge>(request, ct);

    private async Task<T> SendAsync<T>(HttpRequestMessage request, CancellationToken ct)
    {
        using var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        var responseBody = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException(
                $"Omise API returned {(int)response.StatusCode} ({response.StatusCode}).",
                null,
                response.StatusCode);

        return JsonSerializer.Deserialize<T>(responseBody, JsonOptions)
            ?? throw new InvalidOperationException("Omise returned an empty or invalid response.");
    }

    private static long ToMinorUnits(decimal amount)
    {
        if (amount < MinimumAmount || amount > MaximumAmount)
            throw new ArgumentOutOfRangeException(nameof(amount), $"PromptPay amount must be between {MinimumAmount} and {MaximumAmount} THB.");

        var minorUnits = amount * 100m;
        if (minorUnits != decimal.Truncate(minorUnits))
            throw new ArgumentOutOfRangeException(nameof(amount), "PromptPay amount cannot have fractions smaller than one satang.");

        return decimal.ToInt64(minorUnits);
    }

    private static readonly IReadOnlyDictionary<string, (int MinimumAmount, int[] Terms)> InstallmentPlans =
        new Dictionary<string, (int, int[])>(StringComparer.Ordinal)
        {
            ["installment_bay"] = (500, [3, 4, 6, 9, 10]),
            ["installment_bbl"] = (500, [3, 4, 5, 6, 7, 8, 9, 10]),
            ["installment_first_choice"] = (300, [3, 4, 6, 9, 10, 12, 18, 24, 36]),
            ["installment_kbank"] = (0, [3, 4, 6, 10]),
            ["installment_ktc"] = (0, [3, 4, 5, 6, 7, 8, 9, 10]),
            ["installment_scb"] = (500, [3, 4, 6, 9, 10]),
            ["installment_uob"] = (500, [3, 4, 6, 10]),
            ["installment_ttb"] = (500, [3, 4, 6, 10])
        };
}

public sealed record OmiseSource([property: JsonPropertyName("id")] string Id);

public sealed record OmiseCharge(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("amount")] long Amount,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("ref_id")] string? ReferenceId,
    [property: JsonPropertyName("expires_at")] DateTimeOffset? ExpiresAt,
    [property: JsonPropertyName("source")] OmiseChargeSource? Source,
    [property: JsonPropertyName("paid")] bool Paid = false,
    [property: JsonPropertyName("authorize_uri")] string? AuthorizeUri = null);

public sealed record OmiseChargeSource(
    [property: JsonPropertyName("type")] string? Type,
    [property: JsonPropertyName("scannable_code")] OmiseScannableCode? ScannableCode);

public sealed record OmiseScannableCode(
    [property: JsonPropertyName("type")] string? Type,
    [property: JsonPropertyName("image")] OmiseQrImage? Image);

public sealed record OmiseQrImage(
    [property: JsonPropertyName("download_uri")] string? DownloadUri);