using academy_API.Models;
using academy_API.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace academy_API.Data;

public class TutoringDbContext(
    DbContextOptions<TutoringDbContext> options,
    ITenantProvider tenantProvider) : DbContext(options)
{
    private readonly int _currentInstituteId = tenantProvider.InstituteId;

    public DbSet<User> Users => Set<User>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<PdpaConsent> PdpaConsents => Set<PdpaConsent>();
    public DbSet<Parent> Parents => Set<Parent>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Institute> Institutes => Set<Institute>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<Homework> Homeworks => Set<Homework>();
    public DbSet<HomeworkSubmission> HomeworkSubmissions => Set<HomeworkSubmission>();
    public DbSet<SkillTopic> SkillTopics => Set<SkillTopic>();
    public DbSet<SkillScore> SkillScores => Set<SkillScore>();
    public DbSet<MakeupSlot> MakeupSlots => Set<MakeupSlot>();
    public DbSet<MakeupCredit> MakeupCredits => Set<MakeupCredit>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Institute>(entity =>
        {
            entity.ToTable("institutes");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name");
            entity.Property(e => e.LogoUrl).HasMaxLength(1000).HasColumnName("logo_url");
            entity.Property(e => e.ContactPhone).HasMaxLength(50).HasColumnName("contact_phone");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.InstituteId).HasColumnName("institute_id");

            entity.HasOne(e => e.Institute)
                  .WithMany()
                  .HasForeignKey(e => e.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.InstituteId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.LineUserId);
            entity.HasIndex(e => e.Role);

            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("email");
            entity.Property(e => e.Phone).HasMaxLength(50).HasColumnName("phone");
            entity.Property(e => e.LineUserId).HasMaxLength(255).HasColumnName("line_user_id");
            entity.Property(e => e.PasswordHash).HasMaxLength(500).HasColumnName("password_hash");
            entity.Property(e => e.ResetToken).HasMaxLength(255).HasColumnName("reset_token");
            entity.Property(e => e.ResetTokenExpiry).HasColumnName("reset_token_expiry");
            entity.Property(e => e.Role).HasMaxLength(20).HasColumnName("role").HasConversion<string>();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("students");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.InstituteId).HasColumnName("institute_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(s => s.Institute)
                  .WithMany()
                  .HasForeignKey(s => s.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.User)
                  .WithOne(u => u.Student)
                  .HasForeignKey<Student>(s => s.UserId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(s => s.InstituteId);
            entity.HasIndex(s => s.UserId).IsUnique();
            entity.HasIndex(s => s.QrToken);

            entity.Property(s => s.FullName).HasMaxLength(255).HasColumnName("full_name");
            entity.Property(s => s.Nickname).HasMaxLength(100).HasColumnName("nickname");
            entity.Property(s => s.Grade).HasMaxLength(50).HasColumnName("grade");
            entity.Property(s => s.School).HasMaxLength(255).HasColumnName("school");
            entity.Property(s => s.QrToken).HasMaxLength(255).HasColumnName("qr_token");
            entity.Property(s => s.PhotoUrl).HasMaxLength(255).HasColumnName("photo_url");
            entity.Property(s => s.MedicalInfo).HasColumnType("text").HasColumnName("medical_info");
            entity.Property(s => s.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.ToTable("teachers");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.InstituteId).HasColumnName("institute_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(t => t.Institute)
                  .WithMany()
                  .HasForeignKey(t => t.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.User)
                  .WithOne(u => u.Teacher)
                  .HasForeignKey<Teacher>(t => t.UserId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(t => t.InstituteId);
            entity.HasIndex(t => t.UserId).IsUnique();

            entity.Property(t => t.FullName).HasMaxLength(255).HasColumnName("full_name");
            entity.Property(t => t.Specialization).HasMaxLength(255).HasColumnName("subjects");
            entity.Property(t => t.Bio).HasMaxLength(2000).HasColumnName("bio");
            entity.Property(t => t.HourlyRate).HasColumnName("hourly_rate");
            entity.Property(t => t.PhotoUrl).HasMaxLength(255).HasColumnName("photo_url");
        });

        modelBuilder.Entity<PdpaConsent>(entity =>
        {
            entity.ToTable("pdpa_consents");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired(false);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.UserId);

            entity.Property(e => e.ConsentVersion).HasMaxLength(50).HasColumnName("consent_version");
            entity.Property(e => e.IsAccepted).HasColumnName("is_accepted");
            entity.Property(e => e.AcceptedAt).HasColumnName("accepted_at");
            entity.Property(e => e.IpAddress).HasMaxLength(45).HasColumnName("ip_address");
        });

        modelBuilder.Entity<Parent>(entity =>
        {
            entity.ToTable("parents");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired(false);
            entity.Property(e => e.StudentId).HasColumnName("student_id");

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Student)
                  .WithMany(s => s.Parents)
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.StudentId);

            entity.Property(e => e.FullName).HasMaxLength(255).HasColumnName("full_name");
            entity.Property(e => e.Phone).HasMaxLength(50).HasColumnName("phone");
            entity.Property(e => e.LineUserId).HasMaxLength(255).HasColumnName("line_user_id");
            entity.Property(e => e.Relationship).HasMaxLength(100).HasColumnName("relationship");
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.ToTable("sessions");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.InstituteId).HasColumnName("institute_id");

            entity.HasOne(e => e.Course)
                  .WithMany()
                  .HasForeignKey(e => e.CourseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.SubstituteTeacherId).HasColumnName("substitute_teacher_id").IsRequired(false);
            entity.HasOne(e => e.SubstituteTeacher)
                  .WithMany()
                  .HasForeignKey(e => e.SubstituteTeacherId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.ScheduledAt).HasColumnName("scheduled_at");
            entity.Property(e => e.DurationMin).HasColumnName("duration_min");
            entity.Property(e => e.RoomId).HasMaxLength(50).HasColumnName("room_id");
            entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status");
            entity.Property(e => e.ActualStartAt).HasColumnName("actual_start_at");
            entity.Property(e => e.ActualEndAt).HasColumnName("actual_end_at");

            entity.HasMany(e => e.Attendances)
                  .WithOne(a => a.Session)
                  .HasForeignKey(a => a.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.CourseId);
            entity.HasIndex(e => e.SubstituteTeacherId);
            entity.HasIndex(e => e.InstituteId);
        });

        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.ToTable("attendances");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.SessionId).HasColumnName("session_id");
            entity.Property(e => e.StudentId).HasColumnName("student_id");

            entity.HasOne(e => e.Student)
                  .WithMany()
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status");
            entity.Property(e => e.CheckinAt).HasColumnName("checkin_at");
            entity.Property(e => e.CheckoutAt).HasColumnName("checkout_at");
            entity.Property(e => e.PickedUpBy).HasMaxLength(255).HasColumnName("picked_up_by");

            entity.HasIndex(e => new { e.StudentId, e.SessionId });
            entity.HasIndex(e => e.StudentId);
            entity.HasIndex(e => e.SessionId);
        });

        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.ToTable("enrollments");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.SessionsRemaining).HasColumnName("sessions_remaining");
            entity.Property(e => e.PaidAmount).HasColumnName("paid_amount").HasColumnType("decimal(10,2)");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(e => e.Student)
                  .WithMany()
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Course)
                  .WithMany()
                  .HasForeignKey(e => e.CourseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.StudentId);
            entity.HasIndex(e => e.CourseId);
            entity.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique();
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.ToTable("courses");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.InstituteId).HasColumnName("institute_id");

            entity.HasOne(e => e.Institute)
                  .WithMany()
                  .HasForeignKey(e => e.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name");
            entity.Property(e => e.Subject).HasMaxLength(255).HasColumnName("subject");
            entity.Property(e => e.TotalSessions).HasColumnName("total_sessions");
            entity.Property(e => e.Price).HasColumnName("price").HasColumnType("decimal(10,2)");
            entity.Property(e => e.TeacherId).HasColumnName("teacher_id").IsRequired(false);

            entity.HasOne(e => e.Teacher)
                  .WithMany()
                  .HasForeignKey(e => e.TeacherId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                  entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
                  entity.Property(e => e.CreatedBy).HasColumnName("created_by").IsRequired(false);
                  entity.Property(e => e.UpdatedBy).HasColumnName("updated_by").IsRequired(false);
                  entity.Property(e => e.CapacityLimit).HasColumnName("capacity_limit").IsRequired(false);
                  entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status");

            entity.HasIndex(e => e.InstituteId);
            entity.HasIndex(e => e.TeacherId);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("payments");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.EnrollmentId).HasColumnName("enrollment_id");
                  entity.Property(e => e.InstituteId).HasColumnName("institute_id");
            entity.Property(e => e.Amount).HasColumnName("amount").HasColumnType("decimal(10,2)");
            entity.Property(e => e.Method).HasMaxLength(20).HasColumnName("method");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.SlipUrl).HasMaxLength(1000).HasColumnName("slip_url");
            entity.Property(e => e.InvoiceNo).HasMaxLength(50).HasColumnName("invoice_no");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                  entity.Property(e => e.DiscountAmount).HasColumnName("discount_amount").HasColumnType("decimal(10,2)");
                  entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status");
                  entity.Property(e => e.GatewayRefId).HasMaxLength(255).HasColumnName("gateway_ref_id");
                  entity.Property(e => e.NetAmount).HasColumnName("net_amount").HasColumnType("decimal(10,2)");

            entity.HasOne(e => e.Enrollment)
                  .WithMany()
                  .HasForeignKey(e => e.EnrollmentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.InvoiceNo).IsUnique();
            entity.HasIndex(e => e.EnrollmentId);
                  entity.HasIndex(e => e.InstituteId);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Channel).HasMaxLength(20).HasColumnName("channel");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.SentAt).HasColumnName("sent_at");
            entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status");

            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<LeaveRequest>(entity =>
        {
            entity.ToTable("leave_requests");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.SessionId).HasColumnName("session_id");
                  entity.Property(e => e.InstituteId).HasColumnName("institute_id");

            entity.HasOne(e => e.Student)
                  .WithMany()
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Session)
                  .WithMany()
                  .HasForeignKey(e => e.SessionId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.Type).HasMaxLength(20).HasColumnName("type");
            entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status");
            entity.Property(e => e.RequestedAt).HasColumnName("requested_at");
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by").IsRequired(false);

            entity.HasOne(e => e.ApprovedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ApprovedBy)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Institute)
                  .WithMany()
                  .HasForeignKey(e => e.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.StudentId);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.ApprovedBy);
            entity.HasIndex(e => e.InstituteId);
        });

        modelBuilder.Entity<Homework>(entity =>
        {
            entity.ToTable("homeworks");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.CourseId).HasColumnName("course_id");
                  entity.Property(e => e.InstituteId).HasColumnName("institute_id");

            entity.HasOne(e => e.Course)
                  .WithMany()
                  .HasForeignKey(e => e.CourseId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("title");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.FileUrl).HasMaxLength(1000).HasColumnName("file_url");
            entity.Property(e => e.DueAt).HasColumnName("due_at");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by").IsRequired(false);

            entity.HasOne(e => e.AssignedByTeacher)
                  .WithMany()
                  .HasForeignKey(e => e.AssignedBy)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Institute)
                  .WithMany()
                  .HasForeignKey(e => e.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.CourseId);
            entity.HasIndex(e => e.AssignedBy);
            entity.HasIndex(e => e.InstituteId);
        });

        modelBuilder.Entity<HomeworkSubmission>(entity =>
        {
            entity.ToTable("homework_submissions");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.HomeworkId).HasColumnName("homework_id");
            entity.Property(e => e.StudentId).HasColumnName("student_id");
                  entity.Property(e => e.InstituteId).HasColumnName("institute_id");

            entity.HasOne(e => e.Homework)
                  .WithMany()
                  .HasForeignKey(e => e.HomeworkId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Student)
                  .WithMany()
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Institute)
                  .WithMany()
                  .HasForeignKey(e => e.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(e => e.FileUrl).HasMaxLength(1000).HasColumnName("file_url");
            entity.Property(e => e.Score).HasColumnName("score").HasColumnType("decimal(5,2)");
            entity.Property(e => e.Feedback).HasColumnName("feedback");

            entity.HasIndex(e => e.HomeworkId);
            entity.HasIndex(e => e.StudentId);
            entity.HasIndex(e => e.InstituteId);
            entity.HasIndex(e => new { e.HomeworkId, e.StudentId }).IsUnique();
        });

        modelBuilder.Entity<SkillTopic>(entity =>
        {
            entity.ToTable("skill_topics");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.CourseId).HasColumnName("course_id");

            entity.HasOne(e => e.Course)
                  .WithMany()
                  .HasForeignKey(e => e.CourseId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name");
            entity.Property(e => e.OrderIndex).HasColumnName("order_index");

            entity.HasIndex(e => e.CourseId);
        });

        modelBuilder.Entity<SkillScore>(entity =>
        {
            entity.ToTable("skill_scores");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.TopicId).HasColumnName("topic_id");

            entity.HasOne(e => e.Student)
                  .WithMany()
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Topic)
                  .WithMany()
                  .HasForeignKey(e => e.TopicId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Score).HasColumnName("score").HasColumnType("decimal(5,2)");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by").IsRequired(false);

            entity.HasOne(e => e.UpdatedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.UpdatedBy)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(e => e.StudentId);
            entity.HasIndex(e => e.TopicId);
            entity.HasIndex(e => e.UpdatedBy);
        });

        modelBuilder.Entity<MakeupSlot>(entity =>
        {
            entity.ToTable("makeup_slots");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.TeacherId).HasColumnName("teacher_id").IsRequired(false);

            entity.HasOne(e => e.Teacher)
                  .WithMany()
                  .HasForeignKey(e => e.TeacherId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.ScheduledAt).HasColumnName("scheduled_at");
            entity.Property(e => e.Capacity).HasColumnName("capacity");
            entity.Property(e => e.BookedCount).HasColumnName("booked_count");
            entity.Property(e => e.RoomId).HasMaxLength(50).HasColumnName("room_id");

            entity.HasIndex(e => e.TeacherId);
        });

        modelBuilder.Entity<MakeupCredit>(entity =>
        {
            entity.ToTable("makeup_credits");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.StudentId).HasColumnName("student_id");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
                  entity.Property(e => e.InstituteId).HasColumnName("institute_id");

            entity.HasOne(e => e.Student)
                  .WithMany()
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Course)
                  .WithMany()
                  .HasForeignKey(e => e.CourseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.GrantedAt).HasColumnName("granted_at");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.UsedSessionId).HasColumnName("used_session_id").IsRequired(false);

            entity.HasOne(e => e.UsedSession)
                  .WithMany()
                  .HasForeignKey(e => e.UsedSessionId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Institute)
                  .WithMany()
                  .HasForeignKey(e => e.InstituteId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.StudentId);
            entity.HasIndex(e => e.CourseId);
            entity.HasIndex(e => e.UsedSessionId);
            entity.HasIndex(e => e.InstituteId);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.InstituteId).HasColumnName("institute_id").IsRequired();
            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name").IsRequired();
            entity.Property(e => e.Price).HasColumnName("price").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000).HasColumnName("description");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.InstituteId);
        });

        ApplyTenantFilters(modelBuilder);
    }

private void ApplyTenantFilters(ModelBuilder modelBuilder)
    {
        if (_currentInstituteId == 0) return;

        modelBuilder.Entity<Session>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Attendance>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Payment>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<LeaveRequest>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Homework>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<HomeworkSubmission>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Enrollment>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<MakeupCredit>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Student>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Teacher>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Course>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<Product>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
        modelBuilder.Entity<User>().HasQueryFilter(e => e.InstituteId == _currentInstituteId);
    }

}
