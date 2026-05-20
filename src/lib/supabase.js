import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://plbnwwbxmkprujpfhfls.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYm53d2J4bWtwcnVqcGZoZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNDI2ODcsImV4cCI6MjA5NDgxODY4N30.Sigg57A6jbZIBGdu-NL9eCYHnB0rSxcKpqiJWxPYCuw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
