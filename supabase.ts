
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

// Linking to provided Supabase project
const supabaseUrl = 'https://eflgcovylijyicngbxdp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbGdjb3Z5bGlqeWljbmdieGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTcyMjUsImV4cCI6MjA4NDMzMzIyNX0.2adGCd-2lYQmhPqsQXP1ivPzsfo4QnyXOGNXYypOgz4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
