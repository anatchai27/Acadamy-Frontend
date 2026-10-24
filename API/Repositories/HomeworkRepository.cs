using academy_API.Data;
using academy_API.DTOs;
using academy_API.Models;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Repositories;

public class HomeworkRepository(TutoringDbContext context) : IHomeworkRepository
{
    private readonly TutoringDbContext _context = context;

    public Task<int?> GetTeacherIdByUserIdAsync(int userId, CancellationToken ct = default) =>
        _context.Teachers
            .Where(teacher => teacher.UserId == userId)
            .Select(teacher => (int?)teacher.Id)
            .FirstOrDefaultAsync(ct);

    public Task<int?> GetCourseInstituteIdAsync(int courseId, CancellationToken ct = default) =>
        _context.Courses
            .Where(course => course.Id == courseId)
            .Select(course => (int?)course.InstituteId)
            .FirstOrDefaultAsync(ct);

    public async Task<Homework> CreateAsync(Homework homework, CancellationToken ct = default)
    {
        _context.Homeworks.Add(homework);
        await _context.SaveChangesAsync(ct);
        return homework;
    }

    public async Task<List<HomeworkItem>> GetByCourseIdAsync(int courseId, CancellationToken ct = default)
    {
        return await _context.Homeworks
            .Where(h => h.CourseId == courseId)
            .OrderByDescending(h => h.DueAt)
            .Select(h => new HomeworkItem(
                h.Id,
                h.Title,
                h.Description,
                h.FileUrl,
                h.DueAt,
                _context.HomeworkSubmissions.Count(s => s.HomeworkId == h.Id && s.SubmittedAt != null && s.FileUrl != null),
                h.TitleEn,
                h.DescriptionEn
            ))
            .ToListAsync(ct);
    }

    public async Task<List<HomeworkSubmissionItem>> GetSubmissionsAsync(int homeworkId, CancellationToken ct = default)
    {
        return await _context.HomeworkSubmissions
            .Include(s => s.Student)
            .Where(s => s.HomeworkId == homeworkId && s.SubmittedAt != null && s.FileUrl != null)
            .OrderBy(s => s.Student.FullName)
            .Select(s => new HomeworkSubmissionItem(
                s.Id,
                s.StudentId,
                s.Student.FullName,
                s.SubmittedAt,
                s.FileUrl,
                s.Score,
                s.Feedback,
                s.SubmittedByUserId,
                s.SubmittedByRole
            ))
            .ToListAsync(ct);
    }

    public async Task<HomeworkSubmission?> GetSubmissionByIdAsync(int submissionId, CancellationToken ct = default)
    {
        return await _context.HomeworkSubmissions
            .FirstOrDefaultAsync(s => s.Id == submissionId, ct);
    }

    public async Task<Homework?> GetHomeworkByIdAsync(int homeworkId, CancellationToken ct = default)
    {
        return await _context.Homeworks
            .Include(h => h.Course)
            .FirstOrDefaultAsync(h => h.Id == homeworkId, ct);
    }

    public Task<bool> CanManageHomeworkAsync(int homeworkId, int instituteId, int userId, bool isAdmin, CancellationToken ct = default) =>
        _context.Homeworks.AnyAsync(homework => homework.Id == homeworkId
            && homework.InstituteId == instituteId
            && (isAdmin || (homework.Course.TeacherId.HasValue
                && _context.Teachers.Any(teacher => teacher.Id == homework.Course.TeacherId && teacher.UserId == userId && teacher.InstituteId == instituteId))), ct);

    public Task<bool> CanManageSubmissionAsync(int submissionId, int instituteId, int userId, CancellationToken ct = default) =>
        _context.HomeworkSubmissions.AnyAsync(submission => submission.Id == submissionId
            && submission.InstituteId == instituteId
            && submission.Homework.Course.TeacherId.HasValue
            && _context.Teachers.Any(teacher => teacher.Id == submission.Homework.Course.TeacherId
                && teacher.UserId == userId && teacher.InstituteId == instituteId), ct);

    public async Task<List<HomeworkStudentRosterItem>> GetSubmissionRosterAsync(int homeworkId, int instituteId, CancellationToken ct = default)
    {
        var courseId = await _context.Homeworks
            .Where(homework => homework.Id == homeworkId && homework.InstituteId == instituteId)
            .Select(homework => (int?)homework.CourseId)
            .FirstOrDefaultAsync(ct);
        if (!courseId.HasValue) return [];

        var students = await _context.Enrollments
            .Where(enrollment => enrollment.CourseId == courseId.Value
                && enrollment.InstituteId == instituteId
                && enrollment.Student.InstituteId == instituteId
                && enrollment.Student.DeletedAt == null)
            .Select(enrollment => new { enrollment.StudentId, enrollment.Student.FullName })
            .Distinct()
            .OrderBy(student => student.FullName)
            .ToListAsync(ct);
        if (students.Count == 0) return [];

        var studentIds = students.Select(student => student.StudentId).ToList();
        var submissions = await _context.HomeworkSubmissions
            .Where(submission => submission.HomeworkId == homeworkId
                && submission.InstituteId == instituteId
                && studentIds.Contains(submission.StudentId))
            .Select(submission => new { submission.StudentId, submission.Id, submission.SubmittedAt, submission.FileUrl })
            .ToListAsync(ct);
        var byStudent = submissions.ToDictionary(submission => submission.StudentId);

        return students.Select(student => byStudent.TryGetValue(student.StudentId, out var submission)
            ? new HomeworkStudentRosterItem(student.StudentId, student.FullName, submission.Id, submission.SubmittedAt, submission.FileUrl)
            : new HomeworkStudentRosterItem(student.StudentId, student.FullName, null, null, null))
            .ToList();
    }

    public async Task<HomeworkSubmission?> CreateOrGetSubmissionForStudentAsync(int homeworkId, int studentId, int instituteId, CancellationToken ct = default)
    {
        var enrolled = await _context.Homeworks.AnyAsync(homework => homework.Id == homeworkId
            && homework.InstituteId == instituteId
            && _context.Enrollments.Any(enrollment => enrollment.CourseId == homework.CourseId
                && enrollment.StudentId == studentId
                && enrollment.InstituteId == instituteId
                && enrollment.Student.InstituteId == instituteId
                && enrollment.Student.DeletedAt == null), ct);
        if (!enrolled) return null;

        var existing = await _context.HomeworkSubmissions.FirstOrDefaultAsync(submission =>
            submission.HomeworkId == homeworkId && submission.StudentId == studentId && submission.InstituteId == instituteId, ct);
        if (existing is not null) return existing;

        var created = new HomeworkSubmission
        {
            HomeworkId = homeworkId,
            StudentId = studentId,
            InstituteId = instituteId,
            CreatedAt = DateTime.UtcNow
        };
        _context.HomeworkSubmissions.Add(created);
        try
        {
            await _context.SaveChangesAsync(ct);
            return created;
        }
        catch (DbUpdateException)
        {
            _context.Entry(created).State = EntityState.Detached;
            return await _context.HomeworkSubmissions.FirstOrDefaultAsync(submission =>
                submission.HomeworkId == homeworkId && submission.StudentId == studentId && submission.InstituteId == instituteId, ct);
        }
    }

    public async Task UpdateSubmissionGradeAsync(HomeworkSubmission submission, CancellationToken ct = default)
    {
        var mappings = await _context.HomeworkSkillTopics
            .Where(x => x.HomeworkId == submission.HomeworkId)
            .ToListAsync(ct);
        foreach (var mapping in mappings)
        {
            var score = await _context.SkillScores.FirstOrDefaultAsync(x =>
                x.StudentId == submission.StudentId && x.TopicId == mapping.TopicId, ct);
            if (score is null)
            {
                _context.SkillScores.Add(new SkillScore
                {
                    InstituteId = submission.InstituteId,
                    StudentId = submission.StudentId,
                    TopicId = mapping.TopicId,
                    Score = submission.Score,
                    Note = submission.Feedback,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                score.Score = submission.Score;
                score.Note = submission.Feedback;
                score.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _context.SaveChangesAsync(ct);
    }

    public async Task<HomeworkSkillMappingResponse> GetSkillMappingAsync(int homeworkId, CancellationToken ct = default)
    {
        var homework = await _context.Homeworks.FirstOrDefaultAsync(x => x.Id == homeworkId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบการบ้าน");
        var topicIds = await _context.HomeworkSkillTopics
            .Where(x => x.HomeworkId == homework.Id)
            .Select(x => x.TopicId)
            .ToListAsync(ct);
        return new HomeworkSkillMappingResponse("success", homeworkId, topicIds);
    }

    public async Task<HomeworkSkillMappingResponse> SetSkillMappingAsync(int homeworkId, List<int> topicIds, CancellationToken ct = default)
    {
        var homework = await _context.Homeworks.FirstOrDefaultAsync(x => x.Id == homeworkId, ct)
            ?? throw new HomeworkValidationException("NOT_FOUND", "ไม่พบการบ้าน");
        var validTopicIds = await _context.SkillTopics
            .Where(x => x.CourseId == homework.CourseId && topicIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(ct);
        if (validTopicIds.Count != topicIds.Count)
            throw new HomeworkValidationException("INVALID_TOPIC_MAPPING", "skill topic ต้องอยู่ใน course เดียวกับการบ้าน");

        var existing = await _context.HomeworkSkillTopics.Where(x => x.HomeworkId == homeworkId).ToListAsync(ct);
        _context.HomeworkSkillTopics.RemoveRange(existing);
        _context.HomeworkSkillTopics.AddRange(validTopicIds.Select(topicId => new HomeworkSkillTopic
        {
            InstituteId = homework.InstituteId,
            HomeworkId = homeworkId,
            TopicId = topicId,
            CreatedAt = DateTime.UtcNow
        }));
        await _context.SaveChangesAsync(ct);
        return new HomeworkSkillMappingResponse("success", homeworkId, validTopicIds);
    }
}
