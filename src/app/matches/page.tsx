'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type MatchRow = { id: number; user_a: string; user_b: string; created_at: string };
type Profile = { id: string; display_name: string | null };

export default function Matches() {
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [peers, setPeers] = useState<Record<string, Profile>>({});

  useEffect(() => {
    const client = supabase();
    (async () => {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return location.replace('/auth');
      setMe(user.id);

      const { data: matches } = await client
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      setRows(matches ?? []);

      const otherIds = (matches ?? []).map(m => m.user_a === user.id ? m.user_b : m.user_a);
      if (otherIds.length) {
        const { data: profs } = await client
          .from('profiles').select('id, display_name').in('id', otherIds);
        const map: Record<string, Profile> = {};
        (profs ?? []).forEach(p => { map[p.id] = p; });
        setPeers(map);
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-md p-6 space-y-3">
      <h1 className="text-xl font-semibold">Matches</h1>
      {rows.map(m => {
        const other = me && (m.user_a === me ? m.user_b : m.user_a);
        const name = other ? (peers[other]?.display_name ?? 'Someone') : 'Someone';
        return (
          <a key={m.id} href={`/chat/${m.id}`} className="block border rounded-xl p-3">
            {name}
          </a>
        );
      })}
      {rows.length === 0 && <p>No matches yet.</p>}
    </main>
  );
}
