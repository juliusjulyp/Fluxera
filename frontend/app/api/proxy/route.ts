/**
 * CORS PROXY FOR LINERA VALIDATORS
 *
 * Proxies requests to Linera validators that don't have CORS enabled.
 * This is needed for the @linera/client WASM module to work in browsers.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the target URL from the request
    const targetUrl = request.headers.get('x-target-url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing x-target-url header' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.arrayBuffer();

    // Forward the request to the target
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/grpc-web+proto',
        'Accept': request.headers.get('accept') || '*/*',
      },
      body: body,
    });

    // Get response data
    const responseData = await response.arrayBuffer();

    // Create response with CORS headers
    const corsResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/grpc-web+proto',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });

    return corsResponse;
  } catch (error) {
    console.error('[CORS Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
