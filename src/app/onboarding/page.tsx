'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Onboarding() {
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => {
      if (!data.user) location.href = '/auth';
      setLoading(false);
    });
  }, []);

  async function save() {
    const client = supabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { error } = await client
      .from('profiles')
      .upsert({ id: user.id, display_name: displayName, city }, { onConflict: 'id' });

    if (error) return alert(error.message);
    location.href = '/';
  }

  if (loading) return <main className="p-6">Loading…</main>;

  return (
    <main className="mx-auto max-w-md p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      <input
        className="w-full border rounded p-2"
        placeholder="Display name"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
      />
      <input
        className="w-full border rounded p-2"
        placeholder="City"
        value={city}
        onChange={e => setCity(e.target.value)}
      />
      <button onClick={save} className="rounded bg-black text-white px-4 py-2">
        Save
      </button>
    </main>
  );
}
