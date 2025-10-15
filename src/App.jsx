import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Save, Download, CheckCircle, MessageSquare, FileText, Send, Bot, Globe, Upload, Settings, X, RefreshCw } from 'lucide-react';
import { supabase } from './supabaseClient';
import { extractContactInfo, extractCompanyInfo, generateNextQuestion, summarizeSection, generateTransformationProposal } from './aiService';
import AdminPage from './AdminPage';

export default function TransformationForm() {
  const [mode, setMode] = useState('chat');
  const [language, setLanguage] = useState('en');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [companyContext, setCompanyContext] = useState({
    industry: '',
    companySize: '',
    companyName: ''
  });
  
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [chatStage, setChatStage] = useState('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatResponses, setChatResponses] = useState({});
  const [generatedProposal, setGeneratedProposal] = useState(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInitialized = useRef(false);
  const [chatInitTimer, setChatInitTimer] = useState(null);
  const [chatKey, setChatKey] = useState(0);
  
  // Save progress functionality
  const [showSaveProgressModal, setShowSaveProgressModal] = useState(false);
  const [showRetrieveProgressModal, setShowRetrieveProgressModal] = useState(false);
  const [progressKey, setProgressKey] = useState('');
  const [saveProgressStatus, setSaveProgressStatus] = useState(null);

  const translations = {
    en: {
      aiTransformationChat: "Arctika AI Onboarding Questionnaire",
      aiTransformationAssessment: "Arctika AI Onboarding Questionnaire",
      conversationalAssessment: "Conversational assessment - answer naturally!",
      detailedForm: "Detailed form for comprehensive assessment",
      switchToForm: "Switch to Form",
      switchToChat: "Switch to Chat",
      formShort: "Form",
      chatShort: "Chat",
      selectLanguage: "Select Language",
      english: "English",
      spanish: "Español (Argentina)",
      progress: "Progress",
      responsesCollected: "responses collected",
      section: "Section",
      of: "of",
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
      yourName: "Your Name",
      emailAddress: "Email Address",
      companyName: "Company Name",
      industry: "Industry (e.g., Oil & Gas)",
      companySize: "Company Size (e.g., 500 employees)",
      enterResponse: "Enter your response...",
      previous: "Previous",
      next: "Next",
      saveProgress: "Save Progress",
      saveProgressSuccess: "Progress saved! Your key: {key}",
      saveProgressError: "Failed to save progress. Please try again.",
      retrieveProgress: "Retrieve Progress",
      enterProgressKey: "Enter your progress key",
      retrieveProgressSuccess: "Progress retrieved successfully!",
      retrieveProgressError: "Invalid key or no saved progress found.",
      progressKey: "Progress Key",
      exportData: "Export CSV",
      importData: "Import CSV",
      completeGenerateProposal: "Submit Assessment",
      generatingProposal: "Submitting...",
      submissionSuccess: "✅ Assessment submitted successfully! Our team will review your information and contact you with a detailed transformation proposal within 2-3 business days.",
      downloadProposal: "Download Proposal",
      businessOverview: "Business Overview & Goals",
      currentProcesses: "Current Processes & Operations",
      dataInfrastructure: "Data Infrastructure & Systems",
      aiReadiness: "AI / Automation Readiness",
      strategy: "Strategy & Decision-Making",
      challenges: "Challenges & Risks",
      futureVision: "Future Vision & Opportunities",
      responseSaved: "Response saved successfully!",
      error: "Error:",
      processing: "Processing...",
      generatingYourProposal: "Generating Your Proposal",
      aiAnalyzing: "AI is analyzing your responses and creating a tailored transformation strategy...",
      digitalTransformationProposal: "Digital Transformation Proposal",
      generated: "Generated:",
      aiPoweredAnalysis: "AI-Powered Analysis",
      formCompletion: "Form Completion",
      questionsAnswered: "questions answered",
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
      aiTransformationChat: "Cuestionario de Incorporación Arctika AI",
      aiTransformationAssessment: "Cuestionario de Incorporación Arctika AI",
      conversationalAssessment: "Evaluación conversacional - ¡responde naturalmente!",
      detailedForm: "Formulario detallado para evaluación integral",
      switchToForm: "Ir a Formulario",
      switchToChat: "Cambiar a Chat",
      formShort: "Formulario",
      chatShort: "Chat",
      selectLanguage: "Seleccionar Idioma",
      english: "English",
      spanish: "Español (Argentina)",
      progress: "Progreso",
      responsesCollected: "respuestas recolectadas",
      section: "Sección",
      of: "de",
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
      yourName: "Tu Nombre",
      emailAddress: "Dirección de Email",
      companyName: "Nombre de la Empresa",
      industry: "Industria (ej., Petróleo y Gas)",
      companySize: "Tamaño de la Empresa (ej., 500 empleados)",
      enterResponse: "Ingresa tu respuesta...",
      previous: "Anterior",
      next: "Siguiente",
      saveProgress: "Guardar Progreso",
      saveProgressSuccess: "¡Progreso guardado! Tu clave: {key}",
      saveProgressError: "Error al guardar el progreso. Intenta de nuevo.",
      retrieveProgress: "Recuperar Progreso",
      enterProgressKey: "Ingresa tu clave de progreso",
      retrieveProgressSuccess: "¡Progreso recuperado exitosamente!",
      retrieveProgressError: "Clave inválida o no se encontró progreso guardado.",
      progressKey: "Clave de Progreso",
      exportData: "Exportar CSV",
      importData: "Importar CSV",
      completeGenerateProposal: "Enviar Evaluación",
      generatingProposal: "Enviando...",
      submissionSuccess: "✅ ¡Evaluación enviada exitosamente! Nuestro equipo revisará tu información y te contactará con una propuesta detallada de transformación en 2-3 días hábiles.",
      downloadProposal: "Descargar Propuesta",
      businessOverview: "Visión General del Negocio y Objetivos",
      currentProcesses: "Procesos y Operaciones Actuales",
      dataInfrastructure: "Infraestructura de Datos y Sistemas",
      aiReadiness: "Preparación para IA / Automatización",
      strategy: "Estrategia y Toma de Decisiones",
      challenges: "Desafíos y Riesgos",
      futureVision: "Visión Futura y Oportunidades",
      responseSaved: "¡Respuesta guardada exitosamente!",
      error: "Error:",
      processing: "Procesando...",
      generatingYourProposal: "Generando Tu Propuesta",
      aiAnalyzing: "La IA está analizando tus respuestas y creando una estrategia de transformación adaptada...",
      digitalTransformationProposal: "Propuesta de Transformación Digital",
      generated: "Generado:",
      aiPoweredAnalysis: "Análisis Impulsado por IA",
      formCompletion: "Completitud del Formulario",
      questionsAnswered: "preguntas respondidas",
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

  const handleAdminAccess = () => {
    const adminKey = prompt(language === 'es' ? 'Ingresa la clave de administrador:' : 'Enter admin key:');
    if (adminKey === 'arctika2024') {
      setIsAdmin(true);
      setShowAdmin(true);
    } else if (adminKey !== null) {
      alert(language === 'es' ? 'Clave incorrecta' : 'Incorrect key');
    }
  };

  // Generate a unique progress key
  const generateProgressKey = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`.toUpperCase();
  };

  // Save progress to database
  const saveProgress = async () => {
    try {
      const key = generateProgressKey();
      
      // Use proper schema columns
      const progressData = {
        progress_key: key,
        mode: mode,
        language: language,
        current_section: currentSection,
        client_name: clientName || '',
        client_email: clientEmail || '',
        company_name: companyContext.companyName || '',
        industry: companyContext.industry || '',
        company_size: companyContext.companySize || '',
        form_data: formData,
        chat_responses: chatResponses,
        company_context: companyContext,
        responses: {}, // Empty for progress saves
        completion_percentage: 0
      };

      const { error } = await supabase
        .from('transformation_assessments')
        .insert([progressData]);

      if (error) throw error;

      setProgressKey(key);
      setSaveProgressStatus('success');
      setShowSaveProgressModal(true);
    } catch (error) {
      console.error('Error saving progress:', error);
      setSaveProgressStatus('error');
      setShowSaveProgressModal(true);
    }
  };

  // Retrieve progress from database
  const retrieveProgress = async (key) => {
    try {
      const { data, error } = await supabase
        .from('transformation_assessments')
        .select('*')
        .eq('progress_key', key.toUpperCase())
        .single();

      if (error) throw error;

      if (data) {
        // Restore all the state
        setMode(data.mode || 'chat');
        setLanguage(data.language || 'en');
        setCurrentSection(data.current_section || 0);
        setFormData(data.form_data || {});
        setChatResponses(data.chat_responses || {});
        setClientName(data.client_name || '');
        setClientEmail(data.client_email || '');
        setCompanyContext(data.company_context || { industry: '', companySize: '', companyName: '' });
        
        setSaveProgressStatus('retrieve_success');
        setShowRetrieveProgressModal(true);
      }
    } catch (error) {
      console.error('Error retrieving progress:', error);
      setSaveProgressStatus('retrieve_error');
      setShowRetrieveProgressModal(true);
    }
  };

  const sections = React.useMemo(() => [
    { title: t.businessOverview, icon: "🧭", questions: t.questions.business },
    { title: t.currentProcesses, icon: "🧱", questions: t.questions.processes },
    { title: t.dataInfrastructure, icon: "💾", questions: t.questions.data },
    { title: t.aiReadiness, icon: "🤖", questions: t.questions.ai },
    { title: t.strategy, icon: "🧠", questions: t.questions.strategy },
    { title: t.challenges, icon: "🔒", questions: t.questions.challenges },
    { title: t.futureVision, icon: "🌍", questions: t.questions.future }
  ], [t]);

  // Initialize chat - FIXED to prevent duplicates
  useEffect(() => {
    if (mode === 'chat' && messages.length === 0 && !chatInitialized.current) {
      chatInitialized.current = true;
      
      // Add initial messages
      const timer1 = setTimeout(() => {
        addBotMessage(t.chatIntro1);
        const timer2 = setTimeout(() => {
          addBotMessage(t.chatIntro2);
        }, 1000);
      }, 300);
      
      // Cleanup function
      return () => {
        clearTimeout(timer1);
      };
    }
  }, [mode, t.chatIntro1, t.chatIntro2]);

  // Reset chat on language change
  useEffect(() => {
    if (mode === 'chat') {
      // Clear everything
      setMessages([]);
      setChatStage('intro');
      setCurrentQuestionIndex(0);
      setChatResponses({});
      setGeneratedProposal(null);
      
      // Reset the initialization flag AFTER clearing messages
      // This allows the previous useEffect to run again
      const timer = setTimeout(() => {
        chatInitialized.current = false;
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [language, mode]);

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
    return sections[sectionIndex].questions[questionIndex];
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    addUserMessage(currentInput);
    const userResponse = currentInput;
    setCurrentInput('');
    setLoading(true);

    try {
      if (chatStage === 'intro') {
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
        const key = `section_${currentSection}_q_${currentQuestionIndex}`;
        const updatedResponses = { ...chatResponses, [key]: userResponse };
        setChatResponses(updatedResponses);

        const totalQuestionsInSection = sections[currentSection].questions.length;
        
        if (currentQuestionIndex < totalQuestionsInSection - 1) {
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
          setChatStage('complete');
          setTimeout(() => {
            addBotMessage(t.chatComplete);
            setTimeout(async () => {
              addBotMessage(t.chatGenerating);
              setGeneratingProposal(true);
              try {
                const proposal = await generateTransformationProposal(companyContext, updatedResponses, sections, language);
                setGeneratedProposal(proposal);
                setTimeout(() => {
                  addBotMessage(t.chatSubmissionComplete);
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
    setFormData(prev => ({ ...prev, [key]: value }));
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

  const exportCurrentData = () => {
    try {
      const csvData = [];
      csvData.push([
        'Section', 'Question', 'Response', 'Company Name', 'Industry', 
        'Company Size', 'Client Name', 'Client Email', 'Language', 'Timestamp'
      ]);
      
      sections.forEach((section, sIdx) => {
        section.questions.forEach((question, qIdx) => {
          const key = `section_${sIdx}_q_${qIdx}`;
          const response = formData[key] || '';
          csvData.push([
            section.title, question, response,
            companyContext.companyName || '', companyContext.industry || '',
            companyContext.companySize || '', clientName, clientEmail,
            language, new Date().toISOString()
          ]);
        });
      });
      
      const csvContent = csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
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

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
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
              
              const sectionObj = sections.find(s => s.title === section);
              if (sectionObj) {
                const questionIndex = sectionObj.questions.indexOf(question);
                if (questionIndex !== -1) {
                  const sectionIndex = sections.indexOf(sectionObj);
                  const key = `section_${sectionIndex}_q_${questionIndex}`;
                  importedData[key] = response;
                }
              }

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

  if (showAdmin) {
    return <AdminPage />;
  }

  // CHAT MODE
  if (mode === 'chat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header - Improved responsive design */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="flex items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mr-3 sm:mr-4 flex-shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="Arctika Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-1">
                    {t.aiTransformationChat}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600">{t.conversationalAssessment}</p>
                </div>
              </div>
              
              <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
                <button
                  onClick={handleAdminAccess}
                  className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
                  title={language === 'es' ? 'Acceso de Administrador' : 'Admin Access'}
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇦🇷 Español</option>
                </select>
                
                <button
                  onClick={() => setMode('form')}
                  className="flex items-center px-2 sm:px-3 lg:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm min-w-0 flex-shrink-0"
                >
                  <FileText className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden lg:inline truncate">{t.switchToForm}</span>
                  <span className="hidden sm:inline lg:hidden truncate">{t.formShort}</span>
                  <span className="sm:hidden truncate">{t.formShort}</span>
                </button>
              </div>
            </div>
            
            {/* Progress - Improved layout */}
            <div className="mt-4">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                <span>{t.progress}: {Math.round(progress)}%</span>
                <span className="text-right">{Object.keys(chatResponses).length} {t.responsesCollected}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Chat Container - Better mobile height */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col" 
               style={{ height: 'calc(100vh - 320px)', minHeight: '400px', maxHeight: '600px' }}>
            
            {/* Messages */}
            <div key={chatKey} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  } shadow-sm`}>
                    {msg.type === 'bot' && <Bot className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />}
                    <span className="text-xs sm:text-sm">{msg.text}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - Better mobile layout */}
            <form onSubmit={handleChatSubmit} className="border-t border-gray-200 p-3 sm:p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={language === 'es' ? "Escribe tu respuesta..." : "Type your response..."}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base"
                  disabled={chatStage === 'complete' || loading}
                />
                <button
                  type="submit"
                  disabled={chatStage === 'complete' || !currentInput.trim() || loading}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center shadow-lg"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Actions - Improved mobile layout */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={saveProgress}
              className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm shadow-lg"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.saveProgress}
            </button>
            
            <button
              onClick={() => setShowRetrieveProgressModal(true)}
              className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition text-sm shadow-lg"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.retrieveProgress}
            </button>
            
            <button
              onClick={exportCurrentData}
              className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm shadow-lg"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.exportData}
            </button>
            
            <label className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition cursor-pointer text-sm shadow-lg">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.importData}
              <input type="file" accept=".csv" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Notifications - Better positioning */}
        {showSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center animate-slideIn z-50 max-w-[90%] sm:max-w-md">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-sm sm:text-base">{t.responseSaved}</span>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center animate-slideIn z-50 max-w-[90%] sm:max-w-md">
            <X className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="text-sm sm:text-base">
              <span className="font-semibold">{t.error}</span> {error}
            </div>
          </div>
        )}

        {generatingProposal && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center z-50 max-w-[90%] sm:max-w-md">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            <span className="text-sm sm:text-base">{t.generatingProposal}</span>
          </div>
        )}

      </div>
    );
  }

  // FORM MODE - Continuing in next message due to length...
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
            <div className="flex items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mr-3 sm:mr-4 lg:mr-6 flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Arctika Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                  {t.aiTransformationAssessment}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">{t.detailedForm}</p>
              </div>
            </div>
            
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
              <button
                onClick={handleAdminAccess}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
                title={language === 'es' ? 'Acceso de Administrador' : 'Admin Access'}
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇦🇷 Español</option>
              </select>
              
              <button
                onClick={() => setMode('chat')}
                className="flex items-center px-2 sm:px-3 lg:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm min-w-0 flex-shrink-0"
              >
                <MessageSquare className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden lg:inline truncate">{t.switchToChat}</span>
                <span className="hidden sm:inline lg:hidden truncate">{t.chatShort}</span>
                <span className="sm:hidden truncate">{t.chatShort}</span>
              </button>
            </div>
          </div>
          
          {/* Client & Company Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder={t.yourName}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <input
                type="email"
                placeholder={t.emailAddress}
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder={t.companyName}
                value={companyContext.companyName}
                onChange={(e) => setCompanyContext({...companyContext, companyName: e.target.value})}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder={t.industry}
                value={companyContext.industry}
                onChange={(e) => setCompanyContext({...companyContext, industry: e.target.value})}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder={t.companySize}
                value={companyContext.companySize}
                onChange={(e) => setCompanyContext({...companyContext, companySize: e.target.value})}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span>{t.progress}: {Math.round(progress)}%</span>
              <span>{t.section} {currentSection + 1} {t.of} {sections.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Current Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className="flex items-center mb-4 sm:mb-6">
            <span className="text-3xl sm:text-4xl mr-3 sm:mr-4">{sections[currentSection].icon}</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {sections[currentSection].title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">{t.section} {currentSection + 1} {t.of} {sections.length}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 sm:space-y-6">
            {sections[currentSection].questions.map((question, qIndex) => {
              const key = `section_${currentSection}_q_${qIndex}`;
              return (
                <div key={qIndex}>
                  <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    {qIndex + 1}. {question}
                  </label>
                  <textarea
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(currentSection, qIndex, e.target.value)}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[100px] text-sm sm:text-base"
                    placeholder={t.enterResponse}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
          <button
            onClick={prevSection}
            disabled={currentSection === 0}
            className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {t.previous}
          </button>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              onClick={saveProgress}
              className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm shadow-lg"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.saveProgress}
            </button>
            
            <button
              onClick={() => setShowRetrieveProgressModal(true)}
              className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition text-sm shadow-lg"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.retrieveProgress}
            </button>

            <button
              onClick={exportCurrentData}
              className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm shadow-lg"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.exportData}
            </button>
            
            <label className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition cursor-pointer text-sm shadow-lg">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.importData}
              <input type="file" accept=".csv" onChange={importData} className="hidden" />
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
                  const proposal = await generateTransformationProposal(companyContext, formData, sections, language);
                  setGeneratedProposal(proposal);
                  saveToDatabase(formData, proposal);
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
              className="flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm shadow-lg"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {generatingProposal ? t.generatingProposal : t.completeGenerateProposal}
            </button>
          ) : (
            <button
              onClick={nextSection}
              className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm"
            >
              {t.next}
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </button>
          )}
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">
            {language === 'es' ? 'Todas las Secciones' : 'All Sections'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => setCurrentSection(index)}
                className={`p-3 rounded-lg text-left transition ${
                  currentSection === index
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">{section.icon}</div>
                <div className="text-xs font-medium line-clamp-2">{section.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Completion Status */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{t.formCompletion}</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                {Object.values(formData).filter(v => v && v.trim()).length} {t.of}{' '}
                {sections.reduce((sum, s) => sum + s.questions.length, 0)} {t.questionsAnswered}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {calculateCompletion()}%
            </div>
          </div>
        </div>

        {/* Notifications */}
        {showSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center animate-slideIn z-50 max-w-[90%] sm:max-w-md">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-sm sm:text-base">{showSuccess === true ? t.responseSaved : showSuccess}</span>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center animate-slideIn z-50 max-w-[90%] sm:max-w-md">
            <X className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="text-sm sm:text-base">
              <span className="font-semibold">{t.error}</span> {error}
            </div>
          </div>
        )}

        {generatingProposal && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center z-50 max-w-[90%] sm:max-w-md">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            <span className="text-sm sm:text-base">{t.generatingProposal}</span>
          </div>
        )}

        {/* Save Progress Modal */}
        {showSaveProgressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                {saveProgressStatus === 'success' ? (
                  <>
                    <div className="text-green-500 text-4xl mb-4">✅</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {t.saveProgressSuccess.replace('{key}', progressKey)}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {language === 'es' 
                        ? 'Guarda esta clave para recuperar tu progreso más tarde.' 
                        : 'Save this key to retrieve your progress later.'
                      }
                    </p>
                    <button
                      onClick={() => {
                        setShowSaveProgressModal(false);
                        navigator.clipboard.writeText(progressKey);
                        alert(language === 'es' ? 'Clave copiada al portapapeles' : 'Key copied to clipboard');
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                    >
                      {language === 'es' ? 'Copiar Clave' : 'Copy Key'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-red-500 text-4xl mb-4">❌</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {t.saveProgressError}
                    </h3>
                    <button
                      onClick={() => setShowSaveProgressModal(false)}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                    >
                      {language === 'es' ? 'Cerrar' : 'Close'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Retrieve Progress Modal */}
        {showRetrieveProgressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                {saveProgressStatus === 'retrieve_success' ? (
                  <>
                    <div className="text-green-500 text-4xl mb-4">✅</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {t.retrieveProgressSuccess}
                    </h3>
                    <button
                      onClick={() => {
                        setShowRetrieveProgressModal(false);
                        setSaveProgressStatus(null);
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                    >
                      {language === 'es' ? 'Continuar' : 'Continue'}
                    </button>
                  </>
                ) : saveProgressStatus === 'retrieve_error' ? (
                  <>
                    <div className="text-red-500 text-4xl mb-4">❌</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {t.retrieveProgressError}
                    </h3>
                    <button
                      onClick={() => {
                        setShowRetrieveProgressModal(false);
                        setSaveProgressStatus(null);
                      }}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                    >
                      {language === 'es' ? 'Cerrar' : 'Close'}
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {t.retrieveProgress}
                    </h3>
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder={t.enterProgressKey}
                        value={progressKey}
                        onChange={(e) => setProgressKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRetrieveProgressModal(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                      >
                        {language === 'es' ? 'Cancelar' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => retrieveProgress(progressKey)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                      >
                        {language === 'es' ? 'Recuperar' : 'Retrieve'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}