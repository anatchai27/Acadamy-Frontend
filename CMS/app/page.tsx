import ProductDashboardPreview from "../components/ProductDashboardPreview";
import FoxSticker from "../components/FoxSticker";

const workflows = [
  { title: "ข้อมูลนักเรียนและผู้ปกครอง", description: "เก็บประวัติ ช่องทางติดต่อ และข้อมูลสำคัญของแต่ละครอบครัวไว้ในที่เดียว", mood: "hello" as const },
  { title: "คอร์สเรียนและครูผู้สอน", description: "จัดคอร์ส จับคู่ผู้สอน และวางตารางเรียนให้เห็นชัดว่าใครสอนอะไร", mood: "reading" as const },
  { title: "รับชำระและติดตามการเงิน", description: "บันทึกเงินสดหรือเงินโอน ตรวจสลิป และเปิดดูประวัติการรับชำระได้", mood: "thumbs-up" as const },
];

export default function HomePage() {
  return (
    <div className="partner-page">
      <header className="market-nav">
        <a className="market-brand" href="#top" aria-label="tiwhub หน้าหลัก">
          <img src="/tiwhub-mark.svg" alt="" />
          tiwhub
        </a>
        <nav className="market-nav-links" aria-label="เมนูหลัก">
          <a href="#งานที่จัดการได้">งานที่จัดการได้</a>
          <a href="#ภาพระบบ">ลองดูหน้าระบบ</a>
        </nav>
        <a className="market-partner-link" href="https://acadamy-frontend-3nao-mu.vercel.app/login">เข้าสู่ระบบ <span aria-hidden="true">↗</span></a>
      </header>

      <main id="top">
        <section className="partner-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" /> ระบบจัดการสถาบันกวดวิชา</span>
            <h1 id="hero-title">ดูแลนักเรียน<br />จัดการสถาบัน<br /><span>ได้ในที่เดียว</span></h1>
            <p>ข้อมูลนักเรียน ผู้ปกครอง คอร์สเรียน ครูผู้สอน และการรับชำระ—จัดให้อยู่ในระบบเดียว เพื่อให้ทีมสถาบันทำงานประจำวันได้ง่ายขึ้น</p>
            <div className="hero-actions">
              <a className="button-primary hero-cta" href="https://acadamy-frontend-3nao-mu.vercel.app/login">เข้าสู่ระบบจัดการ <span aria-hidden="true">→</span></a>
              <a className="hero-secondary-link" href="#ภาพระบบ">ดูตัวอย่างหน้าระบบ <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-trust">
              <span className="trust-mark" aria-hidden="true"><span>✓</span></span>
              <p>ข้อมูลสำคัญอยู่ด้วยกัน<br /><strong>ตั้งแต่รายชื่อนักเรียนถึงประวัติการชำระ</strong></p>
            </div>
          </div>

          <div className="hero-stage" aria-label="ตัวอย่างหน้าระบบจัดการสถาบัน">
            <div className="hero-mascot" aria-hidden="true"><FoxSticker mood="idea" alt="" priority /></div>
            <ProductDashboardPreview />
            <div className="stage-caption"><span aria-hidden="true">↳</span> ข้อมูลที่ต้องใช้ทุกวัน อยู่ในระยะคลิกเดียว</div>
          </div>
        </section>

        <section className="welcome-strip" id="งานที่จัดการได้" aria-label="งานของสถาบันที่จัดการได้">
          {workflows.map((workflow) => (
            <div className="welcome-item" key={workflow.title}>
              <span className="welcome-mascot"><FoxSticker mood={workflow.mood} alt="" /></span>
              <p><strong>{workflow.title}</strong><small>{workflow.description}</small></p>
            </div>
          ))}
        </section>

        <section className="operations-section" id="ภาพระบบ">
          <div className="operations-heading">
            <div><p className="section-label">ให้เรื่องประจำวันเป็นระบบขึ้น</p><h2>ภาพรวมที่ทีมสถาบัน<br />เปิดดูแล้วรู้ว่าต้องทำอะไร</h2></div>
            <div className="operations-guide"><FoxSticker mood="thinking" alt="" /><p>ดูจำนวนนักเรียน เช็กชื่อวันนี้ ตารางสอน และรายการรับชำระที่รอตรวจ จากหน้าเดียวกัน</p></div>
          </div>
          <ProductDashboardPreview />
          <p className="operations-note">หน้าจอและข้อมูลประกอบเป็นตัวอย่างจำลอง · รายการจริงขึ้นกับข้อมูลของแต่ละสถาบัน</p>
        </section>

        <section className="benefits-section" id="วิธีทำงาน">
          <div className="benefits-heading">
            <p className="section-label">จากข้อมูลกระจัดกระจาย สู่การทำงานที่ต่อกัน</p>
            <h2>ดูแลเด็กแต่ละคน<br />ได้ครบกว่าเดิม</h2>
          </div>
          <div className="benefits-list">
            <article className="benefit-row"><span className="benefit-number">01</span><div><h3>เริ่มจากรู้จักนักเรียนและครอบครัว</h3><p>เก็บข้อมูลนักเรียน ผู้ปกครอง ผู้รับนักเรียน และคอร์สที่ลงทะเบียนไว้ในโปรไฟล์</p></div><span className="benefit-arrow" aria-hidden="true">↗</span></article>
            <article className="benefit-row"><span className="benefit-number">02</span><div><h3>ต่อข้อมูลไปถึงคอร์ส ครู และตารางเรียน</h3><p>เห็นผู้สอน รอบเรียน ห้องเรียน และรายชื่อนักเรียนของแต่ละคอร์ส</p></div><span className="benefit-arrow" aria-hidden="true">↗</span></article>
            <article className="benefit-row"><span className="benefit-number">03</span><div><h3>ปิดงานด้วยเช็กชื่อและการเงิน</h3><p>บันทึกการเข้าเรียน รับชำระ ตรวจสลิป และเปิดดูประวัติได้โดยไม่ต้องไล่หลายสมุด</p></div><span className="benefit-arrow" aria-hidden="true">↗</span></article>
          </div>
        </section>

        <section className="closing-invite">
          <FoxSticker className="closing-mascot" mood="celebrate" alt="สุนัขจิ้งจอกมาสคอตยกมือฉลอง พร้อมเริ่มจัดการงานสถาบัน" />
          <div><p className="section-label">ระบบจัดการสำหรับทีมสถาบัน</p><h2>พร้อมจัดการงานสถาบัน<br />ให้เป็นระบบขึ้นหรือยัง?</h2></div>
          <a className="button-primary" href="https://acadamy-frontend-3nao-mu.vercel.app/login">เข้าสู่ระบบ <span aria-hidden="true">→</span></a>
        </section>
      </main>

      <footer className="market-footer">
        <a className="footer-brand" href="#top"><img src="/tiwhub-mark.svg" alt="" />tiwhub</a>
        <span>ระบบช่วยจัดการสถาบันกวดวิชา</span>
        <a href="https://acadamy-frontend-3nao-mu.vercel.app/login">เข้าสู่ระบบ</a>
      </footer>
    </div>
  );
}
