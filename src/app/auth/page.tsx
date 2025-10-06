'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function sendLink() {
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/onboarding` }
    });
    if (error) alert(error.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <>
          <input
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border rounded p-2 mb-3"
          />
          <button onClick={sendLink} className="w-full rounded bg-black text-white py-2">
            Send magic link
          </button>
        </>
      )}
    </main>
  );
}
