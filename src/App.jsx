import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Save, Download, CheckCircle, MessageSquare, FileText, Send, Bot, Globe, Upload, Settings } from 'lucide-react';
import { supabase } from './supabaseClient';
import { extractContactInfo, extractCompanyInfo, generateNextQuestion, summarizeSection, generateTransformationProposal } from './aiService';
import AdminPage from './AdminPage';

export default function TransformationForm() {
  const [mode, setMode] = useState('chat'); // 'form' or 'chat'
  const [language, setLanguage] = useState('en'); // 'en' or 'es'
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
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
  const [chatInitTimer, setChatInitTimer] = useState(null);
  const [chatKey, setChatKey] = useState(0); // Key to force chat reset

  // Translations
  const translations = {
    en: {
      // Header
      aiTransformationChat: "Arctika AI Onboarding Questionnaire",
      aiTransformationAssessment: "Arctika AI Onboarding Questionnaire",
      conversationalAssessment: "Conversational assessment - answer naturally!",
      detailedForm: "Detailed form for comprehensive assessment",
      switchToForm: "Switch to Form",
      switchToChat: "Switch to Chat",
      
      // Language selector
      selectLanguage: "Select Language",
      english: "English",
      spanish: "Español (Argentina)",
      
      // Progress
      progress: "Progress",
      responsesCollected: "responses collected",
      section: "Section",
      of: "of",
      
      // Chat messages
      chatIntro1: "Hello! 👋 I'm your AI transformation consultant. I'll help assess your business needs through a friendly conversation instead of a lengthy form.",
      chatIntro2: "First, could you tell me your name and email so I can save our conversation?",
      chatCompanyInfo: "Before we dive in, tell me a bit about your company - what's the company name, which industry are you in, and how many employees do you have?",
      chatReady: "I'll tailor my questions based on your industry. Let's explore 7 key areas to understand your digital transformation needs. Ready?",
      chatComplete: "🎉 Excellent! We've covered everything. Thank you for sharing all that valuable information!",
      chatGenerating: "📊 Processing your responses...",
      chatSubmissionComplete: "✅ Thank you! Your responses have been submitted successfully. Our team will review your information and get back to you with a detailed transformation proposal and next steps within 2-3 business days.",
      chatEmailError: "I didn't catch your email. Could you share your name and email address? For example: 'I'm John Doe, john@company.com'",
      chatCompanyError: "I didn't quite get that. Could you tell me your company name, industry, and size? For example: 'We're TechCorp, a technology company with 200 employees'",
      chatCompanySuccess: "Great! {companyName} in {industry} - that's perfect! 🏢",
      chatProposalError: "⚠️ There was an issue generating the proposal. Your responses have been saved, and you can export the data.",
      
      // Form inputs
      yourName: "Your Name",
      emailAddress: "Email Address",
      companyName: "Company Name",
      industry: "Industry (e.g., Oil & Gas)",
      companySize: "Company Size (e.g., 500 employees)",
      enterResponse: "Enter your response...",
      
      // Buttons
      previous: "Previous",
      next: "Next",
      saveProgress: "Save Progress",
      exportData: "Export CSV",
      importData: "Import CSV",
      completeGenerateProposal: "Submit Assessment",
      generatingProposal: "Submitting...",
      submissionSuccess: "✅ Assessment submitted successfully! Our team will review your information and contact you with a detailed transformation proposal within 2-3 business days.",
      downloadProposal: "Download Proposal",
      
      // Sections
      businessOverview: "Business Overview & Goals",
      currentProcesses: "Current Processes & Operations",
      dataInfrastructure: "Data Infrastructure & Systems",
      aiReadiness: "AI / Automation Readiness",
      strategy: "Strategy & Decision-Making",
      challenges: "Challenges & Risks",
      futureVision: "Future Vision & Opportunities",
      
      // Messages
      responseSaved: "Response saved successfully!",
      error: "Error:",
      processing: "Processing...",
      generatingYourProposal: "Generating Your Proposal",
      aiAnalyzing: "AI is analyzing your responses and creating a tailored transformation strategy...",
      digitalTransformationProposal: "Digital Transformation Proposal",
      generated: "Generated:",
      aiPoweredAnalysis: "AI-Powered Analysis",
      
      // Form completion
      formCompletion: "Form Completion",
      questionsAnswered: "questions answered",
      
      // Questions
      questions: {
        business: [
          "What are the top 3 business goals you're focused on this year?",
          "Which metrics or KPIs define success for you? (e.g., revenue, efficiency, quality, safety, customer satisfaction)",
          "Who are your main customers or end users?",
          "What are the biggest challenges or bottlenecks in achieving your goals today?",
          "Are there specific areas where you feel technology could make the biggest impact?"
        ],
        processes: [
          "What are your most data-intensive or repetitive processes?",
          "How are decisions currently made — based on data, intuition, or experience?",
          "Which departments rely heavily on spreadsheets or manual tracking?",
          "Where do errors or delays most frequently occur?",
          "Are there processes that depend on a few key people's knowledge (tribal knowledge)?"
        ],
        data: [
          "What systems do you use to manage your operations? (ERP, CRM, custom software, etc.)",
          "Where is your business data stored today? (Cloud, local servers, Excel, etc.)",
          "How often is your data updated and how clean is it?",
          "Do your systems talk to each other (APIs, integrations), or are they siloed?",
          "Who owns data governance and security within your organization?",
          "Do you currently use any BI dashboards or analytics tools? (e.g., Power BI, Tableau, Streamlit, Excel)"
        ],
        ai: [
          "Have you already implemented any AI, automation, or data analytics initiatives?",
          "Which areas do you think could benefit most from AI or predictive insights?",
          "Are your teams open to adopting AI-based tools in their workflows?",
          "How comfortable is your leadership with AI-driven decision-making?",
          "Do you have internal technical talent (data engineers, analysts, developers)?"
        ],
        strategy: [
          "Who typically sponsors technology or transformation projects? (e.g., CEO, COO, IT head)",
          "What's your decision-making process for new technology investments?",
          "How quickly can your organization move from idea → pilot → rollout?",
          "Are there any current digital or automation initiatives underway?",
          "What budget or resources are typically available for innovation projects?"
        ],
        challenges: [
          "What do you see as the biggest risks to adopting AI or automation?",
          "Have you faced resistance from employees or leadership for past tech initiatives?",
          "Are there compliance, security, or data privacy concerns we should know about?",
          "What has prevented past transformation projects from succeeding?"
        ],
        future: [
          "If technology could eliminate one major pain point, what would it be?",
          "Where do you want your organization to be in 2–3 years in terms of digital maturity?",
          "What would a successful AI transformation look like for you?",
          "Which business areas do you want to focus on first for measurable impact?",
          "How can we help you achieve that vision?"
        ]
      }
    },
    es: {
      // Header
      aiTransformationChat: "Cuestionario de Incorporación Arctika AI",
      aiTransformationAssessment: "Cuestionario de Incorporación Arctika AI",
      conversationalAssessment: "Evaluación conversacional - ¡responde naturalmente!",
      detailedForm: "Formulario detallado para evaluación integral",
      switchToForm: "Cambiar a Formulario",
      switchToChat: "Cambiar a Chat",
      
      // Language selector
      selectLanguage: "Seleccionar Idioma",
      english: "English",
      spanish: "Español (Argentina)",
      
      // Progress
      progress: "Progreso",
      responsesCollected: "respuestas recolectadas",
      section: "Sección",
      of: "de",
      
      // Chat messages
      chatIntro1: "¡Hola! 👋 Soy tu consultor de transformación con IA. Te ayudo a evaluar las necesidades de tu empresa a través de una conversación amigable en lugar de un formulario largo.",
      chatIntro2: "Primero, ¿podrías decirme tu nombre y email para poder guardar nuestra conversación?",
      chatCompanyInfo: "Antes de empezar, cuéntame un poco sobre tu empresa - ¿cuál es el nombre de la empresa, en qué industria están, y cuántos empleados tienen?",
      chatReady: "Personalizaré mis preguntas según tu industria. Vamos a explorar 7 áreas clave para entender tus necesidades de transformación digital. ¿Listo?",
      chatComplete: "🎉 ¡Excelente! Hemos cubierto todo. ¡Gracias por compartir toda esa información valiosa!",
      chatGenerating: "📊 Procesando tus respuestas...",
      chatSubmissionComplete: "✅ ¡Gracias! Tus respuestas han sido enviadas exitosamente. Nuestro equipo revisará tu información y te contactará con una propuesta detallada de transformación y próximos pasos en 2-3 días hábiles.",
      chatEmailError: "No capté tu email. ¿Podrías compartir tu nombre y dirección de email? Por ejemplo: 'Soy Juan Pérez, juan@empresa.com'",
      chatCompanyError: "No entendí bien eso. ¿Podrías decirme el nombre de tu empresa, industria y tamaño? Por ejemplo: 'Somos TechCorp, una empresa de tecnología con 200 empleados'",
      chatCompanySuccess: "¡Genial! {companyName} en {industry} - ¡eso es perfecto! 🏢",
      chatProposalError: "⚠️ Hubo un problema generando la propuesta. Tus respuestas han sido guardadas y puedes exportar los datos.",
      
      // Form inputs
      yourName: "Tu Nombre",
      emailAddress: "Dirección de Email",
      companyName: "Nombre de la Empresa",
      industry: "Industria (ej., Petróleo y Gas)",
      companySize: "Tamaño de la Empresa (ej., 500 empleados)",
      enterResponse: "Ingresa tu respuesta...",
      
      // Buttons
      previous: "Anterior",
      next: "Siguiente",
      saveProgress: "Guardar Progreso",
      exportData: "Exportar CSV",
      importData: "Importar CSV",
      completeGenerateProposal: "Enviar Evaluación",
      generatingProposal: "Enviando...",
      submissionSuccess: "✅ ¡Evaluación enviada exitosamente! Nuestro equipo revisará tu información y te contactará con una propuesta detallada de transformación en 2-3 días hábiles.",
      downloadProposal: "Descargar Propuesta",
      
      // Sections
      businessOverview: "Visión General del Negocio y Objetivos",
      currentProcesses: "Procesos y Operaciones Actuales",
      dataInfrastructure: "Infraestructura de Datos y Sistemas",
      aiReadiness: "Preparación para IA / Automatización",
      strategy: "Estrategia y Toma de Decisiones",
      challenges: "Desafíos y Riesgos",
      futureVision: "Visión Futura y Oportunidades",
      
      // Messages
      responseSaved: "¡Respuesta guardada exitosamente!",
      error: "Error:",
      processing: "Procesando...",
      generatingYourProposal: "Generando Tu Propuesta",
      aiAnalyzing: "La IA está analizando tus respuestas y creando una estrategia de transformación adaptada...",
      digitalTransformationProposal: "Propuesta de Transformación Digital",
      generated: "Generado:",
      aiPoweredAnalysis: "Análisis Impulsado por IA",
      
      // Form completion
      formCompletion: "Completitud del Formulario",
      questionsAnswered: "preguntas respondidas",
      
      // Questions
      questions: {
        business: [
          "¿Cuáles son los 3 objetivos principales de tu negocio en los que te enfocas este año?",
          "¿Qué métricas o KPIs definen el éxito para ti? (ej., ingresos, eficiencia, calidad, seguridad, satisfacción del cliente)",
          "¿Quiénes son tus principales clientes o usuarios finales?",
          "¿Cuáles son los mayores desafíos o cuellos de botella para lograr tus objetivos hoy?",
          "¿Hay áreas específicas donde sientes que la tecnología podría tener el mayor impacto?"
        ],
        processes: [
          "¿Cuáles son tus procesos más intensivos en datos o repetitivos?",
          "¿Cómo se toman las decisiones actualmente - basadas en datos, intuición o experiencia?",
          "¿Qué departamentos dependen mucho de hojas de cálculo o seguimiento manual?",
          "¿Dónde ocurren errores o retrasos con mayor frecuencia?",
          "¿Hay procesos que dependen del conocimiento de algunas personas clave (conocimiento tribal)?"
        ],
        data: [
          "¿Qué sistemas usas para gestionar tus operaciones? (ERP, CRM, software personalizado, etc.)",
          "¿Dónde se almacenan los datos de tu negocio hoy? (Nube, servidores locales, Excel, etc.)",
          "¿Con qué frecuencia se actualizan tus datos y qué tan limpios están?",
          "¿Tus sistemas se comunican entre sí (APIs, integraciones), o están aislados?",
          "¿Quién es responsable de la gobernanza de datos y seguridad en tu organización?",
          "¿Actualmente usas algún tablero de BI o herramientas de análisis? (ej., Power BI, Tableau, Streamlit, Excel)"
        ],
        ai: [
          "¿Ya has implementado alguna iniciativa de IA, automatización o análisis de datos?",
          "¿Qué áreas crees que podrían beneficiarse más de la IA o insights predictivos?",
          "¿Qué tan abiertos están tus equipos a adoptar herramientas basadas en IA en sus flujos de trabajo?",
          "¿Qué tan cómodo está tu liderazgo con la toma de decisiones impulsada por IA?",
          "¿Tienes talento técnico interno (ingenieros de datos, analistas, desarrolladores)?"
        ],
        strategy: [
          "¿Quién típicamente patrocina proyectos de tecnología o transformación? (ej., CEO, COO, jefe de IT)",
          "¿Cuál es tu proceso de toma de decisiones para nuevas inversiones en tecnología?",
          "¿Qué tan rápido puede tu organización moverse de idea → piloto → despliegue?",
          "¿Hay alguna iniciativa digital o de automatización actualmente en curso?",
          "¿Qué presupuesto o recursos están típicamente disponibles para proyectos de innovación?"
        ],
        challenges: [
          "¿Qué ves como los mayores riesgos para adoptar IA o automatización?",
          "¿Has enfrentado resistencia de empleados o liderazgo por iniciativas tecnológicas pasadas?",
          "¿Hay preocupaciones de cumplimiento, seguridad o privacidad de datos que deberíamos conocer?",
          "¿Qué ha impedido que proyectos de transformación pasados tengan éxito?"
        ],
        future: [
          "Si la tecnología pudiera eliminar un gran punto de dolor, ¿cuál sería?",
          "¿Dónde quieres que esté tu organización en 2-3 años en términos de madurez digital?",
          "¿Cómo se vería una transformación de IA exitosa para ti?",
          "¿En qué áreas del negocio quieres enfocarte primero para un impacto medible?",
          "¿Cómo podemos ayudarte a lograr esa visión?"
        ]
      }
    }
  };

  const t = translations[language];

  // Admin authentication - simple key-based
  const handleAdminAccess = () => {
    const adminKey = prompt(language === 'es' ? 'Ingresa la clave de administrador:' : 'Enter admin key:');
    if (adminKey === 'arctika2024') {
      setIsAdmin(true);
      setShowAdmin(true);
    } else if (adminKey !== null) {
      alert(language === 'es' ? 'Clave incorrecta' : 'Incorrect key');
    }
  };

  // Memoize sections to prevent recreation on every render
  const sections = React.useMemo(() => [
    {
      title: t.businessOverview,
      icon: "🧭",
      questions: t.questions.business
    },
    {
      title: t.currentProcesses,
      icon: "🧱",
      questions: t.questions.processes
    },
    {
      title: t.dataInfrastructure,
      icon: "💾",
      questions: t.questions.data
    },
    {
      title: t.aiReadiness,
      icon: "🤖",
      questions: t.questions.ai
    },
    {
      title: t.strategy,
      icon: "🧠",
      questions: t.questions.strategy
    },
    {
      title: t.challenges,
      icon: "🔒",
      questions: t.questions.challenges
    },
    {
      title: t.futureVision,
      icon: "🌍",
      questions: t.questions.future
    }
  ], [t]);

  // Initialize chat - more robust approach
  useEffect(() => {
    if (mode === 'chat' && messages.length === 0 && !chatInitialized.current) {
      chatInitialized.current = true;
      
      // Clear any existing timers first
      if (chatInitTimer) {
        clearTimeout(chatInitTimer);
        setChatInitTimer(null);
      }
      
      // Add messages immediately to prevent multiple initializations
      addBotMessage(t.chatIntro1);
      const timer2 = setTimeout(() => {
        addBotMessage(t.chatIntro2);
      }, 1000);
      setChatInitTimer(timer2);
    }
    
    // Reset when switching modes
    if (mode !== 'chat') {
      chatInitialized.current = false;
      if (chatInitTimer) {
        clearTimeout(chatInitTimer);
        setChatInitTimer(null);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (chatInitTimer) {
        clearTimeout(chatInitTimer);
        setChatInitTimer(null);
      }
    };
  }, [mode, messages.length]);

  // Reset chat when language changes
  useEffect(() => {
    if (mode === 'chat') {
      // Clear messages and reset state
      setMessages([]);
      setChatStage('intro');
      setCurrentQuestionIndex(0);
      setChatResponses({});
      setGeneratedProposal(null);
      
      // Clear any existing timers
      if (chatInitTimer) {
        clearTimeout(chatInitTimer);
        setChatInitTimer(null);
      }
      
      // Reset initialization flag and increment chat key
      chatInitialized.current = false;
      setChatKey(prev => prev + 1);
    }
  }, [language]);

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
    // Use the translated questions directly
    return sections[sectionIndex].questions[questionIndex];
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
        // Use AI to extract name and email
        const contactInfo = await extractContactInfo(userResponse, language);
        
        if (contactInfo.email) {
          setClientEmail(contactInfo.email);
          setClientName(contactInfo.name || 'Client');
          
          setTimeout(() => {
            addBotMessage(`${language === 'es' ? '¡Encantado de conocerte' : 'Nice to meet you'}${contactInfo.name ? ', ' + contactInfo.name : ''}! 🎯`);
            setTimeout(() => {
              addBotMessage(t.chatCompanyInfo);
              setChatStage('company_info');
            }, 1000);
          }, 500);
        } else {
          setTimeout(() => {
            addBotMessage(t.chatEmailError);
          }, 500);
        }
      } else if (chatStage === 'company_info') {
        // Extract company information using AI
        const companyInfo = await extractCompanyInfo(userResponse, language);
        
        if (companyInfo.industry) {
          setCompanyContext({
            companyName: companyInfo.companyName || 'your company',
            industry: companyInfo.industry,
            companySize: companyInfo.companySize || 'organization'
          });
          
          setTimeout(() => {
            const successMsg = t.chatCompanySuccess
              .replace('{companyName}', companyInfo.companyName || '')
              .replace('{industry}', companyInfo.industry);
            addBotMessage(successMsg);
            setTimeout(() => {
              addBotMessage(t.chatReady);
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
            addBotMessage(t.chatCompanyError);
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
            updatedResponses,
            language
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
            updatedResponses,
            language
          );
          
          setCurrentSection(nextSection);
          setCurrentQuestionIndex(0);
          
          setTimeout(() => {
            addBotMessage(sectionSummary + ` ${sections[nextSection].icon}`);
            setTimeout(() => {
              addBotMessage(`${language === 'es' ? 'Ahora pasemos a' : 'Now let\'s move to'} ${sections[nextSection].title}.`);
              setTimeout(async () => {
                const firstQuestion = await generateNextQuestion(
                  sections[nextSection].title,
                  sections[nextSection].questions[0],
                  '',
                  updatedResponses,
                  language
                );
                addBotMessage(firstQuestion);
              }, 1000);
            }, 1000);
          }, 500);
        } else {
          // Completed all questions - Generate proposal
          setChatStage('complete');
          
          setTimeout(() => {
            addBotMessage(t.chatComplete);
            setTimeout(async () => {
              addBotMessage(t.chatGenerating);
              setGeneratingProposal(true);
              
              try {
                // Generate AI proposal
                const proposal = await generateTransformationProposal(companyContext, updatedResponses, sections, language);
                setGeneratedProposal(proposal);
                
                setTimeout(() => {
                  addBotMessage(t.chatSubmissionComplete);
                  // Convert chat responses to form format and save WITH proposal
                  setFormData(updatedResponses);
                  saveToDatabase(updatedResponses, proposal);
                }, 1000);
              } catch (error) {
                console.error('Error generating proposal:', error);
                addBotMessage(t.chatProposalError);
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
          addBotMessage(language === 'es' ? "¡Gracias! Tu evaluación está completa. No dudes en contactarnos si tienes preguntas o quieres discutir los próximos pasos!" : "Thanks! Your assessment is complete. Feel free to reach out if you have any questions or want to discuss next steps!");
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

  // Export current form data as CSV
  const exportCurrentData = () => {
    try {
      // Prepare data for CSV export
      const csvData = [];
      
      // Add header row
      csvData.push([
        'Section',
        'Question',
        'Response',
        'Company Name',
        'Industry',
        'Company Size',
        'Client Name',
        'Client Email',
        'Language',
        'Timestamp'
      ]);
      
      // Add current form data
      sections.forEach((section, sIdx) => {
        section.questions.forEach((question, qIdx) => {
          const key = `section_${sIdx}_q_${qIdx}`;
          const response = formData[key] || '';
          csvData.push([
            section.title,
            question,
            response,
            companyContext.companyName || '',
            companyContext.industry || '',
            companyContext.companySize || '',
            clientName,
            clientEmail,
            language,
            new Date().toISOString()
          ]);
        });
      });
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arctika-assessment-${companyContext.companyName || 'responses'}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV');
      setTimeout(() => setError(null), 5000);
    }
  };


  // Import CSV data
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        // Find relevant columns
        const sectionIndex = headers.indexOf('Section');
        const questionIndex = headers.indexOf('Question');
        const responseIndex = headers.indexOf('Response');
        const companyNameIndex = headers.indexOf('Company Name');
        const industryIndex = headers.indexOf('Industry');
        const companySizeIndex = headers.indexOf('Company Size');
        const clientNameIndex = headers.indexOf('Client Name');
        const clientEmailIndex = headers.indexOf('Client Email');
        const languageIndex = headers.indexOf('Language');

        if (sectionIndex === -1 || questionIndex === -1 || responseIndex === -1) {
          throw new Error('Invalid CSV format. Required columns: Section, Question, Response');
        }

        // Parse CSV data
        const importedData = {};
        let importedCompany = {};
        let importedClient = {};

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            
            if (values.length >= Math.max(sectionIndex, questionIndex, responseIndex) + 1) {
              const section = values[sectionIndex];
              const question = values[questionIndex];
              const response = values[responseIndex];
              
              // Find matching section and question
              const sectionObj = sections.find(s => s.title === section);
              if (sectionObj) {
                const questionIndex = sectionObj.questions.indexOf(question);
                if (questionIndex !== -1) {
                  const sectionIndex = sections.indexOf(sectionObj);
                  const key = `section_${sectionIndex}_q_${questionIndex}`;
                  importedData[key] = response;
                }
              }

              // Import company and client info (from first row)
              if (i === 1) {
                if (companyNameIndex !== -1) importedCompany.companyName = values[companyNameIndex];
                if (industryIndex !== -1) importedCompany.industry = values[industryIndex];
                if (companySizeIndex !== -1) importedCompany.companySize = values[companySizeIndex];
                if (clientNameIndex !== -1) importedClient.name = values[clientNameIndex];
                if (clientEmailIndex !== -1) importedClient.email = values[clientEmailIndex];
                if (languageIndex !== -1) {
                  const importedLang = values[languageIndex];
                  if (importedLang === 'en' || importedLang === 'es') {
                    setLanguage(importedLang);
                  }
                }
              }
            }
          }
        }

        // Apply imported data
        setFormData(importedData);
        setCompanyContext(importedCompany);
        setClientName(importedClient.name || '');
        setClientEmail(importedClient.email || '');

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        console.error('Error importing CSV:', err);
        setError(err.message || 'Failed to import CSV');
        setTimeout(() => setError(null), 5000);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
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

  // Admin page routing
  if (showAdmin) {
    return <AdminPage />;
  }

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
                  <img 
                    src="/Images/logo.png" 
                    alt="Arctika Logo" 
                    className="w-24 h-24 mr-4"
                  />
                  {t.aiTransformationChat}
                </h1>
                <p className="text-gray-600 text-sm">{t.conversationalAssessment}</p>
              </div>
              <div className="flex gap-3">
                {/* Admin Button */}
                <button
                  onClick={handleAdminAccess}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                  title={language === 'es' ? 'Acceso de Administrador' : 'Admin Access'}
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                {/* Language Selector */}
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇦🇷 Español</option>
                  </select>
                  <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => setMode('form')}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t.switchToForm}
                </button>
              </div>
            </div>
            
            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{t.progress}: {Math.round(progress)}%</span>
                <span>{Object.keys(chatResponses).length} {t.responsesCollected}</span>
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
            <div key={chatKey} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  placeholder={language === 'es' ? "Escribe tu respuesta..." : "Type your response..."}
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
              onClick={exportCurrentData}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5 mr-2" />
              {t.exportData}
            </button>
            
            <label className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer">
              <Upload className="w-5 h-5 mr-2" />
              {t.importData}
              <input
                type="file"
                accept=".csv"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              {t.responseSaved}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
              <span className="font-semibold mr-2">{t.error}</span>
              {error}
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                <span className="text-gray-700">{t.processing}</span>
              </div>
            </div>
          )}

          {/* Transformation Proposal - Hidden from users, visible only in admin */}
          {false && generatedProposal && (
            <div className="mt-6 bg-white rounded-lg shadow-xl p-8 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-purple-900 flex items-center">
                  📊 {t.digitalTransformationProposal}
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
                  {t.downloadProposal}
                </button>
              </div>
              
              <div className="prose prose-purple max-w-none">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>{language === 'es' ? 'Empresa' : 'Company'}:</strong> {companyContext.companyName} | <strong>{language === 'es' ? 'Industria' : 'Industry'}:</strong> {companyContext.industry} | <strong>{language === 'es' ? 'Tamaño' : 'Size'}:</strong> {companyContext.companySize}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.generated}: {new Date().toLocaleDateString()} | {t.aiPoweredAnalysis}
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
              <h3 className="text-xl font-bold text-purple-900 mb-2">{t.generatingYourProposal}</h3>
              <p className="text-gray-600">{t.aiAnalyzing}</p>
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <img 
                  src="/Images/logo.png" 
                  alt="Arctika Logo" 
                  className="w-28 h-28 mr-6"
                />
                {t.aiTransformationAssessment}
              </h1>
              <p className="text-gray-600">
                {t.detailedForm}
              </p>
            </div>
            <div className="flex gap-3">
              {/* Admin Button */}
              <button
                onClick={handleAdminAccess}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                title={language === 'es' ? 'Acceso de Administrador' : 'Admin Access'}
              >
                <Settings className="w-4 h-4" />
              </button>
              
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇦🇷 Español</option>
                </select>
                <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => setMode('chat')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t.switchToChat}
              </button>
            </div>
          </div>
          
          {/* Client & Company Info */}
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t.yourName}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder={t.emailAddress}
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder={t.companyName}
                value={companyContext.companyName}
                onChange={(e) => setCompanyContext({...companyContext, companyName: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder={t.industry}
                value={companyContext.industry}
                onChange={(e) => setCompanyContext({...companyContext, industry: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder={t.companySize}
                value={companyContext.companySize}
                onChange={(e) => setCompanyContext({...companyContext, companySize: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t.progress}: {Math.round(progress)}%</span>
              <span>{t.section} {currentSection + 1} {t.of} {sections.length}</span>
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
                    placeholder={t.enterResponse}
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
            {t.previous}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => saveToDatabase()}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Save className="w-5 h-5 mr-2" />
              {t.saveProgress}
            </button>

            <button
              onClick={exportCurrentData}
              className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Download className="w-5 h-5 mr-2" />
              {t.exportData}
            </button>
            
            <label className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer">
              <Upload className="w-5 h-5 mr-2" />
              {t.importData}
              <input
                type="file"
                accept=".csv"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>

          {currentSection === sections.length - 1 ? (
            <button
              onClick={async () => {
                if (!companyContext.industry || !clientName || !clientEmail) {
                  setError(language === 'es' ? 'Por favor completa toda la información de la empresa y contacto primero' : 'Please fill in all company and contact information first');
                  setTimeout(() => setError(null), 3000);
                  return;
                }
                
                setGeneratingProposal(true);
                try {
                  // Generate proposal for admin use (hidden from user)
                  const proposal = await generateTransformationProposal(companyContext, formData, sections, language);
                  setGeneratedProposal(proposal);
                  saveToDatabase(formData, proposal);
                  
                  // Show submission success message
                  setShowSuccess(t.submissionSuccess);
                  setTimeout(() => setShowSuccess(null), 5000);
                } catch (error) {
                  console.error('Error processing submission:', error);
                  setError(language === 'es' ? 'Error al procesar la información. Por favor intenta de nuevo.' : 'Failed to process submission. Please try again.');
                  setTimeout(() => setError(null), 5000);
                } finally {
                  setGeneratingProposal(false);
                }
              }}
              disabled={generatingProposal}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {generatingProposal ? t.generatingProposal : t.completeGenerateProposal}
            </button>
          ) : (
            <button
              onClick={nextSection}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t.next}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
            <CheckCircle className="w-6 h-6 mr-3" />
            {t.responseSaved}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
            <span className="font-semibold mr-2">{t.error}</span>
            {error}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-700">{t.processing}</span>
            </div>
          </div>
        )}

        {/* Section Navigation */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{language === 'es' ? 'Todas las Secciones' : 'All Sections'}</h3>
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
              <h3 className="font-semibold text-gray-800">{t.formCompletion}</h3>
              <p className="text-gray-600 text-sm">
                {Object.values(formData).filter(v => v && v.trim()).length} {t.of}{' '}
                {sections.reduce((sum, s) => sum + s.questions.length, 0)} {t.questionsAnswered}
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
            <h3 className="text-xl font-bold text-blue-900 mb-2">{t.generatingYourProposal}</h3>
            <p className="text-gray-600">{language === 'es' ? `La IA está analizando tus respuestas y creando una estrategia de transformación adaptada para ${companyContext.companyName}...` : `AI is analyzing your responses and creating a tailored transformation strategy for ${companyContext.companyName}...`}</p>
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
                📊 {t.digitalTransformationProposal}
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
                {t.downloadProposal}
              </button>
            </div>
            
            <div className="prose prose-blue max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{language === 'es' ? 'Empresa' : 'Company'}:</strong> {companyContext.companyName} | <strong>{language === 'es' ? 'Industria' : 'Industry'}:</strong> {companyContext.industry} | <strong>{language === 'es' ? 'Tamaño' : 'Size'}:</strong> {companyContext.companySize}
                </p>
                <p className="text-xs text-gray-500">
                  {t.generated}: {new Date().toLocaleDateString()} | {t.aiPoweredAnalysis}
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