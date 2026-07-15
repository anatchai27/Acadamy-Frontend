using System.IdentityModel.Tokens.Jwt;
using academy_API.Models;
using academy_API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace academy_API.Tests.unitTest;

public class TokenServiceTests
{
    private static IConfiguration CreateConfig(string? key = null, string? issuer = null, string? audience = null, string? expiry = null)
    {
        var settings = new Dictionary<string, string?>
        {
            { "Jwt:Key", key ?? "ThisIsASuperSecretKeyForJWTSigningThatMustBeAtLeast32CharactersLong!" },
            { "Jwt:Issuer", issuer ?? "academy-api" },
            { "Jwt:Audience", audience ?? "academy-api-client" },
            { "Jwt:ExpiryInMinutes", expiry ?? "60" }
        };

        return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    }

    private static IConfiguration CreateConfigWithout(params string[] keysToOmit)
    {
        var all = new Dictionary<string, string?>
        {
            { "Jwt:Key", "ThisIsASuperSecretKeyForJWTSigningThatMustBeAtLeast32CharactersLong!" },
            { "Jwt:Issuer", "academy-api" },
            { "Jwt:Audience", "academy-api-client" },
            { "Jwt:ExpiryInMinutes", "60" }
        };
        foreach (var k in keysToOmit) all.Remove(k);
        return new ConfigurationBuilder().AddInMemoryCollection(all).Build();
    }

    private static User CreateTestUser(int id = 1, string email = "test@example.com", UserRole role = UserRole.student) => new()
    {
        Id = id,
        Email = email,
        Role = role
    };

    private static JwtSecurityToken ParseToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        return handler.ReadJwtToken(token);
    }

    // 1 ──────────────────── GenerateToken ────────────────────

    [Fact]
    public void GenerateToken_ValidUser_ReturnsNonEmptyToken()
    {
        var config = CreateConfig();
        var service = new TokenService(config);
        var token = service.GenerateToken(CreateTestUser());
        Assert.False(string.IsNullOrEmpty(token));
    }

    // 2
    [Fact]
    public void GenerateToken_MissingJwtKey_ThrowsInvalidOperationException()
    {
        var config = new ConfigurationBuilder().Build();
        var service = new TokenService(config);
        Assert.Throws<InvalidOperationException>(() => service.GenerateToken(CreateTestUser()));
    }

    // 3
    [Fact]
    public void GenerateToken_TokenContainsCorrectClaims()
    {
        var service = new TokenService(CreateConfig());
        var user = CreateTestUser();
        var jwt = ParseToken(service.GenerateToken(user));

        Assert.Equal("1", jwt.Claims.First(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier").Value);
        Assert.Equal("test@example.com", jwt.Claims.First(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress").Value);
        Assert.Equal("student", jwt.Claims.First(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role").Value);
    }

    // 4
    [Fact]
    public void GenerateToken_TokenHasThreeSegments()
    {
        var service = new TokenService(CreateConfig());
        var token = service.GenerateToken(CreateTestUser());
        Assert.Equal(3, token.Split('.').Length);
    }

    // 5
    [Fact]
    public void GenerateToken_UsesCorrectIssuer()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser()));
        Assert.Equal("academy-api", jwt.Issuer);
    }

    // 6
    [Fact]
    public void GenerateToken_UsesCorrectAudience()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser()));
        Assert.Contains("academy-api-client", jwt.Audiences);
    }

    // 7
    [Fact]
    public void GenerateToken_TokenExpiresInConfiguredMinutes()
    {
        var config = CreateConfig(expiry: "30");
        var service = new TokenService(config);
        var jwt = ParseToken(service.GenerateToken(CreateTestUser()));

        var expectedExpiry = DateTime.UtcNow.AddMinutes(30);
        Assert.True(Math.Abs((expectedExpiry - jwt.ValidTo).TotalSeconds) < 5);
    }

    // 8
    [Fact]
    public void GenerateToken_AdminUser_HasAdminRoleClaim()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser(role: UserRole.admin)));
        Assert.Equal("admin", jwt.Claims.First(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role").Value);
    }

    // 9
    [Fact]
    public void GenerateToken_TeacherUser_HasTeacherRoleClaim()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser(role: UserRole.teacher)));
        Assert.Equal("teacher", jwt.Claims.First(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role").Value);
    }

    // 10
    [Fact]
    public void GenerateToken_ParentUser_HasParentRoleClaim()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser(role: UserRole.parent)));
        Assert.Equal("parent", jwt.Claims.First(c => c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role").Value);
    }

    // 11
    [Fact]
    public void GenerateToken_MissingIssuer_ThrowsException()
    {
        var config = CreateConfigWithout("Jwt:Issuer");
        var service = new TokenService(config);
        Assert.Throws<InvalidOperationException>(() => service.GenerateToken(CreateTestUser()));
    }

    // 12
    [Fact]
    public void GenerateToken_MissingAudience_ThrowsException()
    {
        var config = CreateConfigWithout("Jwt:Audience");
        var service = new TokenService(config);
        Assert.Throws<InvalidOperationException>(() => service.GenerateToken(CreateTestUser()));
    }

    // 13
    [Fact]
    public void GenerateToken_MissingExpiry_UsesDefault60()
    {
        var config = CreateConfig(expiry: null);
        var service = new TokenService(config);
        var jwt = ParseToken(service.GenerateToken(CreateTestUser()));

        var expectedExpiry = DateTime.UtcNow.AddMinutes(60);
        Assert.True(Math.Abs((expectedExpiry - jwt.ValidTo).TotalSeconds) < 5);
    }

    // 14
    [Fact]
    public void GenerateToken_TokenHasJtiClaim()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser()));
        Assert.NotNull(jwt.Id);
        Assert.NotEmpty(jwt.Id);
    }

    // 15
    [Fact]
    public void GenerateToken_EachCall_ProducesUniqueJti()
    {
        var service = new TokenService(CreateConfig());
        var jti1 = ParseToken(service.GenerateToken(CreateTestUser())).Id;
        var jti2 = ParseToken(service.GenerateToken(CreateTestUser())).Id;
        Assert.NotEqual(jti1, jti2);
    }

    // 16
    [Fact]
    public void GenerateToken_ZeroIdUser_StillGeneratesToken()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser(id: 0)));
        Assert.Equal("0", jwt.Claims.First(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier").Value);
    }

    // 17
    [Fact]
    public void GenerateToken_SpecialCharEmail_EncodedInToken()
    {
        var service = new TokenService(CreateConfig());
        var user = CreateTestUser(email: "user+test@sub.domain.com");
        var jwt = ParseToken(service.GenerateToken(user));
        Assert.Equal("user+test@sub.domain.com", jwt.Claims.First(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress").Value);
    }

    // 18
    [Fact]
    public void GenerateToken_UsesHmacSha256Algorithm()
    {
        var service = new TokenService(CreateConfig());
        var jwt = ParseToken(service.GenerateToken(CreateTestUser()));
        Assert.Equal("HS256", jwt.SignatureAlgorithm);
    }

    // 19
    [Fact]
    public void GenerateToken_DifferentUsers_ProduceDifferentTokens()
    {
        var service = new TokenService(CreateConfig());
        var token1 = service.GenerateToken(CreateTestUser(id: 1));
        var token2 = service.GenerateToken(CreateTestUser(id: 2));
        Assert.NotEqual(token1, token2);
    }

    // 20
    [Fact]
    public void GenerateToken_TokenIsValidatableWithSameKey()
    {
        var key = "ThisIsASuperSecretKeyForJWTSigningThatMustBeAtLeast32CharactersLong!";
        var config = CreateConfig(key: key);
        var service = new TokenService(config);
        var token = service.GenerateToken(CreateTestUser());

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidIssuer = "academy-api",
            ValidateAudience = true, ValidAudience = "academy-api-client",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(key))
        };

        var principal = new JwtSecurityTokenHandler().ValidateToken(token, validationParams, out _);
        Assert.NotNull(principal);
    }

    // 21 ──────────────────── HashPassword ────────────────────

    [Fact]
    public void HashPassword_ReturnsNonEmptyString()
    {
        var service = new TokenService(CreateConfig());
        var hash = service.HashPassword("Test1234!");
        Assert.False(string.IsNullOrEmpty(hash));
        Assert.StartsWith("$2", hash);
    }

    // 22
    [Fact]
    public void HashPassword_SameInput_ProducesDifferentHash()
    {
        var service = new TokenService(CreateConfig());
        var hash1 = service.HashPassword("Test1234!");
        var hash2 = service.HashPassword("Test1234!");
        Assert.NotEqual(hash1, hash2);
    }

    // 23
    [Fact]
    public void HashPassword_DifferentPasswords_ProduceDifferentHashes()
    {
        var service = new TokenService(CreateConfig());
        var hash1 = service.HashPassword("Password1!");
        var hash2 = service.HashPassword("Password2!");
        Assert.NotEqual(hash1, hash2);
    }

    // 24
    [Fact]
    public void HashPassword_EmptyString_ReturnsHash()
    {
        var service = new TokenService(CreateConfig());
        var hash = service.HashPassword("");
        Assert.False(string.IsNullOrEmpty(hash));
    }

    // 25
    [Fact]
    public void HashPassword_LongPassword_ReturnsHash()
    {
        var service = new TokenService(CreateConfig());
        var longPwd = new string('x', 100);
        var hash = service.HashPassword(longPwd);
        Assert.StartsWith("$2", hash);
    }

    // 26
    [Fact]
    public void HashPassword_UnicodePassword_ReturnsHash()
    {
        var service = new TokenService(CreateConfig());
        var hash = service.HashPassword("รหัสผ่าน@123!");
        Assert.StartsWith("$2", hash);
    }

    // 27 ──────────────────── VerifyPassword ────────────────────

    [Fact]
    public void VerifyPassword_CorrectPassword_ReturnsTrue()
    {
        var service = new TokenService(CreateConfig());
        var hash = service.HashPassword("Test1234!");
        Assert.True(service.VerifyPassword("Test1234!", hash));
    }

    // 28
    [Fact]
    public void VerifyPassword_WrongPassword_ReturnsFalse()
    {
        var service = new TokenService(CreateConfig());
        var hash = service.HashPassword("Test1234!");
        Assert.False(service.VerifyPassword("WrongPass!", hash));
    }

    // 29
    [Fact]
    public void VerifyPassword_NullPassword_ThrowsArgumentNullException()
    {
        var service = new TokenService(CreateConfig());
        var hash = service.HashPassword("Test1234!");
        Assert.Throws<ArgumentNullException>(() => service.VerifyPassword(null!, hash));
    }

    // 30
    [Fact]
    public void VerifyPassword_CaseSensitive_FailsOnDifferentCase()
    {
        var service = new TokenService(CreateConfig());
        var hash = service.HashPassword("Test1234!");
        Assert.False(service.VerifyPassword("test1234!", hash));
    }
}
