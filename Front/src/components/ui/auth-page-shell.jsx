import { route } from 'preact-router';
import { Button } from './button';
import { useDesignTheme } from '../../hooks/useDesignTheme';

export function AuthPageShell({ navActionLabel, navActionHref, children }) {
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  return (
    <div class={'min-h-screen flex items-center justify-center pt-24 pb-10 px-6 ' + (isNeo ? 'bg-[#FAF3E0]' : 'bg-oasis-bg')}>
      <nav class={'fixed top-0 left-0 right-0 z-10 ' + (isNeo ? 'bg-white border-b-3 border-black' : 'bg-white/80 backdrop-blur-lg border-b border-zinc-200/60')}>
        <div class="container mx-auto px-6 py-4 flex items-center justify-between">
          <span class="text-xl font-semibold text-zinc-900 tracking-tight cursor-pointer" onClick={() => route('/')}>
            <span class="flex items-center gap-2">
              <span class={'w-6 h-6 inline-block ' + (isNeo ? 'bg-black border-2 border-black' : 'bg-oasis-primary rounded-full')} />
              TiwHub
            </span>
          </span>
          {navActionLabel && navActionHref && (
            <Button variant="outline" size="sm" onClick={() => route(navActionHref)}>{navActionLabel}</Button>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}