import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://exhfpeeslhjpvfmbonyz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aGZwZWVzbGhqcHZmbWJvbnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzEyOTcsImV4cCI6MjA3OTQwNzI5N30.zwLuyDV8vuZhH0vSl22CmK0QxXHyzY3jcJMNA2wt-zo'

export const supabase = createClient(supabaseUrl, supabaseKey)
