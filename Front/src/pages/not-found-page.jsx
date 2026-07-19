import { route } from 'preact-router';
import { Button } from '../components/ui';

export function NotFoundPage() {
  return (
    <div class="min-h-screen bg-oasis-bg flex items-center justify-center px-6">
      <div class="text-center max-w-md">
        <div class="text-7xl font-semibold text-oasis-primary/20 mb-4">404</div>
        <h1 class="text-2xl font-semibold text-zinc-900 mb-2">ไม่พบหน้าที่คุณค้นหา</h1>
        <p class="text-sm text-zinc-500 mb-8">
          หน้าที่คุณกำลังมองหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่ในระบบ
        </p>
        <div class="flex items-center justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => route('/admin/dashboard')}>
            กลับหน้าแรก
          </Button>
          <Button variant="outline" size="md" onClick={() => route('/login')}>
            ไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      </div>
    </div>
  );
}