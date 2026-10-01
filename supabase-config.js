// supabase-config.js
const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'; 
const supabaseKey = 'sb_publishable__TXkovSYBzRCrc9XKB72jA_4GDcZC1-'; 

// Make it available on any page
window.db = supabase.createClient(supabaseUrl, supabaseKey);
