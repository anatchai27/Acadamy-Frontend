import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Button, Input } from '../../components/ui';
import { Card } from '../../components/ui';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-deep-navy via-ocean-blue to-deep-navy flex items-center justify-center p-6">
      <nav class="fixed top-0 left-0 right-0 container mx-auto px-6 py-6 flex items-center justify-between z-10">
        <span class="text-xl font-bold text-mist-blue tracking-tight cursor-pointer" onClick={() => route('/')}>AcadamyFront</span>
        <Button variant="primary" size="sm" onClick={() => route('/register')}>
          Get Started
        </Button>
      </nav>

      <Card class="w-full max-w-sm p-10" hover={false}>
        <h2 class="text-3xl font-semibold text-white mb-2">Welcome Back</h2>
        <p class="text-mist-blue/50 text-sm mb-8">Sign in to continue your learning journey</p>
        <form onSubmit={handleSubmit} class="flex flex-col gap-5">
          <Input
            type="email"
            label="Email"
            id="email"
            value={email}
            onInput={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <Input
            type="password"
            label="Password"
            id="password"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <Button variant="primary" size="md" type="submit" class="w-full mt-2">
            Sign In
          </Button>
        </form>
        <p class="mt-6 text-center text-sm text-mist-blue/50">
          Don't have an account?{' '}
          <button class="text-sky-blue font-medium hover:underline bg-transparent border-none cursor-pointer text-sm" onClick={() => route('/register')}>
            Sign up
          </button>
        </p>
      </Card>
    </div>
  );
}
