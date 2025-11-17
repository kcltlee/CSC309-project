export default function EventAwardPage({ params }) {
  const { id } = params || {};
  return (
    <main>
      <h1>Award for Event {id}</h1>
    </main>
  );
}
