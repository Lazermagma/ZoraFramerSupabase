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

    // Verify user is buyer, agent, or admin (agents can also create applications for testing/auto-created listings)
    if (user.role !== 'buyer' && user.role !== 'admin' && user.role !== 'agent') {
      return NextResponse.json(
        { error: 'Only buyers, agents, and admins can submit applications' },
        { status: 403 }
      );
    }

    // Parse request body with error handling
    let body: CreateApplicationRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { 
      listing_id,
      property_id,  // Alternative field name
      property,     // Alternative field name
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

    // Support alternative field names for listing_id
    let finalListingId = listing_id || property_id || property;

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
      // Filter out null/undefined/empty values
      documentsArray.push(...documents.filter((doc): doc is string => Boolean(doc && typeof doc === 'string')));
    }
    if (government_approved && typeof government_approved === 'string') {
      documentsArray.push(government_approved);
    }
    if (job_letter && typeof job_letter === 'string') {
      documentsArray.push(job_letter);
    }

    // Auto-create listing if listing_id is not provided
    if (!finalListingId) {
      console.log('No listing_id provided, auto-creating listing...');
      
      // Determine agent_id for the new listing
      let agentIdForListing: string | undefined;
      
      if (user.role === 'agent') {
        // If user is an agent, use their ID
        agentIdForListing = user.id;
        console.log('Using authenticated agent ID:', agentIdForListing);
      } else {
        // If user is a buyer, find the first available agent
        console.log('User is buyer, searching for agents...');
        const { data: firstAgent, error: agentError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('role', 'agent')
          .limit(1)
          .single();
        
        if (agentError || !firstAgent) {
          console.log('No agent found with .single(), trying array query...', agentError?.message);
          // If no agent found, try to find any agent (without single)
          const { data: agents } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('role', 'agent')
            .limit(1);
          
          if (!agents || agents.length === 0) {
            // No agents exist - create a system agent automatically
            console.log('No agents found in database, creating system agent...');
            
            // Check if system agent already exists (by email)
            const { data: existingSystemAgent } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('email', 'system@zora.property')
              .maybeSingle();
            
            if (existingSystemAgent) {
              agentIdForListing = existingSystemAgent.id;
              console.log('Found existing system agent:', agentIdForListing);
            } else {
              console.log('Creating new system agent in Auth...');
              // Create system agent in Supabase Auth first
              const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: 'system@zora.property',
                password: crypto.randomUUID(), // Random password, won't be used
                email_confirm: true,
                user_metadata: {
                  role: 'agent',
                  first_name: 'System',
                  last_name: 'Agent',
                  name: 'System Agent'
                }
              });
              
              if (authError || !authUser.user) {
                console.error('Error creating system agent in auth:', authError);
                return NextResponse.json(
                  { 
                    error: 'Failed to create system agent. Please contact support.',
                    details: authError?.message || 'Unknown error'
                  },
                  { status: 500 }
                );
              }
              
              console.log('System agent created in Auth, ID:', authUser.user.id);
              console.log('Creating system agent in users table...');
              
              // Create system agent in users table
              const { data: systemAgent, error: userError } = await supabaseAdmin
                .from('users')
                .insert({
                  id: authUser.user.id,
                  email: 'system@zora.property',
                  role: 'agent',
                  first_name: 'System',
                  last_name: 'Agent',
                  name: 'System Agent',
                  account_status: 'active'
                })
                .select('id')
                .single();
              
              if (userError || !systemAgent) {
                console.error('Error creating system agent in users table:', userError);
                return NextResponse.json(
                  { 
                    error: 'Failed to create system agent in database. Please contact support.',
                    details: userError?.message || 'Unknown error'
                  },
                  { status: 500 }
                );
              }
              
              agentIdForListing = systemAgent.id;
              console.log('System agent successfully created:', agentIdForListing);
            }
          } else {
            agentIdForListing = agents[0].id;
            console.log('Found agent from array query:', agentIdForListing);
          }
        } else {
          agentIdForListing = firstAgent.id;
          console.log('Found agent with .single():', agentIdForListing);
        }
      }

      // Final safety check - ensure agentIdForListing is set
      if (!agentIdForListing) {
        console.error('CRITICAL: agentIdForListing is still undefined after all checks');
        return NextResponse.json(
          { 
            error: 'Failed to determine agent for listing. Please provide a listing_id or contact support.',
            debug: {
              user_role: user.role,
              user_id: user.id
            }
          },
          { status: 500 }
        );
      }

      // Create a minimal draft listing
      const listingTitle = property_type || application_type 
        ? `Property Application - ${property_type || application_type}` 
        : 'Property Application';
      
      const listingDescription = message 
        ? `Application: ${message}` 
        : 'Property application submitted by buyer';
      
      // Use budget information to estimate price if available
      let estimatedPrice = 100000; // Default price
      const purchaseBudgetValue = purchase_budget || purchase_budget_range;
      if (purchaseBudgetValue) {
        // Try to extract numeric value from budget range (e.g., "J$20M–J$40M" -> 20000000)
        const budgetStr = purchaseBudgetValue.toString();
        const match = budgetStr.match(/J?\$?(\d+\.?\d*)[M]?/i);
        if (match) {
          const num = parseFloat(match[1]);
          estimatedPrice = num >= 1 ? num * 1000000 : num * 1000; // Assume M means million
        }
      } else if (budget_range) {
        // For rent, extract monthly rent estimate
        const budgetStr = budget_range.toString();
        const match = budgetStr.match(/J?\$?(\d+\.?\d*)/);
        if (match) {
          estimatedPrice = parseFloat(match[1]) * 12; // Annual estimate
        }
      }

      const { data: newListing, error: createListingError } = await supabaseAdmin
        .from('listings')
        .insert({
          agent_id: agentIdForListing,
          title: listingTitle,
          description: listingDescription,
          price: estimatedPrice,
          location: parish || country || 'Location TBD',
          property_type: application_type === 'Buy' ? 'Buy' : (application_type === 'Rent' ? 'Rent' : null),
          status: 'draft', // Create as draft, can be updated later
          views: 0,
        })
        .select('id, agent_id, status')
        .single();

      if (createListingError || !newListing) {
        console.error('Error auto-creating listing:', createListingError);
        return NextResponse.json(
          { error: 'Failed to create listing automatically', details: createListingError?.message },
          { status: 500 }
        );
      }

      finalListingId = newListing.id;
      console.log('Auto-created listing:', finalListingId);
    }

    // Verify listing exists
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, agent_id, status')
      .eq('id', finalListingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Allow applications to draft listings (auto-created listings are drafts)
    // Only require approval for existing listings
    if (listing.status !== 'approved' && listing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Listing is not available for applications' },
        { status: 400 }
      );
    }

    // Update user profile if form fields are provided (non-blocking)
    if (first_name || last_name || phone || country || parish) {
      try {
        // Fetch current user data to get existing name fields
        const { data: currentUserData } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name, name')
          .eq('id', user.id)
          .single();

        const userUpdateData: any = {};
        if (first_name !== undefined) userUpdateData.first_name = first_name;
        if (last_name !== undefined) userUpdateData.last_name = last_name;
        if (phone !== undefined) userUpdateData.phone = phone;
        if (country !== undefined) userUpdateData.country_of_residence = country;
        if (parish !== undefined) userUpdateData.parish = parish;
        
        // Auto-generate name from first_name and last_name if not provided
        if (first_name || last_name) {
          const newFirstName = first_name || currentUserData?.first_name || '';
          const newLastName = last_name || currentUserData?.last_name || '';
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
      .eq('listing_id', finalListingId)
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
    const finalBudgetRange = application_type === 'Buy' ? null : (budget_range || null);
    const finalPurchaseBudget = application_type === 'Buy' ? (mappedPurchaseBudget || null) : null;

    // Create application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .insert({
        listing_id: finalListingId,
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
