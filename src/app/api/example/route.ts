import type { NextRequest } from 'next/server';

export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ message: 'API endpoint' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
