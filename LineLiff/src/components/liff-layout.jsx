import { route } from 'preact-router';

export const LiffLayout = ({ children, showBack }) => {
  return (
    <div class="mx-auto min-h-screen max-w-lg bg-sage-50 text-ink-900">
      {showBack && (
        <header class="sticky top-0 z-10 border-b border-white/70 bg-white/75 backdrop-blur-lg">
          <div class="flex items-center h-12 px-4">
            <button
              onClick={() => window.history.length > 1 ? window.history.back() : route('/liff/dashboard')}
              class="p-1 -ml-1"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p class="text-sm font-semibold ml-2">TiwHub</p>
          </div>
        </header>
      )}
      <main class="p-4 pb-20">
        {children}
      </main>
    </div>
  );
};
