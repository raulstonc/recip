'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Profile = { id: string; display_name: string | null; city: string | null };

export default function Feed() {
  const [me, setMe] = useState<string | null>(null);
  const [cards, setCards] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Build the feed, excluding: me, people I've liked, and people I've matched with
  useEffect(() => {
    const client = supabase();
    (async () => {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return (location.href = '/auth');
      setMe(user.id);

      // who I already liked
      const { data: myLikes } = await client
        .from('likes')
        .select('likee')
        .eq('liker', user.id);

      // who I'm already matched with
      const { data: myMatches } = await client
        .from('matches')
        .select('user_a, user_b');

      const likedIds = new Set((myLikes ?? []).map(l => l.likee));
      const matchedIds = new Set(
        (myMatches ?? []).map(m => (m.user_a === user.id ? m.user_b : m.user_a))
      );

      // Build exclusion list (me + liked + matched)
      const exclude = new Set<string>([user.id, ...likedIds, ...matchedIds]);
      const excludeArr = [...exclude];

      // PostgREST `in()` wants a CSV tuple string: ("id1","id2")
      const inTuple =
        excludeArr.length
          ? `(${excludeArr.map(id => `"${id}"`).join(',')})`
          : '("")'; // harmless no-op

      // Pull candidates not excluded, who finished onboarding (have display_name)
      const { data, error } = await client
        .from('profiles')
        .select('id, display_name, city')
        .not('id', 'in', inTuple)
        .not('display_name', 'is', null)
        .limit(50);

      if (!error) setCards(data ?? []);
      setLoading(false);
    })();
  }, []);

  // Like → insert like; if reverse like exists, create match now (client-side)
  async function like(likee: string) {
    if (!me) return;
    const client = supabase();

    // 1) insert my like
    const { error: likeErr } = await client.from('likes').insert({ liker: me, likee });
    if (likeErr) { alert(likeErr.message); return; }

    // 2) check if they already liked me
    const { data: reverse } = await client
      .from('likes')
      .select('id')
      .eq('liker', likee)
      .eq('likee', me)
      .limit(1)
      .maybeSingle();

    // 3) if mutual, create a match (ordered pair; unique index avoids dupes)
    if (reverse) {
      const a = me < likee ? me : likee;
      const b = me < likee ? likee : me;
      const { error: mErr } = await client.from('matches').insert({ user_a: a, user_b: b });
      if (mErr && !/duplicate key/i.test(mErr.message)) console.error(mErr);
    }

    // 4) remove from UI
    setCards(cs => cs.filter(c => c.id !== likee));
  }

  function pass(id: string) {
    setCards(cs => cs.filter(c => c.id !== id));
  }

  if (loading) return <main className="p-6">Loading…</main>;

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">Feed</h1>
      {cards.length === 0 && <p>No more profiles right now.</p>}

      {cards.map(p => (
        <div key={p.id} className="border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{p.display_name ?? 'Someone'}</div>
            <div className="text-sm text-gray-500">{p.city ?? ''}</div>
          </div>
          <div className="space-x-2">
            <button onClick={() => pass(p.id)} className="px-3 py-1 rounded border">Pass</button>
            <button onClick={() => like(p.id)} className="px-3 py-1 rounded bg-black text-white">Like</button>
          </div>
        </div>
      ))}
    </main>
  );
}
