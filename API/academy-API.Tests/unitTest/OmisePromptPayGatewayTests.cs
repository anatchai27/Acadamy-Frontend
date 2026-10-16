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
        string webhookSecret = "") =>
        new(new HttpClient(handler), Options.Create(new OmiseOptions
        {
            SecretKey = secretKey,
            WebhookSecret = webhookSecret
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
