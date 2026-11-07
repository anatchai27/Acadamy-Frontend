import { useState } from 'preact/hooks';
import { createPublicLead } from '../services/lead-service';
import { LanguageSwitcher } from '../components/ui/language-switcher';

const initialForm = {
  instituteSlug: '',
  contactName: '',
  phone: '',
  email: '',
  studentName: '',
  courseInterest: '',
  message: '',
};

export function TrialClassPage() {
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: 'idle', message: '' });

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();

    const requiredFields = [
      ['instituteSlug', 'Institute slug'],
      ['contactName', 'Contact name'],
      ['phone', 'Phone'],
    ];
    const missingField = requiredFields.find(([name]) => !form[name].trim());
    if (missingField) {
      setState({ status: 'error', message: `${missingField[1]} is required.` });
      return;
    }

    setState({ status: 'loading', message: '' });

    try {
      await createPublicLead(Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      ));
      setForm(initialForm);
      setState({ status: 'success', message: 'Your request has been received.' });
    } catch (error) {
      setState({ status: 'error', message: error.message });
    }
  };

  return (
    <main class="min-h-screen bg-oasis-bg px-4 py-8 text-oasis-navy sm:px-6 sm:py-12">
      <nav class="mx-auto mb-6 flex w-full max-w-2xl items-center justify-between gap-4">
        <a href="/" class="inline-flex min-w-0 items-center gap-2 font-bold text-oasis-navy" aria-label="tiwhub home">
          <img src="/tiwhub-mark.svg" alt="" class="h-9 w-9 shrink-0 rounded-xl" />
          <span class="truncate text-lg">tiwhub</span>
        </a>
        <LanguageSwitcher />
      </nav>
      <section class="mx-auto max-w-2xl rounded-2xl border border-oasis-border bg-white p-5 shadow-sm sm:p-8">
        <p class="mb-2 text-xs font-bold uppercase tracking-wider text-oasis-primary">Trial class</p>
        <h1 class="mb-3 text-3xl font-bold leading-tight text-oasis-navy sm:text-4xl">Book a free trial class</h1>
        <p class="mb-8 text-oasis-body">Leave your details and the institute team will contact you.</p>

        <form class="grid gap-5" onSubmit={submit}>
          {[
            ['instituteSlug', 'Institute slug', true],
            ['contactName', 'Contact name', true],
            ['phone', 'Phone', true],
            ['email', 'Email', false],
            ['studentName', 'Student name', false],
            ['courseInterest', 'Course interest', false],
          ].map(([name, label, required]) => (
            <label class="grid gap-2 text-sm font-semibold text-oasis-navy" key={name}>
              <span>{label}</span>
              <input
                class="min-h-11 rounded-xl border border-oasis-border bg-white px-4 py-3 text-oasis-navy placeholder:text-oasis-muted focus:border-oasis-primary focus:outline-none focus:ring-2 focus:ring-oasis-primary/15"
                name={name}
                value={form[name]}
                required={required}
                type={name === 'email' ? 'email' : 'text'}
                onInput={update}
              />
            </label>
          ))}

          <label class="grid gap-2 text-sm font-semibold text-oasis-navy">
            <span>Message</span>
            <textarea
              class="min-h-28 resize-y rounded-xl border border-oasis-border bg-white px-4 py-3 text-oasis-navy placeholder:text-oasis-muted focus:border-oasis-primary focus:outline-none focus:ring-2 focus:ring-oasis-primary/15"
              name="message"
              value={form.message}
              onInput={update}
            />
          </label>

          <button class="min-h-11 rounded-xl bg-oasis-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-oasis-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Sending...' : 'Request trial class'}
          </button>
          {state.message && <p class={`rounded-xl border px-4 py-3 text-sm ${state.status === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`} role="status">{state.message}</p>}
        </form>
      </section>
    </main>
  );
}
