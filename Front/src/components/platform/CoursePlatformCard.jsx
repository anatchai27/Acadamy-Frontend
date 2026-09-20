export function CoursePlatformCard({ course, onCompare }) {
  return (
    <article class="market-course-card">
      <div class="market-course-visual" style={{ background: course.accent }}>
        <span>{course.subject}</span>
        <b>{course.instituteInitials}</b>
      </div>
      <div class="market-course-content">
        <div class="market-provider">
          <span>{course.instituteInitials}</span>
          <strong>{course.institute}</strong>
          <small>★ {course.rating.toFixed(1)}</small>
        </div>
        <h3>{course.name}</h3>
        <p>
          {course.level} · {course.duration} · {course.format}
        </p>
        <div class="market-price">
          <strong>฿{course.price.toLocaleString()}</strong>
          <span>ต่อคอร์ส</span>
        </div>
        <button class="market-compare-button" onClick={() => onCompare(course)}>
          ＋ เปรียบเทียบราคาคอร์ส
        </button>
      </div>
    </article>
  );
}
