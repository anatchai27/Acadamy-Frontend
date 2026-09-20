export const platformContent = {
  brand: {
    name: "acadamy",
    tagline: "ศูนย์กลางค้นหาและเปรียบเทียบสถาบันเรียนพิเศษสำหรับเด็ก",
  },
  hero: {
    eyebrow: "THE SMART WAY TO CHOOSE TUTORING",
    title: "ค้นพบที่เรียนที่",
    highlight: "เหมาะกับลูก",
    description:
      "เปรียบเทียบสถาบัน คอร์สเรียน และรีวิวจากผู้ปกครองจริงในที่เดียว เพื่อการตัดสินใจที่มั่นใจขึ้น",
  },
  problems: [
    {
      id: "communication",
      eyebrow: "01 / ทักษะการสื่อสาร",
      title: ["ไม่กล้าพูด", "ไม่กล้าแสดงออก"],
      cta: "รวมสถาบันที่ช่วยเรื่องนี้",
      tone: "mint",
    },
    {
      id: "foundation",
      eyebrow: "02 / การเรียนรู้",
      title: ["พื้นฐานยังไม่แน่น", "ตามเพื่อนไม่ทัน"],
      cta: "รวมสถาบันที่ช่วยเรื่องนี้",
      tone: "blue",
    },
    {
      id: "future-skills",
      eyebrow: "03 / ทักษะแห่งอนาคต",
      title: ["อยากลองสิ่งใหม่", "ค้นหาความถนัด"],
      cta: "รวมสถาบันที่ช่วยเรื่องนี้",
      tone: "peach",
    },
  ],
  institutes: [
    {
      name: "BrightMind Academy",
      initials: "BM",
      location: "ลาดพร้าว",
      description:
        "ห้องเรียนกลุ่มเล็กที่ช่วยให้เด็กคิดเป็นระบบและกล้าลองผิดลองถูก",
      rating: 4.9,
      reviews: 248,
      accent: "#d7e5ff",
      tags: ["ทดลองเรียนฟรี", "กลุ่มเล็ก"],
    },
    {
      name: "SpeakUp Kids",
      initials: "SK",
      location: "อโศก",
      description:
        "ภาษาอังกฤษและ Public Speaking ผ่านกิจกรรมที่เด็กสนุกและมีส่วนร่วม",
      rating: 4.8,
      reviews: 186,
      accent: "#ffe2b8",
      tags: ["ครูเจ้าของภาษา", "เด็กชอบมาก"],
    },
    {
      name: "Little Makers Lab",
      initials: "LM",
      location: "บางนา",
      description:
        "Coding, Robotics และทักษะอนาคตสำหรับนักเรียนที่ชอบสร้างสรรค์",
      rating: 4.7,
      reviews: 129,
      accent: "#d5f1df",
      tags: ["ลงมือทำจริง", "มีอุปกรณ์ให้"],
    },
  ],
  courses: [
    {
      name: "Confident Speaker",
      subject: "ภาษาอังกฤษ",
      level: "ป.4–ม.ต้น",
      institute: "SpeakUp Kids",
      instituteInitials: "SK",
      price: 2890,
      duration: "8 สัปดาห์",
      format: "Live",
      accent: "#ffe8c9",
      rating: 4.9,
    },
    {
      name: "Young Coder: Game Lab",
      subject: "Coding",
      level: "7–12 ปี",
      institute: "Little Makers Lab",
      instituteInitials: "LM",
      price: 3490,
      duration: "10 ครั้ง",
      format: "Live + VDO",
      accent: "#dbe7ff",
      rating: 4.8,
    },
    {
      name: "Math Thinking",
      subject: "คณิตศาสตร์",
      level: "ป.4–ป.6",
      institute: "BrightMind Academy",
      instituteInitials: "BM",
      price: 1990,
      duration: "12 ครั้ง",
      format: "Live",
      accent: "#d9f2e2",
      rating: 4.7,
    },
  ],
} as const;

export type PlatformInstitute = (typeof platformContent.institutes)[number];
export type PlatformCourse = (typeof platformContent.courses)[number];
