/**
 * Root page - API-only project
 * Returns simple message directing to API endpoints
 */

export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Framer-Supabase API Backend</h1>
      <p>This is an API-only backend. Visit <a href="/api">/api</a> for endpoint information.</p>
    </div>
  );
}
