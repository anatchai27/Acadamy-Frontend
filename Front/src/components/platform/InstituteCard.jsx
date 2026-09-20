export function InstituteCard({ institute }) {
  return (
    <article class="market-institute-card">
      <div class="market-card-top">
        <div class="market-logo" style={{ background: institute.accent }}>
          {institute.initials}
        </div>
        <button class="market-save" aria-label={`บันทึก ${institute.name}`}>
          ♡
        </button>
      </div>
      <span class="market-kicker">สถาบันแนะนำ</span>
      <h3>{institute.name}</h3>
      <p>{institute.description}</p>
      <div class="market-tags">
        {institute.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div class="market-rating">
        <span>
          ★ <b>{institute.rating.toFixed(1)}</b> <small>({institute.reviews} รีวิว)</small>
        </span>
        <small>⌖ {institute.location}</small>
      </div>
      <a class="market-card-link" href="#courses">
        ดูสถาบันและคอร์ส <span>↗</span>
      </a>
    </article>
  );
}
