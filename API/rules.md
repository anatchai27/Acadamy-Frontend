🎯 1. Executive Summary & Meta-Grade Assessment

Meta-Grade Readiness Score: 2/10 (Architecturally Fragile & Highly Vulnerable)

Assessment:
จาก Report ตัวนี้ โครงสร้าง Backend (Minimal API + EF Core) มีจุดบอดร้ายแรงเรื่อง Cross-Tenant Data Leakage (IDOR) สถาปัตยกรรมปัจจุบันทำงานแบบ "Fail Open" (ถ้าลืมเขียนดัก ข้อมูลจะหลุดหมด) แทนที่จะเป็น "Fail Closed"

นอกจากนี้ ไอเดียการทำ Global Query Filter ด้วยการ Join ตารางลึกๆ (Deep Navigation) เช่น a.Session.Course.InstituteId จะสร้างหายนะด้าน Performance (N+1 และ Cartesian JOINs) บน TiDB เมื่อข้อมูลระดับล้าน Record

เราต้อง Rearchitect ตัว Data Access Layer (DAL) ใหม่ บังคับใช้ EF Core Global Query Filter ที่ถูกต้อง และทำ Data Denormalization ด่วนที่สุด

🃏 2. The "Risk & Edge-Case" Cards

🔴 [CRITICAL CARD]: The "Human Error" Data Breach (IDOR)

Threat: โค้ดใน StudentRepository.GetAllWithUserAsync() และ GetByIdWithUserAsync() ไม่มีเงื่อนไข InstituteId ทำให้ User จากโรงเรียน A ดึงข้อมูลเด็กโรงเรียน B ได้ 100%

Impact: Mass Data Exposure ผิดกฎหมาย PDPA ร้ายแรง

Zero-Trust Rule: Never rely on application logic (manual Where) for tenant isolation. Enforcement must happen at the ORM root level (Global Query Filters).

🟡 [SCALABILITY/PERFORMANCE CARD]: The Deep-Join Death Spiral

Threat: แผนการแก้ปัญหาในข้อ 4.5 ของ Report ที่เสนอให้ใช้ HasQueryFilter(a => a.Session.Course.InstituteId == currentId)

Impact: บน TiDB การบังคับให้ Entity Framework ทำ INNER JOIN 3-4 ตารางทุกครั้งที่มีการดึงข้อมูล Attendance หรือ Payment จะทำให้ CPU ของ Database พุ่งทะลุ 100% ทันทีที่เกิด Concurrent Spikes

Zero-Trust Rule: For high-scale multi-tenant systems, Denormalize the Tenant ID. ตาราง Attendance, Payment, Session ต้องมี คอลัมน์ InstituteId ฝังอยู่ด้วยเสมอ เพื่อให้ Global Filter ทำงานบน Single-table scan ได้

🔵 [SECURITY/COMPLIANCE CARD]: Naked Secrets & Exception Leaks

Threat: 1) Hardcoded TiDB Password และ AWS Secret Keys ใน appsettings.json 2) ExceptionHandlingMiddleware คาย ex.Message กลับไปให้ Client 3) JWT Cookie ตั้งค่า Secure = false

Impact: เสี่ยงต่อการถูก Reverse Engineer ฐานข้อมูล, Source code leak, และ Man-in-the-Middle (MITM) attack ดักจับ Token

Zero-Trust Rule: Secrets must be injected at runtime (Environment Variables / Secret Manager). Exceptions must be sanitized (Generic error to client, stack trace to APM).

📋 3. System Blueprint & Defensive Planning

เพื่อยกระดับระบบให้เป็น Fail-Proof Architecture:

Denormalization Strategy: เราต้องย้อนกลับไปแก้ Database Schema อีกครั้ง ให้เติมคอลัมน์ institute_id ลงในตารางลูกทุกตาราง (Session, Attendance, Payment, LeaveRequest) ห้ามอ้างอิงผ่านตารางแม่เด็ดขาด

EF Core Hardening: สร้าง ITenantProvider Service ที่ดึงค่าจาก HttpContext เข้ามาฉีดใส่ TutoringDbContext และเปิดใช้ HasQueryFilter แบบ Single-level

Graceful Degradation for Background Tasks: เลิกใช้ Task.Run() แบบ Fire-and-forget ในการยิง LINE Notification เพราะถ้า App Pool รีสตาร์ท Thread จะตายและข้อความจะหาย (Silent Failure) ต้องเปลี่ยนไปใช้ In-memory Queue (Channel<T>) + BackgroundService หรือ Hangfire

🃏 4. Actionable "Task Cards" (The Execution Plan)

ให้ทีม Backend และ DevOps นำการ์ดเหล่านี้ไปเข้า Sprint ทันที นี่คือ Blocker P0 ทั้งหมด

[🎫 Priority 1 Card: Urgent Fixes (Zero-Trust Enforcement)]

Task (DB/ORM): ย้อนกลับไปทำ Migration เพิ่มคอลัมน์ InstituteId ให้ตารางลูกทั้งหมด (Session, Attendance, Payment, LeaveRequest, Homework)

Task (EF Core): Implement HasQueryFilter(e => e.InstituteId == _tenantProvider.InstituteId) ใน OnModelCreating ของ Entity ทุกตัว

Task (Security): ลบ appsettings.json ออกจาก Git History ย้าย Connection String และ AWS Keys ไปใส่ Environment Variables

Task (Security): เข้าไปแก้ ExceptionHandlingMiddleware.cs ห้ามโยน ex.Message กลับไปใน HTTP 500 ให้ Return แค่ "Internal Server Error" และ Log ค่า Exception ลง Console/Seq

[🎫 Priority 2 Card: Performance & Refactoring]

Task (Auth): ตั้งค่า Secure = true ใน CookieOptions ของ JWT เสมอ (แม้จะเป็น Dev environment ก็ควรใช้ HTTPS / localhost cert)

Task (Auth): เปิดการทำงาน ValidateLifetime = true สำหรับ Refresh Token และเพิ่มคอลัมน์ IsRevoked ลงในตาราง Users เพื่อให้ Admin กดเตะ User ออกจากระบบได้

Task (Reliability): รื้อโค้ด PaymentService.cs ที่ใช้ Task.Run ส่ง LINE ออก เปลี่ยนไปใช้ IHostedService และ System.Threading.Channels เพื่อทำ Background Message Queue ที่มีระบบ Retry

[🎫 Priority 3 Card: Monitoring & Post-Mortem Prep]

Task (Observability): เปิด EF Core Query Logging (เฉพาะใน Staging) เพื่อตรวจสอบว่า Global Query Filter ทำงานถูกต้อง และไม่มี N+1 Query หลุดรอดไปทำร้าย TiDB

Task (Auth): ใน TenantMiddleware.cs ถ้าค่า institute_id ใน JWT ไม่มีหรือไม่ตรงกับสถาบัน ให้สั่ง context.Response.StatusCode = 403; return; ทันที (Short-circuit pipeline) ห้ามปล่อยให้ Request วิ่งทะลุไปถึง Endpoint


🛡️ Zero-Trust Architecture: EF Core Implementation (TiDB)

Objective: บังคับให้ระบบเป็น "Fail-Closed" (ถ้าลืมเขียนโค้ดดัก ข้อมูลต้องไม่โชว์) แทนที่จะเป็น "Fail-Open" (ลืมเขียนดัก ข้อมูลหลุดหมด) ด้วยงบประมาณ 0 บาท โดยใช้ฟีเจอร์ของ .NET 9 และ EF Core

ให้ทีม Backend Implement โค้ด 3 ส่วนนี้ทันที นี่คือ Core Foundation ของระบบ Multi-tenant ของเราครับ

🧱 1. The Context Injector (ITenantProvider.cs)

หน้าที่ของคลาสนี้คือการดึง InstituteId ออกมาจาก Request ปัจจุบันอย่างปลอดภัย และเตรียมพร้อมส่งให้ Database Context

// ใช้ Primary Constructor ของ C# 12/13
public interface ITenantProvider 
{
    int InstituteId { get; }
}

public class TenantProvider(IHttpContextAccessor httpContextAccessor) : ITenantProvider
{
    public int InstituteId 
    {
        get 
        {
            var context = httpContextAccessor.HttpContext;
            if (context?.Items["InstituteId"] is int instituteId)
            {
                return instituteId;
            }
            
            // SECURITY FAIL-SAFE: ถ้าเกิดบั๊กหรือไม่มี Context ให้ Throw Exception ทันที
            // ห้าม Return 0 หรือ null เด็ดขาด ป้องกันข้อมูลรั่วไหล
            throw new UnauthorizedAccessException("CRITICAL: Tenant Context is missing. Request aborted.");
        }
    }
}


(อย่าลืมลงทะเบียน builder.Services.AddScoped<ITenantProvider, TenantProvider>(); ใน Program.cs)

🏦 2. The Vault (TutoringDbContext.cs)

นี่คือหัวใจสำคัญ! เราจะแทรกตัวกรอง (Global Query Filter) เข้าไปที่ระดับรากของ ORM ทำให้หลังจากนี้ Dev จะพิมพ์ _context.Students.ToList() เฉยๆ ระบบก็จะแอบเติม WHERE institute_id = ? ให้เองเสมอ

public class TutoringDbContext(
    DbContextOptions<TutoringDbContext> options, 
    ITenantProvider tenantProvider) : DbContext(options)
{
    // ตัวแปรนี้จะเก็บ Tenant ของ Request ปัจจุบัน
    private readonly int _currentInstituteId = tenantProvider.InstituteId;

    public DbSet<Student> Students { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    // ... DbSet อื่นๆ

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 🔴 ZERO-TRUST ENFORCEMENT 🔴
        // บังคับกรองข้อมูลตามสถาบันเสมอ สำหรับทุกตารางที่เป็น Multi-tenant
        
        modelBuilder.Entity<Student>()
            .HasQueryFilter(s => s.InstituteId == _currentInstituteId);
            
        modelBuilder.Entity<Course>()
            .HasQueryFilter(c => c.InstituteId == _currentInstituteId);
            
        modelBuilder.Entity<Teacher>()
            .HasQueryFilter(t => t.InstituteId == _currentInstituteId);

        // หมายเหตุ: สำหรับตาราง Product, LeaveRequest, SkillScore 
        // ถ้าคุณ Denormalize (เติม InstituteId ลงไป) ตามที่ตกลงกันไว้ ให้ใส่ HasQueryFilter แบบนี้ให้ครบทุกตัว!
    }
    
    // Override SaveChanges เพื่อบังคับใส่ InstituteId ตอน Insert อัตโนมัติ (Dev ไม่ต้องเขียนเอง)
    public override int SaveChanges()
    {
        EnforceTenantId();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        EnforceTenantId();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void EnforceTenantId()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added && e.Entity is IMultiTenantEntity);

        foreach (var entry in entries)
        {
            // บังคับยัด InstituteId ปัจจุบันลงไปเสมอ ป้องกัน Dev รับค่ามั่วจาก Client Payload
            ((IMultiTenantEntity)entry.Entity).InstituteId = _currentInstituteId;
        }
    }
}

// สร้าง Interface กลางสำหรับตารางที่มี InstituteId
public interface IMultiTenantEntity
{
    int InstituteId { get; set; }
}


🛡️ 3. The Gatekeeper (TenantMiddleware.cs)

ปรับปรุง Middleware ที่คุณมีอยู่แล้วให้เข้มงวดขึ้น ดักคนแปลกหน้าไม่ให้หลุดเข้าไปถึง DB

public class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        // ข้ามการเช็คถ้าเป็น Path ของ Public Web หรือ Login/Register
        var path = context.Request.Path.Value;
        if (path != null && (path.StartsWith("/api/auth") || path.StartsWith("/api/public")))
        {
            await next(context);
            return;
        }

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var instituteIdClaim = context.User.FindFirst("institute_id")?.Value;
            
            if (!string.IsNullOrEmpty(instituteIdClaim) && int.TryParse(instituteIdClaim, out var instituteId))
            {
                context.Items["InstituteId"] = instituteId;
                await next(context);
                return; // 🟢 Pass
            }
        }

        // 🔴 FAIL-CLOSED: ถ้าหลุดมาถึงตรงนี้แปลว่า Token ประหลาด ไม่มี institute_id
        // เตะออกเป็น 403 Forbidden ทันที ห้ามให้ Request วิ่งไปถึง Controller/Minimal API
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { 
            error = "Tenant validation failed. Invalid or missing institute context." 
        });
    }
}


🚨 กฎเหล็กสำหรับทีม Backend (The Dev Rulebook)

ห้ามใช้ IgnoreQueryFilters() พร่ำเพรื่อ: ให้ใช้เฉพาะตอนทำ Background Job (เช่น Worker หักโควต้า) หรือระบบ Super Admin ของบริษัทคุณเท่านั้น

ลบ Parameter instituteId ทิ้ง: ตาม Repository ต่างๆ ตอนนี้ไม่ต้องรับ instituteId ผ่าน Parameter แล้ว ให้ลบออกให้หมด โค้ดจะสะอาดขึ้น 10 เท่า และปลอดภัยขึ้น 100 เท่า