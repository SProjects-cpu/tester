import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvaaeqrbblwwmcchdadl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2YWFlcXJiYmx3d21jY2hkYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTcwMzIsImV4cCI6MjA4MTUzMzAzMn0.kBEZcsQG3_R8S4D4QvNiAfhdqgqDwrHGWLSna_bVl1E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
