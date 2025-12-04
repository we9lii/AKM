import { createClient } from '@supabase/supabase-js';

// =========================================================
// SUPABASE CONFIGURATION
// =========================================================

const supabaseUrl = 'https://gmpzhygncohkukzuvsvc.supabase.co';

// The key provided by the user
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcHpoeWduY29oa3VrenV2c3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDA5NTEsImV4cCI6MjA4MDQxNjk1MX0.d5J9QUS08x95lsBxYGlGy3SHbqwUfbwruuJwvOUNxTQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);