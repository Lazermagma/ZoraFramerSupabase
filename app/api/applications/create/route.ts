/**
 * POST /api/applications/create
 * 
 * Creates a new application (Buyer-only)
 * 
 * FRAMER REQUEST:
 * POST https://your-api.vercel.app/api/applications/create
 * Headers: Authorization: Bearer <token>
 * Body: { "listing_id": "...", "message": "...", "documents": [...] }
 * 
 * RESPONSE:
 * {
 *   "application": { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CreateApplicationRequest } from '@/types/application';

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

    const user = authResult.user;

    // Verify user is buyer
    if (user.role !== 'buyer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only buyers can submit applications' },
        { status: 403 }
      );
    }

    const body: CreateApplicationRequest = await request.json();
    const { 
      listing_id, 
      message,
      // Form field names
      application_type,
      property_type,
      first_name,
      last_name,
      email,
      phone,
      country,
      parish,
      employment_status,
      monthly_income,
      budget_range,
      purchase_budget,
      intended_income,
      government_approved,
      job_letter,
      checkbox1,
      checkbox2,
      checkbox3,
      // Direct field names (for backward compatibility)
      documents,
      employment_status_direct,
      monthly_income_range,
      purchase_budget_range,
      intended_move_in_timeframe,
      declaration_application_not_approval,
      declaration_prepared_to_provide_docs,
      declaration_actively_looking
    } = body;

    // Map form fields to database columns
    const mappedEmploymentStatus = employment_status_direct || employment_status;
    const mappedMonthlyIncome = monthly_income_range || monthly_income;
    const mappedPurchaseBudget = purchase_budget_range || purchase_budget;
    const mappedIntendedTimeframe = intended_move_in_timeframe || intended_income;
    
    // Map checkbox fields to declarations
    const mappedDeclaration1 = declaration_application_not_approval !== undefined 
      ? declaration_application_not_approval 
      : checkbox1;
    const mappedDeclaration2 = declaration_prepared_to_provide_docs !== undefined 
      ? declaration_prepared_to_provide_docs 
      : checkbox2;
    const mappedDeclaration3 = declaration_actively_looking !== undefined 
      ? declaration_actively_looking 
      : checkbox3;

    // Build documents array from form fields
    const documentsArray: string[] = [];
    if (documents && Array.isArray(documents)) {
      documentsArray.push(...documents);
    }
    if (government_approved) {
      documentsArray.push(government_approved);
    }
    if (job_letter) {
      documentsArray.push(job_letter);
    }

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Missing required field: listing_id' },
        { status: 400 }
      );
    }

    // Verify listing exists and is approved
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, agent_id, status')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.status !== 'approved') {
      return NextResponse.json(
        { error: 'Listing is not available for applications' },
        { status: 400 }
      );
    }

    // Update user profile if form fields are provided (non-blocking)
    if (first_name || last_name || phone || country || parish) {
      try {
        const userUpdateData: any = {};
        if (first_name !== undefined) userUpdateData.first_name = first_name;
        if (last_name !== undefined) userUpdateData.last_name = last_name;
        if (phone !== undefined) userUpdateData.phone = phone;
        if (country !== undefined) userUpdateData.country_of_residence = country;
        if (parish !== undefined) userUpdateData.parish = parish;
        
        // Auto-generate name from first_name and last_name if not provided
        if (first_name || last_name) {
          const currentName = user.name || '';
          const newFirstName = first_name || user.first_name || '';
          const newLastName = last_name || user.last_name || '';
          if (newFirstName || newLastName) {
            userUpdateData.name = `${newFirstName} ${newLastName}`.trim();
          }
        }

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(userUpdateData)
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating user profile:', updateError);
          // Continue with application creation even if profile update fails
        }
      } catch (error) {
        console.error('Error updating user profile:', error);
        // Continue with application creation even if profile update fails
      }
    }

    // Check if buyer already applied
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', user.id)
      .single();

    if (existingApp && !checkError) {
      return NextResponse.json(
        { error: 'You have already applied to this listing' },
        { status: 400 }
      );
    }

    // Determine budget field based on application_type
    // If application_type is "Rent", use budget_range; if "Buy", use purchase_budget_range
    const finalBudgetRange = application_type === 'Buy' ? null : budget_range;
    const finalPurchaseBudget = application_type === 'Buy' ? mappedPurchaseBudget : null;

    // Create application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .insert({
        listing_id,
        buyer_id: user.id,
        agent_id: listing.agent_id,
        status: 'submitted',
        message: message || null,
        documents: documentsArray.length > 0 ? documentsArray : [],
        // Financial & Employment Info
        employment_status: mappedEmploymentStatus || null,
        monthly_income_range: mappedMonthlyIncome || null,
        budget_range: finalBudgetRange || null,
        purchase_budget_range: finalPurchaseBudget || null,
        intended_move_in_timeframe: mappedIntendedTimeframe || null,
        // Declarations
        declaration_application_not_approval: mappedDeclaration1 || false,
        declaration_prepared_to_provide_docs: mappedDeclaration2 || false,
        declaration_actively_looking: mappedDeclaration3 || false,
      })
      .select()
      .single();

    if (appError) {
      return NextResponse.json(
        { error: 'Failed to create application', details: appError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { application },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
