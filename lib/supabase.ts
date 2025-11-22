import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dymxgsqknumqmppuxmxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bXhnc3FrbnVtcW1wcHV4bXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDc3NjIsImV4cCI6MjA3OTMyMzc2Mn0.LYfOZ1YMkmytVidYwqtAARgaTJVO3XS0rNM6x3CBHPM';

export const supabase = createClient(supabaseUrl, supabaseKey);
