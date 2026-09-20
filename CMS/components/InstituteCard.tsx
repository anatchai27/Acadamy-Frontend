import type { PlatformInstitute } from "@/config/content";
import { motion } from "framer-motion";

export function InstituteCard({
  institute,
  index,
}: {
  institute: PlatformInstitute;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{
        delay: index * 0.08,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="institute-card"
    >
      <div className="card-top">
        <span
          className="institute-logo"
          style={{ background: institute.accent }}
        >
          {institute.initials}
        </span>
        <button aria-label={`บันทึก ${institute.name}`}>♡</button>
      </div>
      <span className="kicker">สถาบันแนะนำ</span>
      <h3>{institute.name}</h3>
      <p>{institute.description}</p>
      <div className="tags">
        {institute.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="rating">
        <span>
          ★ <b>{institute.rating.toFixed(1)}</b>{" "}
          <small>({institute.reviews} รีวิว)</small>
        </span>
        <small>⌖ {institute.location}</small>
      </div>
      <a href="#courses">ดูสถาบันและคอร์ส ↗</a>
    </motion.article>
  );
}
