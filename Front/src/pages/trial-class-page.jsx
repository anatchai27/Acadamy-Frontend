import { useState } from 'preact/hooks';
import { createPublicLead } from '../services/lead-service';

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
    <main class="min-h-screen bg-deep-navy px-6 py-16 text-white">
      <section class="mx-auto max-w-2xl rounded-3xl border border-mist-blue/10 bg-white/5 p-8 shadow-2xl">
        <p class="mb-3 text-sm uppercase tracking-[0.25em] text-sky-blue">Trial class</p>
        <h1 class="mb-3 text-4xl font-bold">Book a free trial class</h1>
        <p class="mb-8 text-mist-blue/70">Leave your details and the institute team will contact you.</p>

        <form class="grid gap-5" onSubmit={submit}>
          {[
            ['instituteSlug', 'Institute slug', true],
            ['contactName', 'Contact name', true],
            ['phone', 'Phone', true],
            ['email', 'Email', false],
            ['studentName', 'Student name', false],
            ['courseInterest', 'Course interest', false],
          ].map(([name, label, required]) => (
            <label class="grid gap-2 text-sm" key={name}>
              <span class="text-mist-blue/80">{label}</span>
              <input
                class="rounded-xl border border-mist-blue/15 bg-deep-navy/60 px-4 py-3 text-white outline-none focus:border-sky-blue"
                name={name}
                value={form[name]}
                required={required}
                type={name === 'email' ? 'email' : 'text'}
                onInput={update}
              />
            </label>
          ))}

          <label class="grid gap-2 text-sm">
            <span class="text-mist-blue/80">Message</span>
            <textarea
              class="min-h-28 rounded-xl border border-mist-blue/15 bg-deep-navy/60 px-4 py-3 text-white outline-none focus:border-sky-blue"
              name="message"
              value={form.message}
              onInput={update}
            />
          </label>

          <button class="rounded-xl bg-sky-blue px-5 py-3 font-semibold text-deep-navy disabled:opacity-50" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Sending...' : 'Request trial class'}
          </button>
          {state.message && <p class={state.status === 'error' ? 'text-red-300' : 'text-emerald-300'} role="status">{state.message}</p>}
        </form>
      </section>
    </main>
  );
}
