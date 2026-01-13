-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- This creates the documents storage bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false, -- Private bucket
    10485760, -- 10MB file size limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access documents"
ON storage.objects FOR ALL
USING (
    bucket_id = 'documents' 
    AND auth.role() = 'service_role'
);
