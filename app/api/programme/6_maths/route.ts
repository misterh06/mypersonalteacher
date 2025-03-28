//app/api/programme/6_math/

import programme6 from './6_maths.json';

export async function GET() {
  return new Response(JSON.stringify(programme6), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
