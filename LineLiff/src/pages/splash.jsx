export const SplashPage = () => {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-oasis-50 text-oasis-navy">
      <img src="/tiwhub-mark.svg" alt="tiwhub" class="mb-5 h-16 w-16 rounded-2xl shadow-soft" />
      <div class="mb-4 h-8 w-8 animate-spin rounded-full border-3 border-oasis-200 border-t-oasis-600" />
      <p class="text-base font-semibold">กำลังเตรียมข้อมูลให้คุณ...</p>
    </div>
  );
};
