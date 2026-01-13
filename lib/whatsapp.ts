/**
 * WhatsApp integration helper
 * 
 * Generates WhatsApp links for direct messaging
 * No internal chat system - all communication via WhatsApp
 */

/**
 * Generates a WhatsApp link for a user
 * @param phoneNumber - Phone number in international format (e.g., +1234567890)
 * @param message - Optional pre-filled message
 * @returns WhatsApp URL
 */
export function generateWhatsAppLink(phoneNumber: string, message?: string): string {
  // Remove any non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure phone starts with +
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
  
  // Encode message if provided
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  // Generate WhatsApp URL
  const baseUrl = `https://wa.me/${formattedPhone.replace('+', '')}`;
  return encodedMessage ? `${baseUrl}?text=${encodedMessage}` : baseUrl;
}

/**
 * Generates WhatsApp link for agent from listing
 * @param agentPhone - Agent's phone number
 * @param listingTitle - Listing title for pre-filled message
 * @returns WhatsApp URL
 */
export function generateAgentWhatsAppLink(agentPhone: string, listingTitle?: string): string {
  const message = listingTitle 
    ? `Hi, I'm interested in your property: ${listingTitle}`
    : 'Hi, I\'m interested in your property';
  return generateWhatsAppLink(agentPhone, message);
}

/**
 * Generates WhatsApp link for buyer from application
 * @param buyerPhone - Buyer's phone number
 * @param applicationId - Application ID for reference
 * @returns WhatsApp URL
 */
export function generateBuyerWhatsAppLink(buyerPhone: string, applicationId?: string): string {
  const message = applicationId
    ? `Hi, regarding application ${applicationId}`
    : 'Hi, regarding your application';
  return generateWhatsAppLink(buyerPhone, message);
}
