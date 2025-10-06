export default function Home() {
  return (
    <main className="min-h-screen grid gap-4 place-items-center">
      <a href="/auth" className="px-4 py-2 rounded bg-black text-white">Get started</a>
      <a href="/feed" className="px-4 py-2 rounded border">Open feed</a>
      <a href="/matches" className="px-4 py-2 rounded border">Matches</a>
    </main>
  );
}
