using academy_API.DTOs;
using academy_API.Services;
using Moq;

namespace academy_API.Tests.unitTest;

public class SkillScoreServiceTests
{
    private static Mock<academy_API.Repositories.ISkillScoreRepository> CreateMockRepo() => new();

    // 1
    [Fact]
    public async Task BatchUpdateAsync_ValidScores_CallsBatchUpsert()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.BatchUpsertAsync(10, It.IsAny<List<SkillScoreItem>>(), 42, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = new SkillScoreService(repoMock.Object);
        var result = await sut.BatchUpdateAsync(new BatchSkillScoreRequest(10, [
            new SkillScoreItem(1, 4.5m, null),
            new SkillScoreItem(2, 3.0m, "good")
        ]), 1, 42);

        Assert.Equal("success", result.Status);
        repoMock.Verify(r => r.BatchUpsertAsync(10, It.IsAny<List<SkillScoreItem>>(), 42, It.IsAny<CancellationToken>()), Times.Once);
    }

    // 2
    [Fact]
    public async Task BatchUpdateAsync_EmptyScores_ThrowsException()
    {
        var sut = new SkillScoreService(CreateMockRepo().Object);
        var ex = await Assert.ThrowsAsync<SkillScoreValidationException>(
            () => sut.BatchUpdateAsync(new BatchSkillScoreRequest(10, []), 1, 42));
        Assert.Equal("NO_SCORES", ex.ErrorCode);
    }

    // 3
    [Fact]
    public async Task CreateTopicAsync_ValidRequest_CallsCreate()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.CreateTopicAsync(It.IsAny<Models.SkillTopic>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = new SkillScoreService(repoMock.Object);
        await sut.CreateTopicAsync(new SkillTopicRequest(1, "ความเข้าใจ", 1));

        repoMock.Verify(r => r.CreateTopicAsync(It.Is<Models.SkillTopic>(t => t.Name == "ความเข้าใจ" && t.OrderIndex == 1), It.IsAny<CancellationToken>()), Times.Once);
    }

    // 4
    [Fact]
    public async Task CreateTopicAsync_EmptyName_ThrowsException()
    {
        var sut = new SkillScoreService(CreateMockRepo().Object);
        var ex = await Assert.ThrowsAsync<SkillScoreValidationException>(
            () => sut.CreateTopicAsync(new SkillTopicRequest(1, "", 1)));
        Assert.Equal("NAME_REQUIRED", ex.ErrorCode);
    }

    // 5
    [Fact]
    public async Task GetByStudentIdAsync_ReturnsScores()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetByStudentIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new SkillScoreDetailItem(1, 1, "ความเข้าใจ", 4.0m, null, DateTime.UtcNow)]);

        var sut = new SkillScoreService(repoMock.Object);
        var result = await sut.GetByStudentIdAsync(10);

        Assert.Equal("success", result.Status);
        Assert.Single(result.Data.Scores);
        Assert.Equal("ความเข้าใจ", result.Data.Scores[0].TopicName);
    }

    // 6
    [Fact]
    public async Task GetTopicsByCourseIdAsync_ReturnsTopics()
    {
        var repoMock = CreateMockRepo();
        repoMock.Setup(r => r.GetTopicsByCourseIdDtoAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync([new SkillTopicItem(1, "ความเข้าใจ", 1), new SkillTopicItem(2, "การมีส่วนร่วม", 2)]);

        var sut = new SkillScoreService(repoMock.Object);
        var result = await sut.GetTopicsByCourseIdAsync(1);

        Assert.Equal("success", result.Status);
        Assert.Equal(2, result.Data.Topics.Count);
    }
}
