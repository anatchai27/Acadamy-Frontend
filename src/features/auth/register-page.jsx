import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Button, Input } from '../../components/ui';
import { Card } from '../../components/ui';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Register:', { name, email, password });
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-deep-navy via-ocean-blue to-deep-navy flex items-center justify-center p-6">
      <nav class="fixed top-0 left-0 right-0 container mx-auto px-6 py-6 flex items-center justify-between z-10">
        <span class="text-xl font-bold text-mist-blue tracking-tight cursor-pointer" onClick={() => route('/')}>AcadamyFront</span>
        <Button variant="ghost" size="sm" onClick={() => route('/login')}>
          Sign In
        </Button>
      </nav>

      <Card class="w-full max-w-sm p-10" hover={false}>
        <h2 class="text-3xl font-semibold text-white mb-2">Create Account</h2>
        <p class="text-mist-blue/50 text-sm mb-8">Sign up to start learning today</p>
        <form onSubmit={handleSubmit} class="flex flex-col gap-5">
          <Input
            type="text"
            label="Name"
            id="name"
            value={name}
            onInput={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
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
            placeholder="Create a password"
          />
          <Input
            type="password"
            label="Confirm Password"
            id="confirmPassword"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
          />
          <Button variant="primary" size="md" type="submit" class="w-full mt-2">
            Sign Up
          </Button>
        </form>
        <p class="mt-6 text-center text-sm text-mist-blue/50">
          Already have an account?{' '}
          <button class="text-sky-blue font-medium hover:underline bg-transparent border-none cursor-pointer text-sm" onClick={() => route('/login')}>
            Sign in
          </button>
        </p>
      </Card>
    </div>
  );
}
