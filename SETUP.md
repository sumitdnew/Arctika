# Transformation Form - Setup Guide

This guide will help you set up Supabase and Groq AI for the Transformation Form application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- A Groq account (sign up at [console.groq.com](https://console.groq.com))
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Project Name**: Choose any name (e.g., "transformation-form")
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to finish setting up (2-3 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the sidebar
2. Navigate to **API** section
3. You'll find two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 3: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor** (database icon in sidebar)
2. Click **"New Query"**
3. Open the `supabase-schema.sql` file from your project root
4. Copy the entire SQL content and paste it into the Supabase SQL Editor
5. Click **"Run"** or press `Ctrl/Cmd + Enter`
6. You should see a success message: "Success. No rows returned"

## Step 4: Get Your Groq API Key

1. Go to [Groq Console](https://console.groq.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** section in the left sidebar
4. Click **"Create API Key"**
5. Give it a name (e.g., "Transformation Form")
6. Copy the API key (starts with `gsk_...`)
7. **IMPORTANT**: Save this key securely - you won't be able to see it again!

## Step 5: Configure Environment Variables

1. In your project root, create a `.env` file (or edit the existing one)
2. Add your Supabase and Groq credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Groq AI Configuration
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
```

3. Replace the values with your actual credentials from Step 2 and Step 4
4. **IMPORTANT**: Never commit the `.env` file to version control (it's already in `.gitignore`)

## Step 6: Verify the Setup

1. Start your development server:
```bash
npm run dev
```

2. Open the application in your browser (usually `http://localhost:5173`)
3. Try the **Chat Mode** to experience AI-powered interactions:
   - Groq AI will intelligently extract your name and email
   - It generates natural, conversational transitions between questions
   - It provides context-aware responses based on your answers
4. Or use the **Form Mode** for traditional structured input
5. Click "Save Progress" or complete the chat
6. Check your Supabase dashboard:
   - Go to **Table Editor** → **transformation_assessments**
   - You should see your test submission with all responses!

## Step 7: View Your Data

### In Supabase Dashboard:
- Go to **Table Editor** → **transformation_assessments**
- View, search, and filter all submissions

### Export Data:
- Click the "Export Data" button in the app
- Downloads a JSON file with all submissions from the database

## Database Schema

The `transformation_assessments` table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Auto-generated unique identifier |
| timestamp | TIMESTAMPTZ | When the assessment was submitted |
| client_name | TEXT | Client's name |
| client_email | TEXT | Client's email address |
| responses | JSONB | All form/chat responses as JSON |
| completion_percentage | INTEGER | Percentage of questions answered |
| mode | TEXT | Either 'chat' or 'form' |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |

## Row Level Security (RLS)

The table has RLS enabled with policies that allow:
- ✅ Anyone can INSERT (submit forms)
- ✅ Anyone can SELECT (read data)
- ✅ Anyone can UPDATE

**Note**: For production, you should modify these policies based on your security requirements. For example:
- Restrict reads to authenticated users
- Only allow users to see their own submissions
- Add authentication requirements

## Groq AI Features

The chat mode uses **Groq AI** with the `llama-3.3-70b-versatile` model to provide intelligent, conversational interactions:

### 🤖 Smart Information Extraction
- Automatically extracts name and email from natural language
- No rigid input format required - users can respond conversationally
- Example: "Hi, I'm Sarah Johnson and you can reach me at sarah.j@techcorp.com" ✅

### 💬 Context-Aware Transitions
- AI generates smooth transitions between questions based on user responses
- Acknowledges previous answers before moving to the next question
- Creates a natural conversation flow instead of robotic questioning

### 📊 Intelligent Section Summaries
- Summarizes what was covered in each section before moving forward
- Provides encouraging feedback based on the content discussed
- Maintains conversation continuity throughout the assessment

### ⚡ Fast & Efficient
- Uses Groq's ultra-fast inference (powered by LPU™)
- Responses in milliseconds, not seconds
- Maintains real-time conversation feel

### 🔒 Privacy & Security
- API key is kept secure in environment variables
- Client-side processing with `dangerouslyAllowBrowser` flag
- No data stored by Groq - only processed for responses

## Troubleshooting

### Error: "Failed to save to database"
- Check that your `.env` file has the correct Supabase URL and key
- Verify the table exists in Supabase (Table Editor → transformation_assessments)
- Check browser console for detailed error messages

### Error: "new row violates row-level security policy"
- Make sure you ran the complete SQL schema including the RLS policies
- Check that the policies are enabled in Supabase (Table Editor → transformation_assessments → Policies)

### Environment variables not loading
- Make sure your `.env` file is in the project root
- Variable names must start with `VITE_` for Vite to expose them
- Restart the dev server after changing `.env`

### Groq AI errors in chat mode
- Verify your Groq API key is correct (starts with `gsk_`)
- Check that you have API credits available in your Groq account
- If chat transitions seem slow, check your internet connection
- Browser console will show detailed Groq API errors

### Chat mode not extracting name/email
- Make sure to include both name AND email in your first message
- Try format: "My name is [Name] and my email is [email@domain.com]"
- The AI will ask again if it can't detect the email

## Security Best Practices

1. **Never expose your Supabase service role key** (only use the anon key)
2. **Never commit your `.env` file** - it contains sensitive API keys
3. **Keep your Groq API key secure** - regenerate if exposed
4. **Implement proper authentication** before deploying to production
5. **Customize RLS policies** based on your security requirements
6. **Validate data on the backend** (use Supabase database functions)
7. **Monitor API usage** on both Supabase and Groq dashboards
8. **Use environment-specific keys** (different keys for dev/staging/prod)
9. **Set up rate limiting** to prevent API abuse
10. **Consider server-side processing** for production (instead of client-side Groq calls)

## Next Steps

### Database & Backend
- Set up Supabase Auth for user authentication
- Create custom RLS policies for user-specific data
- Add real-time subscriptions to see submissions live
- Create a dashboard to view and analyze submissions
- Set up email notifications using Supabase Edge Functions

### AI Enhancements
- Fine-tune Groq prompts for better question transitions
- Add sentiment analysis to responses
- Implement follow-up questions based on AI analysis
- Create AI-generated summary reports
- Add multi-language support with AI translation

### Production Readiness
- Move Groq API calls to server-side (Supabase Edge Functions)
- Implement request caching to reduce API costs
- Add analytics to track completion rates
- Set up monitoring and error tracking
- Deploy to production (Vercel, Netlify, etc.)

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Groq Documentation](https://console.groq.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [Groq Discord Community](https://discord.gg/groq)
- [Project Issues](https://github.com/your-repo/issues)

