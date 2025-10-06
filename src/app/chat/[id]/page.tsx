'use client';

import { useEffect, useState } from 'react';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Msg = { id: number; sender: string; body: string; created_at: string };

export default function Chat({ params }: { params: { id: string } }) {
  const matchId = Number(params.id);
  const [me, setMe] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const client = supabase();

    (async () => {
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        location.href = '/auth';
        return;
      }
      setMe(user.id);

      // Load existing messages
      const { data } = await client
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      setMsgs(data ?? []);

      // Realtime: new messages
      const channel = client
        .channel(`chat:${matchId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
          (payload: RealtimePostgresInsertPayload<Msg>) => {
            setMsgs((m) => [...m, payload.new]);
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    })();
  }, [matchId]);

  async function send() {
    if (!text.trim() || !me) return;
    const body = text.trim();
    setText('');
    const { error } = await supabase()
      .from('messages')
      .insert({ match_id: matchId, sender: me, body });
    if (error) alert(error.message);
  }

  return (
    <main className="mx-auto max-w-md h-svh flex flex-col">
      <div className="p-4 border-b font-semibold">Chat</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.map((m) => {
          const isMine = m.sender === me;
          const bubble =
            `max-w-[80%] rounded px-3 py-2 leading-relaxed ` +
            (isMine ? 'ml-auto bg-black text-white' : 'bg-gray-800 text-gray-100');
          return (
            <div key={m.id} className={bubble}>
              {m.body}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button onClick={send} className="rounded bg-black text-white px-4">
          Send
        </button>
      </div>
    </main>
  );
}
