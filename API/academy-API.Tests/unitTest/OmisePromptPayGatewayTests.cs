using System.Net;
using System.Security.Cryptography;
using System.Text;
using academy_API.Services;
using Microsoft.Extensions.Options;

namespace academy_API.Tests.unitTest;

public class OmisePromptPayGatewayTests
{
    [Fact]
    public async Task CreateChargeAsync_SendsPromptPayChargeWithMinorUnitsAndRefId()
    {
        var handler = new StubHttpMessageHandler((request, _) =>
        {
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("https://api.omise.co/charges", request.RequestUri?.ToString());
            Assert.Equal("Basic", request.Headers.Authorization?.Scheme);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"id":"chrg_test_123","amount":2500,"currency":"THB","status":"pending","ref_id":"INV-1","expires_at":"2026-10-11T12:00:00Z","source":{"type":"promptpay","scannable_code":{"type":"qr","image":{"download_uri":"https://api.omise.co/qr.svg"}}}}""", Encoding.UTF8, "application/json")
            });
        });
        var gateway = CreateGateway(handler);

        var charge = await gateway.CreateChargeAsync(25m, "INV-1", "Course fee");

        Assert.Equal("chrg_test_123", charge.Id);
        Assert.Equal(2500, charge.Amount);
        Assert.Equal("promptpay", charge.Source?.Type);
        Assert.Equal("https://api.omise.co/qr.svg", charge.Source?.ScannableCode?.Image?.DownloadUri);
        Assert.Contains("amount=2500", handler.RequestBody);
        Assert.Contains("source%5Btype%5D=promptpay", handler.RequestBody);
        Assert.Contains("ref_id=INV-1", handler.RequestBody);
    }

    [Fact]
    public async Task CreateInstallmentChargeAsync_CreatesSourceThenHostedChargeWithoutCardData()
    {
        var responses = new Queue<string>([
            "{\"id\":\"src_test_installment\"}",
            "{\"id\":\"chrg_test_installment\",\"amount\":125000,\"currency\":\"THB\",\"status\":\"pending\",\"ref_id\":\"INV-1\",\"authorize_uri\":\"https://pay.omise.co/authorize/123\"}"
        ]);
        var requests = new List<(string Path, string Body)>();
        StubHttpMessageHandler? handler = null;
        handler = new StubHttpMessageHandler((request, _) =>
        {
            requests.Add((request.RequestUri!.AbsolutePath, handler!.RequestBody));
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responses.Dequeue(), Encoding.UTF8, "application/json")
            });
        });
        var gateway = CreateGateway(handler, liffId: "2010927966-test", enableInstallments: true);

        var charge = await gateway.CreateInstallmentChargeAsync(1250m, "INV-1", "Tuition fee", "installment_kbank", 3, 20, 91);

        Assert.Equal("chrg_test_installment", charge.Id);
        Assert.Equal("https://pay.omise.co/authorize/123", charge.AuthorizeUri);
        Assert.Equal(2, requests.Count);
        Assert.Equal("/sources", requests[0].Path);
        Assert.Contains("type=installment_kbank", requests[0].Body);
        Assert.Contains("installment_term=3", requests[0].Body);
        Assert.Equal("/charges", requests[1].Path);
        Assert.Contains("source=src_test_installment", requests[1].Body);
        Assert.Contains("return_uri=https%3A%2F%2Fliff.line.me%2F2010927966-test%2Fliff%2Fpayments%2F20%3FpaymentBatchId%3D91", requests[1].Body);
        Assert.DoesNotContain("card_number", requests[1].Body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cvv", requests[1].Body, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(19.99)]
    [InlineData(150000.01)]
    [InlineData(20.001)]
    public async Task CreateChargeAsync_InvalidAmount_Throws(decimal amount)
    {
        var gateway = CreateGateway(new StubHttpMessageHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            gateway.CreateChargeAsync(amount, "INV-1", "Course fee"));
    }

    [Fact]
    public async Task CreateChargeAsync_WithoutSecretKey_FailsClosed()
    {
        var gateway = CreateGateway(new StubHttpMessageHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))), secretKey: "");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            gateway.CreateChargeAsync(20m, "INV-1", "Course fee"));
    }

    [Fact]
    public void IsInstallmentPlanAvailable_RequiresEnabledFeatureAndSupportedBankTerms()
    {
        var gateway = CreateGateway(new StubHttpMessageHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))), liffId: "2010927966-test", enableInstallments: true);

        Assert.True(gateway.IsInstallmentPlanAvailable(1200m, "installment_kbank", 3));
        Assert.False(gateway.IsInstallmentPlanAvailable(499m, "installment_bay", 3));
        Assert.False(gateway.IsInstallmentPlanAvailable(1200m, "installment_bay", 5));
    }

    [Fact]
    public void VerifyWebhookSignature_AcceptsValidSignatureAndRejectsStaleTimestamp()
    {
        var key = RandomNumberGenerator.GetBytes(32);
        var secret = Convert.ToBase64String(key);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var body = Encoding.UTF8.GetBytes("{\"key\":\"charge.complete\"}");
        var signedPayload = Encoding.UTF8.GetBytes($"{timestamp}.").Concat(body).ToArray();
        var signature = Convert.ToHexString(HMACSHA256.HashData(key, signedPayload)).ToLowerInvariant();
        var gateway = CreateGateway(new StubHttpMessageHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))), webhookSecret: secret);

        Assert.True(gateway.VerifyWebhookSignature(timestamp, signature, body));
        Assert.False(gateway.VerifyWebhookSignature("1", signature, body));
        Assert.False(gateway.VerifyWebhookSignature(timestamp, "not-a-signature", body));
    }

    private static OmisePromptPayGateway CreateGateway(
        HttpMessageHandler handler,
        string secretKey = "skey_test_value",
        string webhookSecret = "",
        string liffId = "",
        bool enableInstallments = false) =>
        new(new HttpClient(handler), Options.Create(new OmiseOptions
        {
            SecretKey = secretKey,
            WebhookSecret = webhookSecret,
            LiffId = liffId,
            EnableInstallments = enableInstallments
        }));

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send) : HttpMessageHandler
    {
        public string RequestBody { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestBody = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return await send(request, cancellationToken);
        }
    }
}
