import type { PlatformCourse } from "@/config/content";
import { motion } from "framer-motion";

export function CourseCard({
  course,
  index,
  onCompare,
}: {
  course: PlatformCourse;
  index: number;
  onCompare: (course: PlatformCourse) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{
        delay: index * 0.08,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="course-card"
    >
      <div className="course-visual" style={{ background: course.accent }}>
        <span>{course.subject}</span>
        <b>{course.instituteInitials}</b>
      </div>
      <div className="course-content">
        <div className="provider">
          <span>{course.instituteInitials}</span>
          <strong>{course.institute}</strong>
          <small>★ {course.rating.toFixed(1)}</small>
        </div>
        <h3>{course.name}</h3>
        <p>
          {course.level} · {course.duration} · {course.format}
        </p>
        <strong className="price">
          ฿{course.price.toLocaleString()} <small>ต่อคอร์ส</small>
        </strong>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onCompare(course)}
        >
          ＋ เปรียบเทียบราคาคอร์ส
        </motion.button>
      </div>
    </motion.article>
  );
}
