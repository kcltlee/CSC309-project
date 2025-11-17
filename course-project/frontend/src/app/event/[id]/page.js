export default function EventDetailPage({ params }) {
  const { id } = params || {};
  return (
    <main>
      <h1>Event {id}</h1>
    </main>
  );
}
