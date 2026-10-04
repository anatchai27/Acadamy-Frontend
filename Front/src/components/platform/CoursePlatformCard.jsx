export function CoursePlatformCard({ course, onCompare, copy, index }) {
  return (
    <article class="market-course-card">
      <div class="market-course-visual" style={{ background: course.accent }}>
        <span>{copy.subjects[index]}</span>
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
          {copy.levels[index]} · {copy.durations[index]} · {course.format}
        </p>
        <div class="market-price">
          <strong>฿{course.price.toLocaleString()}</strong>
          <span>{copy.perCourse}</span>
        </div>
        <button class="market-compare-button" onClick={() => onCompare(course)}>
          ＋ {copy.compare}
        </button>
      </div>
    </article>
  );
}
