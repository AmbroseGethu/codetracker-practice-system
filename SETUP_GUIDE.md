# CodeTracker Setup Guide with Supabase

## 🚀 Free Hosting Setup with Database

### Step 1: Create Supabase Account (Free)

1. Go to [supabase.com](https://supabase.com)
2. Sign up with your GitHub account (recommended)
3. Create a new project
4. Choose a project name: `codetracker-db`
5. Set a database password (save it securely!)
6. Select a region close to you

### Step 2: Set Up Database Table

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Run this SQL command to create the problems table:

```sql
-- Create the problems table
CREATE TABLE problems (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    link TEXT,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL,
    platform TEXT NOT NULL,
    date_added DATE NOT NULL,
    completed_dates TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create an index for better performance
CREATE INDEX idx_problems_date_added ON problems(date_added);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category ON problems(category);

-- Enable Row Level Security (RLS)
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can make this more restrictive later)
CREATE POLICY "Allow all operations on problems" ON problems
    FOR ALL 
    USING (true)
    WITH CHECK (true);
```

### Step 3: Get Your Supabase Keys

1. Go to "Settings" → "API" in your Supabase dashboard
2. Copy your:
   - **Project URL** (something like `https://abcdefghijklmnop.supabase.co`)
   - **Anon Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 4: Configure Your App

1. Open `config.js` in your project
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_ID.supabase.co', // Replace with your URL
    anonKey: 'YOUR_ANON_KEY_HERE' // Replace with your anon key
};
```

### Step 5: Deploy to Vercel (Free)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your project from GitHub (or upload the folder)
5. Deploy settings:
   - **Framework Preset**: Other
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: Leave empty

### Step 6: Test Your Deployment

1. Visit your deployed site URL
2. Add a test problem
3. Refresh the page - your data should persist!
4. Open the site in another browser - data should be there too!

## 🔧 Alternative: Quick GitHub Pages Setup

If you prefer a simpler setup without database (using localStorage only):

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch"
4. Choose "main" branch
5. Your site will be live at `https://yourusername.github.io/repository-name`

## 📊 Free Tier Limits

### Supabase Free Tier:
- **Database**: 500MB storage
- **Bandwidth**: 2GB per month
- **API requests**: 50,000 per month
- **Authentication**: 50,000 users

### Vercel Free Tier:
- **Bandwidth**: 100GB per month
- **Serverless Function Executions**: 1,000 per month
- **Build Minutes**: 6,000 per month

## 🛠️ Troubleshooting

### Common Issues:

1. **CORS Error**: Make sure your Supabase URL and keys are correct
2. **Module Error**: Ensure you're serving the site from a web server (not opening HTML directly)
3. **Database Connection**: Check your internet connection and Supabase dashboard

### Need Help?

1. Check the browser console for error messages
2. Verify your Supabase table was created correctly
3. Test your Supabase connection in the SQL editor
4. Make sure your config.js has the correct values

## 🎯 Next Steps

Once everything is working:

1. **Customize**: Add more features like tags, notes, or difficulty tracking
2. **Optimize**: Add caching and offline support
3. **Share**: Share your site with other competitive programmers
4. **Analytics**: Track your progress over time

Your CodeTracker is now ready with persistent cloud storage! 🚀
