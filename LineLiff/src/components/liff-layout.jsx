import { route } from 'preact-router';

export function LiffLayout({ children, showBack }) {
  return (
    <div class="max-w-lg mx-auto min-h-screen bg-gray-50">
      {showBack && (
        <header class="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
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
}