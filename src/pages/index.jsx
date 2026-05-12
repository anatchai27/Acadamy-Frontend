import { route } from 'preact-router';
import { Button, Card } from '../components/ui';

export function IndexPage() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-deep-navy via-ocean-blue to-deep-navy">
      <nav class="container mx-auto px-6 py-6 flex items-center justify-between">
        <span class="text-xl font-bold text-mist-blue tracking-tight">AcadamyFront</span>
        <div class="flex gap-4">
          <Button variant="ghost" size="sm" onClick={() => route('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => route('/register')}>
            Get Started
          </Button>
        </div>
      </nav>

      <main class="container mx-auto px-6 pt-24 pb-32 text-center">
        <div class="max-w-3xl mx-auto mb-20">
          <h1 class="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Learn Smarter,<br />
            <span class="bg-gradient-to-r from-sky-blue to-mist-blue bg-clip-text text-transparent">
              Grow Faster
            </span>
          </h1>
          <p class="text-lg md:text-xl text-mist-blue/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            A modern learning platform built for speed, clarity, and scalability. Start your journey today.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg" onClick={() => route('/register')} class="shadow-lg shadow-sky-blue/20">
              Get Started Free
            </Button>
            <Button variant="secondary" size="lg" onClick={() => route('/login')}>
              Sign In
            </Button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <div class="w-12 h-12 bg-sky-blue/10 rounded-xl flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-sky-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
            <p class="text-sm text-mist-blue/50 leading-relaxed">Built with Preact for minimal bundle size and blazing-fast page loads</p>
          </Card>

          <Card>
            <div class="w-12 h-12 bg-sky-blue/10 rounded-xl flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-sky-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Clean Design</h3>
            <p class="text-sm text-mist-blue/50 leading-relaxed">Minimal UI focused on usability with generous white space and clear hierarchy</p>
          </Card>

          <Card>
            <div class="w-12 h-12 bg-sky-blue/10 rounded-xl flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-sky-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Highly Scalable</h3>
            <p class="text-sm text-mist-blue/50 leading-relaxed">Modular architecture that grows with your needs without unnecessary overhead</p>
          </Card>
        </div>
      </main>

      <footer class="border-t border-mist-blue/10">
        <div class="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between">
          <p class="text-sm text-mist-blue/40">AcadamyFront - Built with Preact & Tailwind</p>
          <div class="flex gap-6 mt-4 md:mt-0">
            <a class="text-sm text-mist-blue/40 hover:text-mist-blue/70 transition-colors" href="#">Privacy</a>
            <a class="text-sm text-mist-blue/40 hover:text-mist-blue/70 transition-colors" href="#">Terms</a>
            <a class="text-sm text-mist-blue/40 hover:text-mist-blue/70 transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
