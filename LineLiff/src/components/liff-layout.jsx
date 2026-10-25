import { route } from 'preact-router';

export const LiffLayout = ({ children, showBack }) => {
  return (
    <div class="mx-auto min-h-[100dvh] max-w-lg bg-sage-50 text-ink-900 sm:border-x sm:border-sage-100">
      {showBack && (
        <header class="sticky top-0 z-10 border-b border-sage-100 bg-white">
          <div class="flex h-12 items-center px-4">
            <button
              onClick={() => window.history.length > 1 ? window.history.back() : route('/liff/dashboard')}
              class="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-sage-700 transition hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"
              aria-label="กลับหน้าก่อนหน้า"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <img src="/tiwhub-mark.svg" alt="tiwhub" class="ml-1 h-7 w-7 rounded-lg" />
            <p class="ml-1 text-sm font-bold tracking-tight text-ink-900">tiwhub <span class="font-medium text-ink-500">สำหรับครอบครัว</span></p>
          </div>
        </header>
      )}
      <main class="p-4 pb-24 sm:p-5 sm:pb-24">
        {children}
      </main>
    </div>
  );
};
