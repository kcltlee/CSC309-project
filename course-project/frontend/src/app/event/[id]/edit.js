export default function EventEditPage({ params }) {
  const { id } = params || {};
  return (
    <main>
      <h1>Edit Event {id}</h1>
    </main>
  );
}
