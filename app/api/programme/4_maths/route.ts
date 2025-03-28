import programme5 from './4_maths.json';

export async function GET() {
  return new Response(JSON.stringify(programme5), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
