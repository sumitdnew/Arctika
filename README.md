# 🚀 AI-Powered Transformation Assessment Form

An intelligent business transformation assessment tool with dual modes: **AI-powered conversational chat** and **traditional structured form**. Built with React, Vite, Tailwind CSS, Supabase, and Groq AI.

![React](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.1.7-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.14-cyan)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Groq AI](https://img.shields.io/badge/Groq-LLaMA_3.3-orange)

## ✨ Features

### 🤖 AI-Powered Chat Mode
- **Natural Language Processing**: Groq AI (LLaMA 3.3 70B) understands conversational responses
- **Smart Extraction**: Automatically extracts name, email, and key information from natural language
- **Context-Aware**: AI generates smooth transitions based on previous answers
- **Intelligent Summaries**: Provides section summaries before moving forward
- **Ultra-Fast**: Groq's LPU™ technology delivers responses in milliseconds

### 📋 Traditional Form Mode
- Section-by-section structured assessment
- Progress tracking and completion percentage
- Quick navigation between sections
- Visual progress indicators

### 💾 Database Integration
- **Supabase PostgreSQL**: Reliable cloud database storage
- **Real-time Sync**: Automatic saving to database
- **Export Functionality**: Download all responses as JSON
- **Row Level Security**: Secure data with customizable policies

### 🎨 Modern UI/UX
- Beautiful gradient designs
- Responsive layout (mobile-friendly)
- Smooth animations and transitions
- Loading states and error handling
- Success/error notifications

## 📦 Tech Stack

- **Frontend**: React 19.2, Vite 7.1
- **Styling**: Tailwind CSS 4.1
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq API (LLaMA 3.3 70B Versatile)
- **Icons**: Lucide React
- **Language**: JavaScript/JSX

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Groq API account ([console.groq.com](https://console.groq.com))

### Installation

1. **Clone and Install**
   ```bash
   cd transformation-form
   npm install
   ```

2. **Set Up Environment Variables**
   
   Create a `.env` file in the project root:
   ```env
   # Supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

   # Groq AI
   VITE_GROQ_API_KEY=gsk_your-groq-api-key
   ```

3. **Set Up Database**
   
   - Go to your Supabase SQL Editor
   - Run the SQL from `supabase-schema.sql`

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   
   Visit `http://localhost:5173`

📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 🎯 Assessment Sections

The form covers 7 comprehensive areas:

1. **🧭 Business Overview & Goals** - Business objectives and success metrics
2. **🧱 Current Processes & Operations** - Workflow analysis and bottlenecks
3. **💾 Data Infrastructure & Systems** - Technology stack and data management
4. **🤖 AI/Automation Readiness** - Current capabilities and openness to AI
5. **🧠 Strategy & Decision-Making** - Leadership and investment processes
6. **🔒 Challenges & Risks** - Obstacles and concerns
7. **🌍 Future Vision & Opportunities** - Goals and transformation vision

## 💡 How It Works

### Chat Mode (AI-Powered)
```
1. User shares name & email naturally
   → Groq AI extracts information

2. AI asks first question
   → User responds conversationally
   → AI acknowledges and transitions smoothly

3. Progresses through 7 sections
   → AI summarizes each section
   → Maintains natural conversation flow

4. Auto-saves to Supabase database
   → Export responses as JSON
```

### Form Mode (Traditional)
```
1. Enter name & email in input fields

2. Navigate section by section
   → Answer questions in text areas
   → Track progress visually

3. Save progress anytime
   → Navigate between sections freely

4. Export data from database
```

## 🗂️ Project Structure

```
transformation-form/
├── src/
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # React entry point
│   ├── index.css            # Tailwind + global styles
│   ├── supabaseClient.js    # Supabase configuration
│   └── groqService.js       # Groq AI integration
├── public/                  # Static assets
├── supabase-schema.sql      # Database schema
├── SETUP.md                 # Detailed setup guide
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── postcss.config.js        # PostCSS configuration
```

## 🔐 Security Notes

⚠️ **Important**: 
- Never commit your `.env` file
- Keep API keys secure
- Customize Supabase RLS policies for production
- Consider server-side API calls for production deployment

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📊 Database Schema

```sql
transformation_assessments (
  id              UUID PRIMARY KEY
  timestamp       TIMESTAMPTZ
  client_name     TEXT
  client_email    TEXT
  responses       JSONB
  completion_%    INTEGER
  mode            TEXT ('chat' | 'form')
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋 Support

- **Documentation**: [SETUP.md](./SETUP.md)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Groq Docs**: [console.groq.com/docs](https://console.groq.com/docs)
- **Issues**: [Create an issue](https://github.com/your-repo/issues)

## 🌟 Features Roadmap

- [ ] Multi-language support
- [ ] AI-generated summary reports
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Team collaboration features
- [ ] Advanced AI insights
- [ ] Mobile app (React Native)

---

**Built with ❤️ using React, Groq AI, and Supabase**

