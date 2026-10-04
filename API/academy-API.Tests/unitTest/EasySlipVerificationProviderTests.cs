using System.Net;
using System.Text;
using academy_API.Services;
using Microsoft.Extensions.Options;

namespace academy_API.Tests.unitTest;

public class EasySlipVerificationProviderTests
{
    [Fact]
    public async Task VerifyAsync_SendsExpectedAmountAndDuplicateCheck()
    {
        string? authorizationScheme = null;
        string? authorizationParameter = null;
        string? requestBody = null;
        var handler = new StubHandler(async (request, ct) =>
        {
            authorizationScheme = request.Headers.Authorization?.Scheme;
            authorizationParameter = request.Headers.Authorization?.Parameter;
            requestBody = await request.Content!.ReadAsStringAsync(ct);
            return JsonResponse("""
                {
                  "success": true,
                  "data": {
                    "isDuplicate": false,
                    "isAmountMatched": true,
                    "amountInSlip": 1200.00,
                    "rawSlip": { "transRef": "REF-5" }
                  }
                }
                """);
        });
        var client = new HttpClient(handler);
        var provider = new EasySlipVerificationProvider(
            client,
            Options.Create(new EasySlipOptions { ApiKey = "test-key" }));

        var result = await provider.VerifyAsync("https://storage.example/slip.png", 1200m);

        Assert.True(result.IsVerified);
        Assert.Equal(1200m, result.Amount);
        Assert.Equal("REF-5", result.Reference);
        Assert.Equal("easyslip", result.Provider);
        Assert.Equal("Bearer", authorizationScheme);
        Assert.Equal("test-key", authorizationParameter);
        Assert.Contains("\"matchAmount\":1200", requestBody);
        Assert.Contains("\"checkDuplicate\":true", requestBody);
    }

    [Fact]
    public async Task VerifyAsync_DuplicateSlipReturnsDuplicateResult()
    {
        var provider = new EasySlipVerificationProvider(
            new HttpClient(new StubHandler((_, _) => Task.FromResult(JsonResponse("""
                {
                  "success": true,
                  "data": {
                    "isDuplicate": true,
                    "amountInSlip": 1200,
                    "rawSlip": { "transRef": "REF-5" }
                  }
                }
                """)))),
            Options.Create(new EasySlipOptions { ApiKey = "test-key" }));

        var result = await provider.VerifyAsync("https://storage.example/slip.png", 1200m);

        Assert.False(result.IsVerified);
        Assert.True(result.IsDuplicate);
        Assert.Equal("REF-5", result.Reference);
    }

    [Fact]
    public async Task VerifyAsync_WithoutApiKeyFailsClosed()
    {
        var handler = new StubHandler((_, _) => throw new InvalidOperationException("No request expected."));
        var provider = new EasySlipVerificationProvider(
            new HttpClient(handler),
            Options.Create(new EasySlipOptions()));

        var result = await provider.VerifyAsync("https://storage.example/slip.png", 1200m);

        Assert.False(result.IsVerified);
        Assert.Contains("not configured", result.Reason);
    }

    private static HttpResponseMessage JsonResponse(string json) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };

    private sealed class StubHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            send(request, cancellationToken);
    }
}
