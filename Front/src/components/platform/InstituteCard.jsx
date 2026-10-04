export function InstituteCard({ institute, copy, labels }) {
  return (
    <article class="market-institute-card">
      <div class="market-card-top">
        <div class="market-logo" style={{ background: institute.accent }}>
          {institute.initials}
        </div>
        <button class="market-save" aria-label={labels.save.replace('{{name}}', institute.name)}>
          ♡
        </button>
      </div>
      <span class="market-kicker">{labels.kicker}</span>
      <h3>{institute.name}</h3>
      <p>{copy.description}</p>
      <div class="market-tags">
        {copy.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div class="market-rating">
        <span>
          ★ <b>{institute.rating.toFixed(1)}</b> <small>({institute.reviews} {labels.reviews})</small>
        </span>
        <small>⌖ {copy.location}</small>
      </div>
      <a class="market-card-link" href="#courses">
        {labels.action} <span>↗</span>
      </a>
    </article>
  );
}
