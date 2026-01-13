/**
 * POST /api/whatsapp/generate-link
 * 
 * Generates a WhatsApp link for messaging
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/whatsapp/generate-link
 * Headers: Authorization: Bearer <token>
 * Body: { "phone_number": "+1234567890", "message": "Optional message" }
 * 
 * RESPONSE:
 * {
 *   "whatsapp_url": "https://wa.me/1234567890?text=..."
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { generateWhatsAppLink } from '@/lib/whatsapp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await authenticateRequest(authHeader);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone_number, message } = body;

    if (!phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const whatsappUrl = generateWhatsAppLink(phone_number, message);

    return NextResponse.json({
      whatsapp_url: whatsappUrl,
    });
  } catch (error) {
    console.error('WhatsApp link generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
