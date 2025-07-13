// Supabase configuration
const SUPABASE_CONFIG = {
  url: "https://msdslsbjhmeysralobmv.supabase.co", // Replace with your Supabase URL
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZHNsc2JqaG1leXNyYWxvYm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTcwMDUsImV4cCI6MjA2Nzk5MzAwNX0.Umw04yKnOJpG62FKkVlj5ZKLCSTpyZexMjjO6ySsCHg", // Replace with your Supabase anon key
};

// Database table schema
const DB_SCHEMA = {
  tableName: "problems",
  columns: {
    id: "text primary key",
    name: "text not null",
    link: "text",
    difficulty: "text not null",
    category: "text not null",
    platform: "text not null",
    date_added: "date not null",
    completed_dates: "text[]",
    created_at: "timestamp with time zone default timezone('utc'::text, now())",
    updated_at: "timestamp with time zone default timezone('utc'::text, now())",
  },
};

export { SUPABASE_CONFIG, DB_SCHEMA };
