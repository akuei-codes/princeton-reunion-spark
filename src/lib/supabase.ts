
import { createClient, StorageError } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxopipsilxpcoyhkpfbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b3BpcHNpbHhwY295aGtwZmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzI0MjcsImV4cCI6MjA2MjI0ODQyN30.BTkUmlh6BT1uLxwjiPkPCP6XoTzzcPKdAEhsFltThWE';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'apikey': supabaseAnonKey,  // Add the API key explicitly to ensure authorization
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to check if a bucket exists and create if needed
// Improved with more robust error handling
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking if bucket "${bucketName}" exists...`);
    
    // First check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      
      // Check if this is an authorization error - using status code since StorageError might not have code property
      if (listError.message?.includes('JWT') || listError.status === 401) {
        console.error('Authorization error. User may not be logged in properly.');
        return false;
      }
      
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    // If bucket already exists, return true - no need to create it
    if (bucketExists) {
      console.log(`Bucket "${bucketName}" already exists.`);
      return true;
    }
    
    console.log(`Creating bucket: "${bucketName}"...`);

    // Create bucket with public access
    const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true, 
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      
      // Special handling for RLS policy errors
      if (createError.message?.includes('policy')) {
        console.error('RLS Policy Error: You need to enable bucket creation in Supabase dashboard');
        console.error('Please check your storage.buckets table policies in the Supabase dashboard');
        alert('Unable to create storage bucket due to permissions. Please contact admin.');
        return false;
      }
      
      return false;
    }
    
    console.log(`Successfully created bucket "${bucketName}".`);
    return true;
  } catch (error) {
    console.error('Unexpected error ensuring bucket exists:', error);
    return false;
  }
};

// Helper function to check user table permissions
export const checkUserTableAccess = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Error accessing users table:', error);
      
      if (error.message?.includes('policy') || error.code === '42501') {
        console.error('RLS Policy Error: You need to configure RLS policies for the users table');
        return false;
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error checking user table access:', error);
    return false;
  }
};
