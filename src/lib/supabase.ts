
import { createClient } from '@supabase/supabase-js';

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
    },
  },
  // Add retry options for better reliability
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Simple helper function to check if a bucket exists and create if needed
// This function is intentionally implemented inside this module to avoid circular dependencies
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // First check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      // Create bucket with public access
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, 
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};
