using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace academy_API.Services;

public sealed class EasySlipOptions
{
    public const string SectionName = "EasySlip";
    public string ApiKey { get; set; } = string.Empty;
    public string VerifyBankUrl { get; set; } = "https://api.easyslip.com/v2/verify/bank";
}

public sealed class EasySlipVerificationProvider(
    HttpClient httpClient,
    IOptions<EasySlipOptions> options) : ISlipVerificationProvider
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly EasySlipOptions _options = options.Value;

    public async Task<SlipVerificationResult> VerifyAsync(
        string slipUrl,
        decimal expectedAmount,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            return Unavailable("EasySlip API key is not configured.");

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.VerifyBankUrl)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    url = slipUrl,
                    matchAmount = expectedAmount,
                    checkDuplicate = true
                }),
                Encoding.UTF8,
                "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        try
        {
            using var response = await _httpClient.SendAsync(request, ct);
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var root = document.RootElement;
            var rawPayload = root.Clone();

            if (!response.IsSuccessStatusCode || !TryGetBoolean(root, "success", out var success) || !success)
            {
                var reason = TryGetString(root, "error", "message") ?? "EasySlip could not verify the slip.";
                return new SlipVerificationResult(false, null, null, reason, "easyslip", rawPayload);
            }

            if (!root.TryGetProperty("data", out var data))
                return new SlipVerificationResult(false, null, null, "EasySlip returned no verification data.", "easyslip", rawPayload);

            var amount = TryGetDecimal(data, "amountInSlip");
            var reference = TryGetString(data, "rawSlip", "transRef");
            var isDuplicate = TryGetBoolean(data, "isDuplicate", out var duplicate) && duplicate;
            return new SlipVerificationResult(
                !isDuplicate,
                amount,
                reference,
                isDuplicate ? "สลิปนี้ถูกใช้แล้ว" : "ตรวจสลิปสำเร็จ",
                "easyslip",
                rawPayload,
                isDuplicate);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            return Unavailable("EasySlip verification timed out.");
        }
        catch (HttpRequestException)
        {
            return Unavailable("EasySlip verification is temporarily unavailable.");
        }
        catch (JsonException)
        {
            return Unavailable("EasySlip returned an invalid response.");
        }
    }

    private static SlipVerificationResult Unavailable(string reason) =>
        new(false, null, null, reason, "easyslip");

    private static bool TryGetBoolean(JsonElement element, string property, out bool value)
    {
        value = false;
        if (element.ValueKind != JsonValueKind.Object
            || !element.TryGetProperty(property, out var propertyValue)
            || propertyValue.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
            return false;

        value = propertyValue.GetBoolean();
        return true;
    }

    private static decimal? TryGetDecimal(JsonElement element, string property) =>
        element.ValueKind == JsonValueKind.Object
        && element.TryGetProperty(property, out var value)
        && value.TryGetDecimal(out var amount)
            ? amount
            : null;

    private static string? TryGetString(JsonElement element, params string[] path)
    {
        foreach (var property in path)
        {
            if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(property, out element))
                return null;
        }

        return element.ValueKind == JsonValueKind.String ? element.GetString() : null;
    }
}
