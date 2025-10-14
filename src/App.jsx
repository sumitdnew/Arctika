import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Save, Download, CheckCircle, MessageSquare, FileText, Send, Bot } from 'lucide-react';
import { supabase } from './supabaseClient';
import { extractContactInfo, extractCompanyInfo, generateNextQuestion, summarizeSection, generateTransformationProposal } from './aiService';

export default function TransformationForm() {
  const [mode, setMode] = useState('chat'); // 'form' or 'chat'
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Company context for personalized suggestions
  const [companyContext, setCompanyContext] = useState({
    industry: '',
    companySize: '',
    companyName: ''
  });
  
  // Chat specific states
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [chatStage, setChatStage] = useState('intro'); // 'intro' -> 'company_info' -> 'questions' -> 'complete'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatResponses, setChatResponses] = useState({});
  const [generatedProposal, setGeneratedProposal] = useState(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInitialized = useRef(false);

  const sections = [
    {
      title: "Business Overview & Goals",
      icon: "🧭",
      questions: [
        "What are the top 3 business goals you're focused on this year?",
        "Which metrics or KPIs define success for you? (e.g., revenue, efficiency, quality, safety, customer satisfaction)",
        "Who are your main customers or end users?",
        "What are the biggest challenges or bottlenecks in achieving your goals today?",
        "Are there specific areas where you feel technology could make the biggest impact?"
      ]
    },
    {
      title: "Current Processes & Operations",
      icon: "🧱",
      questions: [
        "What are your most data-intensive or repetitive processes?",
        "How are decisions currently made — based on data, intuition, or experience?",
        "Which departments rely heavily on spreadsheets or manual tracking?",
        "Where do errors or delays most frequently occur?",
        "Are there processes that depend on a few key people's knowledge (tribal knowledge)?"
      ]
    },
    {
      title: "Data Infrastructure & Systems",
      icon: "💾",
      questions: [
        "What systems do you use to manage your operations? (ERP, CRM, custom software, etc.)",
        "Where is your business data stored today? (Cloud, local servers, Excel, etc.)",
        "How often is your data updated and how clean is it?",
        "Do your systems talk to each other (APIs, integrations), or are they siloed?",
        "Who owns data governance and security within your organization?",
        "Do you currently use any BI dashboards or analytics tools? (e.g., Power BI, Tableau, Streamlit, Excel)"
      ]
    },
    {
      title: "AI / Automation Readiness",
      icon: "🤖",
      questions: [
        "Have you already implemented any AI, automation, or data analytics initiatives?",
        "Which areas do you think could benefit most from AI or predictive insights?",
        "Are your teams open to adopting AI-based tools in their workflows?",
        "How comfortable is your leadership with AI-driven decision-making?",
        "Do you have internal technical talent (data engineers, analysts, developers)?"
      ]
    },
    {
      title: "Strategy & Decision-Making",
      icon: "🧠",
      questions: [
        "Who typically sponsors technology or transformation projects? (e.g., CEO, COO, IT head)",
        "What's your decision-making process for new technology investments?",
        "How quickly can your organization move from idea → pilot → rollout?",
        "Are there any current digital or automation initiatives underway?",
        "What budget or resources are typically available for innovation projects?"
      ]
    },
    {
      title: "Challenges & Risks",
      icon: "🔒",
      questions: [
        "What do you see as the biggest risks to adopting AI or automation?",
        "Have you faced resistance from employees or leadership for past tech initiatives?",
        "Are there compliance, security, or data privacy concerns we should know about?",
        "What has prevented past transformation projects from succeeding?"
      ]
    },
    {
      title: "Future Vision & Opportunities",
      icon: "🌍",
      questions: [
        "If technology could eliminate one major pain point, what would it be?",
        "Where do you want your organization to be in 2–3 years in terms of digital maturity?",
        "What would a successful AI transformation look like for you?",
        "Which business areas do you want to focus on first for measurable impact?",
        "How can we help you achieve that vision?"
      ]
    }
  ];

  // Initialize chat
  useEffect(() => {
    if (mode === 'chat' && messages.length === 0 && !chatInitialized.current) {
      chatInitialized.current = true;
      setTimeout(() => {
        addBotMessage("Hello! 👋 I'm your AI transformation consultant. I'll help assess your business needs through a friendly conversation instead of a lengthy form.");
        setTimeout(() => {
          addBotMessage("First, could you tell me your name and email so I can save our conversation?");
        }, 1000);
      }, 500);
    }
    
    // Reset when switching back to chat mode
    if (mode !== 'chat') {
      chatInitialized.current = false;
    }
  }, [mode, messages.length]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { type: 'bot', text, timestamp: new Date() }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);
  };

  const getConversationalQuestion = (sectionIndex, questionIndex) => {
    const prompts = [
      // Section 0: Business Overview
      ["Let's start with your goals. What are the top 3 business goals you're focused on this year?",
       "Great! Now, which metrics or KPIs are most important for measuring your success? Things like revenue, efficiency, quality, or customer satisfaction?",
       "Who would you say are your main customers or end users?",
       "What are the biggest challenges or bottlenecks preventing you from achieving these goals?",
       "Are there any specific areas where you think technology could make the biggest impact?"],
      
      // Section 1: Current Processes
      ["Now let's talk about your day-to-day operations. What are your most data-intensive or repetitive processes?",
       "How are decisions typically made in your organization - based on data, intuition, or experience?",
       "Which departments rely heavily on spreadsheets or manual tracking?",
       "Where do errors or delays most frequently occur in your operations?",
       "Are there any processes that depend heavily on specific people's knowledge?"],
      
      // Section 2: Data Infrastructure
      ["Let's discuss your data and systems. What systems do you currently use to manage operations - like ERP, CRM, or custom software?",
       "Where is your business data stored today? Cloud, local servers, Excel files?",
       "How often is your data updated, and would you say it's clean and reliable?",
       "Do your different systems communicate with each other, or are they siloed?",
       "Who's responsible for data governance and security in your organization?",
       "Do you use any BI dashboards or analytics tools like Power BI, Tableau, or even Excel?"],
      
      // Section 3: AI Readiness
      ["Now onto AI and automation. Have you already implemented any AI, automation, or analytics initiatives?",
       "Which areas do you think could benefit most from AI or predictive insights?",
       "How open are your teams to adopting AI-based tools in their daily work?",
       "How comfortable is your leadership team with AI-driven decision-making?",
       "Do you have internal technical talent like data engineers, analysts, or developers?"],
      
      // Section 4: Strategy
      ["Let's talk about strategy and decision-making. Who typically sponsors technology or transformation projects in your company?",
       "What's your decision-making process for new technology investments?",
       "How quickly can your organization typically move from idea to pilot to full rollout?",
       "Are there any digital or automation initiatives currently underway?",
       "What budget or resources are typically available for innovation projects?"],
      
      // Section 5: Challenges
      ["Now, let's be honest about challenges. What do you see as the biggest risks to adopting AI or automation?",
       "Have you faced resistance from employees or leadership with past tech initiatives?",
       "Are there any compliance, security, or data privacy concerns I should know about?",
       "What has prevented past transformation projects from succeeding?"],
      
      // Section 6: Future Vision
      ["Finally, let's talk about your vision for the future. If technology could eliminate one major pain point, what would it be?",
       "Where do you want your organization to be in 2-3 years in terms of digital maturity?",
       "What would a successful AI transformation look like for you?",
       "Which business areas do you want to focus on first for measurable impact?",
       "How can we help you achieve that vision?"]
    ];
    
    return prompts[sectionIndex][questionIndex];
  };

  // Suggestion feature removed - focus is on authentic responses and comprehensive AI-generated proposals

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    addUserMessage(currentInput);
    const userResponse = currentInput;
    setCurrentInput('');
    setLoading(true);

    try {
      if (chatStage === 'intro') {
        // Use Groq AI to extract name and email
        const contactInfo = await extractContactInfo(userResponse);
        
        if (contactInfo.email) {
          setClientEmail(contactInfo.email);
          setClientName(contactInfo.name || 'Client');
          
          setTimeout(() => {
            addBotMessage(`Nice to meet you${contactInfo.name ? ', ' + contactInfo.name : ''}! 🎯`);
            setTimeout(() => {
              addBotMessage("Before we dive in, tell me a bit about your company - what's the company name, which industry are you in, and how many employees do you have?");
              setChatStage('company_info');
            }, 1000);
          }, 500);
        } else {
          setTimeout(() => {
            addBotMessage("I didn't catch your email. Could you share your name and email address? For example: 'I'm John Doe, john@company.com'");
          }, 500);
        }
      } else if (chatStage === 'company_info') {
        // Extract company information using AI
        const companyInfo = await extractCompanyInfo(userResponse);
        
        if (companyInfo.industry) {
          setCompanyContext({
            companyName: companyInfo.companyName || 'your company',
            industry: companyInfo.industry,
            companySize: companyInfo.companySize || 'organization'
          });
          
          setTimeout(() => {
            addBotMessage(`Great! ${companyInfo.companyName ? companyInfo.companyName + ' in ' : ''}${companyInfo.industry} - that's perfect! 🏢`);
            setTimeout(() => {
              addBotMessage("I'll tailor my questions based on your industry. Let's explore 7 key areas to understand your digital transformation needs. Ready?");
              setTimeout(() => {
                addBotMessage(getConversationalQuestion(0, 0));
                setChatStage('questions');
                setCurrentSection(0);
                setCurrentQuestionIndex(0);
              }, 1000);
            }, 1200);
          }, 500);
        } else {
          setTimeout(() => {
            addBotMessage("I didn't quite get that. Could you tell me your company name, industry, and size? For example: 'We're TechCorp, a technology company with 200 employees'");
          }, 500);
        }
      } else if (chatStage === 'questions') {
        // Save the response
        const key = `section_${currentSection}_q_${currentQuestionIndex}`;
        const updatedResponses = {
          ...chatResponses,
          [key]: userResponse
        };
        setChatResponses(updatedResponses);

        // Move to next question
        const totalQuestionsInSection = sections[currentSection].questions.length;
        
        if (currentQuestionIndex < totalQuestionsInSection - 1) {
          // Next question in same section - use AI to generate smooth transition
          const nextQ = currentQuestionIndex + 1;
          const nextQuestionText = sections[currentSection].questions[nextQ];
          
          const aiTransition = await generateNextQuestion(
            sections[currentSection].title,
            nextQuestionText,
            userResponse,
            updatedResponses
          );
          
          setCurrentQuestionIndex(nextQ);
          setTimeout(() => {
            addBotMessage(aiTransition);
          }, 500);
        } else if (currentSection < sections.length - 1) {
          // Move to next section - use AI to summarize current section
          const nextSection = currentSection + 1;
          
          const sectionSummary = await summarizeSection(
            sections[currentSection].title,
            updatedResponses
          );
          
          setCurrentSection(nextSection);
          setCurrentQuestionIndex(0);
          
          setTimeout(() => {
            addBotMessage(sectionSummary + ` ${sections[nextSection].icon}`);
            setTimeout(() => {
              addBotMessage(`Now let's move to ${sections[nextSection].title}.`);
              setTimeout(async () => {
                const firstQuestion = await generateNextQuestion(
                  sections[nextSection].title,
                  sections[nextSection].questions[0],
                  '',
                  updatedResponses
                );
                addBotMessage(firstQuestion);
              }, 1000);
            }, 1000);
          }, 500);
        } else {
          // Completed all questions - Generate proposal
          setChatStage('complete');
          
          setTimeout(() => {
            addBotMessage("🎉 Excellent! We've covered everything. Thank you for sharing all that valuable information!");
            setTimeout(async () => {
              addBotMessage("📊 I'm now analyzing your responses and generating a comprehensive transformation proposal tailored to your needs...");
              setGeneratingProposal(true);
              
              try {
                // Generate AI proposal
                const proposal = await generateTransformationProposal(companyContext, updatedResponses, sections);
                setGeneratedProposal(proposal);
                
                setTimeout(() => {
                  addBotMessage("✅ Your personalized transformation proposal is ready! Scroll down to view the detailed recommendations, KPIs, and implementation roadmap.");
                  // Convert chat responses to form format and save WITH proposal
                  setFormData(updatedResponses);
                  saveToDatabase(updatedResponses, proposal);
                }, 1000);
              } catch (error) {
                console.error('Error generating proposal:', error);
                addBotMessage("⚠️ There was an issue generating the proposal. Your responses have been saved, and you can export the data.");
                setFormData(updatedResponses);
                saveToDatabase(updatedResponses, null);
              } finally {
                setGeneratingProposal(false);
              }
            }, 1500);
          }, 500);
        }
      } else if (chatStage === 'complete') {
        setTimeout(() => {
          addBotMessage("Thanks! Your assessment is complete. Feel free to reach out if you have any questions or want to discuss next steps!");
        }, 500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Something went wrong. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (sectionIndex, questionIndex, value) => {
    const key = `section_${sectionIndex}_q_${questionIndex}`;
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveToDatabase = async (dataToSave = formData, proposalText = null) => {
    setLoading(true);
    setError(null);

    try {
      const submission = {
        timestamp: new Date().toISOString(),
        client_name: clientName,
        client_email: clientEmail,
        company_name: companyContext.companyName || null,
        industry: companyContext.industry || null,
        company_size: companyContext.companySize || null,
        responses: dataToSave,
        proposal: proposalText || generatedProposal,
        completion_percentage: calculateCompletion(dataToSave),
        mode: mode
      };

      const { data, error: supabaseError } = await supabase
        .from('transformation_assessments')
        .insert([submission])
        .select();

      if (supabaseError) throw supabaseError;

      console.log('Saved to database:', data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving to database:', err);
      setError(err.message || 'Failed to save to database');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (dataToCheck = formData) => {
    const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const answeredQuestions = Object.values(dataToCheck).filter(v => v && v.trim()).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  const exportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('transformation_assessments')
        .select('*')
        .order('timestamp', { ascending: false });

      if (supabaseError) throw supabaseError;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-responses-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Failed to export data');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const progress = mode === 'form' 
    ? ((currentSection + 1) / sections.length) * 100
    : (Object.keys(chatResponses).length / sections.reduce((sum, s) => sum + s.questions.length, 0)) * 100;

  // CHAT MODE RENDER
  if (mode === 'chat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
                  <Bot className="w-8 h-8 mr-3 text-purple-600" />
                  AI Transformation Chat
                </h1>
                <p className="text-gray-600 text-sm">Conversational assessment - answer naturally!</p>
              </div>
              <button
                onClick={() => setMode('form')}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <FileText className="w-4 h-4 mr-2" />
                Switch to Form
              </button>
            </div>
            
            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {Math.round(progress)}%</span>
                <span>{Object.keys(chatResponses).length} responses collected</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    msg.type === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.type === 'bot' && <Bot className="w-4 h-4 inline mr-2" />}
                    <span className="text-sm">{msg.text}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions removed - focus on gathering authentic responses */}

            {/* Input */}
            <form onSubmit={handleChatSubmit} className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  disabled={chatStage === 'complete'}
                />
                <button
                  type="submit"
                  disabled={chatStage === 'complete' || !currentInput.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={exportData}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              Response saved successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
              <span className="font-semibold mr-2">Error:</span>
              {error}
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                <span className="text-gray-700">Processing...</span>
              </div>
            </div>
          )}

          {/* Transformation Proposal */}
          {generatedProposal && (
            <div className="mt-6 bg-white rounded-lg shadow-xl p-8 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-purple-900 flex items-center">
                  📊 Digital Transformation Proposal
                </h2>
                <button
                  onClick={() => {
                    const blob = new Blob([generatedProposal], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${companyContext.companyName || 'Company'}-Transformation-Proposal-${Date.now()}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Proposal
                </button>
              </div>
              
              <div className="prose prose-purple max-w-none">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Company:</strong> {companyContext.companyName} | <strong>Industry:</strong> {companyContext.industry} | <strong>Size:</strong> {companyContext.companySize}
                  </p>
                  <p className="text-xs text-gray-500">
                    Generated: {new Date().toLocaleDateString()} | AI-Powered Analysis
                  </p>
                </div>
                
                <div className="text-gray-800 leading-relaxed space-y-4">
                  {generatedProposal.split('\n').map((line, idx) => {
                    // Headers
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} className="text-xl font-bold text-purple-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} className="text-2xl font-bold text-purple-900 mt-8 mb-4 pb-2 border-b-2 border-purple-200">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} className="text-3xl font-bold text-purple-900 mt-8 mb-4">{line.replace('# ', '')}</h1>;
                    }
                    
                    // Bold text
                    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
                    
                    // Bullet points
                    if (line.trim().startsWith('- ')) {
                      return <li key={idx} className="ml-6 mb-2 list-disc" dangerouslySetInnerHTML={{ __html: boldLine.replace(/^- /, '') }} />;
                    }
                    
                    // Numbered lists
                    if (/^\d+\.\s/.test(line.trim())) {
                      return <li key={idx} className="ml-6 mb-2 list-decimal" dangerouslySetInnerHTML={{ __html: boldLine.replace(/^\d+\.\s/, '') }} />;
                    }
                    
                    // Empty lines
                    if (line.trim() === '') {
                      return <div key={idx} className="h-2"></div>;
                    }
                    
                    // Regular paragraphs
                    return <p key={idx} className="mb-3 text-gray-700" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Generating Proposal Indicator */}
          {generatingProposal && (
            <div className="mt-6 bg-purple-50 rounded-lg shadow-lg p-8 text-center border-2 border-purple-200">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-purple-900 mb-2">Generating Your Proposal</h3>
              <p className="text-gray-600">AI is analyzing your responses and creating a tailored transformation strategy...</p>
              <div className="mt-4 flex justify-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FORM MODE RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                AI & Digital Transformation Assessment
              </h1>
              <p className="text-gray-600">
                Detailed form for comprehensive assessment
              </p>
            </div>
            <button
              onClick={() => setMode('chat')}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Switch to Chat
            </button>
          </div>
          
          {/* Client & Company Info */}
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Company Name"
                value={companyContext.companyName}
                onChange={(e) => setCompanyContext({...companyContext, companyName: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Industry (e.g., Oil & Gas)"
                value={companyContext.industry}
                onChange={(e) => setCompanyContext({...companyContext, industry: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Company Size (e.g., 500 employees)"
                value={companyContext.companySize}
                onChange={(e) => setCompanyContext({...companyContext, companySize: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Section {currentSection + 1} of {sections.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Current Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center mb-6">
            <span className="text-4xl mr-4">{sections[currentSection].icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {sections[currentSection].title}
              </h2>
              <p className="text-gray-500">Section {currentSection + 1}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {sections[currentSection].questions.map((question, qIndex) => {
              const key = `section_${currentSection}_q_${qIndex}`;
              return (
                <div key={qIndex}>
                  <label className="block text-gray-700 font-medium mb-2">
                    {qIndex + 1}. {question}
                  </label>
                  <textarea
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(currentSection, qIndex, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[100px]"
                    placeholder="Enter your response..."
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevSection}
            disabled={currentSection === 0}
            className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => saveToDatabase()}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Progress
            </button>

            <button
              onClick={exportData}
              className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Data
            </button>
          </div>

          {currentSection === sections.length - 1 ? (
            <button
              onClick={async () => {
                if (!companyContext.industry || !clientName || !clientEmail) {
                  setError('Please fill in all company and contact information first');
                  setTimeout(() => setError(null), 3000);
                  return;
                }
                
                setGeneratingProposal(true);
                try {
                  const proposal = await generateTransformationProposal(companyContext, formData, sections);
                  setGeneratedProposal(proposal);
                  saveToDatabase(formData, proposal);
                  // Scroll to proposal
                  setTimeout(() => {
                    document.getElementById('proposal-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 500);
                } catch (error) {
                  console.error('Error generating proposal:', error);
                  setError('Failed to generate proposal. Please try again.');
                  setTimeout(() => setError(null), 5000);
                } finally {
                  setGeneratingProposal(false);
                }
              }}
              disabled={generatingProposal}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {generatingProposal ? 'Generating Proposal...' : 'Complete & Generate Proposal'}
            </button>
          ) : (
            <button
              onClick={nextSection}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
            <CheckCircle className="w-6 h-6 mr-3" />
            Response saved successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
            <span className="font-semibold mr-2">Error:</span>
            {error}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-700">Processing...</span>
            </div>
          </div>
        )}

        {/* Section Navigation */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">All Sections</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => setCurrentSection(index)}
                className={`p-3 rounded-lg text-left transition ${
                  currentSection === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">{section.icon}</div>
                <div className="text-xs font-medium">{section.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Completion Status */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">Form Completion</h3>
              <p className="text-gray-600 text-sm">
                {Object.values(formData).filter(v => v && v.trim()).length} of{' '}
                {sections.reduce((sum, s) => sum + s.questions.length, 0)} questions answered
              </p>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {calculateCompletion()}%
            </div>
          </div>
        </div>

        {/* Generating Proposal Indicator */}
        {generatingProposal && (
          <div className="mt-6 bg-blue-50 rounded-lg shadow-lg p-8 text-center border-2 border-blue-200">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Generating Your Proposal</h3>
            <p className="text-gray-600">AI is analyzing your responses and creating a tailored transformation strategy for {companyContext.companyName}...</p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Transformation Proposal */}
        {generatedProposal && (
          <div id="proposal-section" className="mt-6 bg-white rounded-lg shadow-xl p-8 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-blue-900 flex items-center">
                📊 Digital Transformation Proposal
              </h2>
              <button
                onClick={() => {
                  const blob = new Blob([generatedProposal], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${companyContext.companyName || 'Company'}-Transformation-Proposal-${Date.now()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Proposal
              </button>
            </div>
            
            <div className="prose prose-blue max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Company:</strong> {companyContext.companyName} | <strong>Industry:</strong> {companyContext.industry} | <strong>Size:</strong> {companyContext.companySize}
                </p>
                <p className="text-xs text-gray-500">
                  Generated: {new Date().toLocaleDateString()} | AI-Powered Analysis
                </p>
              </div>
              
              <div className="text-gray-800 leading-relaxed space-y-4">
                {generatedProposal.split('\n').map((line, idx) => {
                  // Headers
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} className="text-xl font-bold text-blue-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={idx} className="text-2xl font-bold text-blue-900 mt-8 mb-4 pb-2 border-b-2 border-blue-200">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('# ')) {
                    return <h1 key={idx} className="text-3xl font-bold text-blue-900 mt-8 mb-4">{line.replace('# ', '')}</h1>;
                  }
                  
                  // Bold text
                  const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
                  
                  // Bullet points
                  if (line.trim().startsWith('- ')) {
                    return <li key={idx} className="ml-6 mb-2 list-disc" dangerouslySetInnerHTML={{ __html: boldLine.replace(/^- /, '') }} />;
                  }
                  
                  // Numbered lists
                  if (/^\d+\.\s/.test(line.trim())) {
                    return <li key={idx} className="ml-6 mb-2 list-decimal" dangerouslySetInnerHTML={{ __html: boldLine.replace(/^\d+\.\s/, '') }} />;
                  }
                  
                  // Empty lines
                  if (line.trim() === '') {
                    return <div key={idx} className="h-2"></div>;
                  }
                  
                  // Regular paragraphs
                  return <p key={idx} className="mb-3 text-gray-700" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}