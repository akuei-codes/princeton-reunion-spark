
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxopipsilxpcoyhkpfbr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b3BpcHNpbHhwY295aGtwZmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzI0MjcsImV4cCI6MjA2MjI0ODQyN30.BTkUmlh6BT1uLxwjiPkPCP6XoTzzcPKdAEhsFltThWE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
