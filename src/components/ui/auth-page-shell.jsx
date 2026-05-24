import { route } from 'preact-router';
import { Button } from './button';

/**
 * AuthPageShell
 * โครงหน้า auth ทุกหน้า: พื้นหลัง + fixed nav (logo + action button) + centered content
 *
 * Props:
 *   navActionLabel  — ข้อความปุ่มมุมขวา nav
 *   navActionHref   — route ที่ปุ่มนั้น route ไป
 *   children        — เนื้อหาของหน้า (AuthFormLayout)
 */
export function AuthPageShell({ navActionLabel, navActionHref, children }) {
  return (
    <div class="min-h-screen bg-slate-50 flex items-center justify-center pt-24 pb-10 px-6">
      <nav class="fixed top-0 left-0 right-0 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 z-10">
        <div class="container mx-auto px-6 py-4 flex items-center justify-between">
          <span
            class="text-xl font-bold text-slate-900 tracking-tight cursor-pointer"
            onClick={() => route('/')}
          >
            TiwHub
          </span>
          {navActionLabel && navActionHref && (
            <Button variant="outline" size="sm" onClick={() => route(navActionHref)}>
              {navActionLabel}
            </Button>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
