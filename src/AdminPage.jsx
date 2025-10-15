import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { generateTransformationProposal } from './aiService';
import { 
  Download, 
  Eye, 
  FileText, 
  RefreshCw, 
  Search, 
  Filter,
  Calendar,
  Building,
  Mail,
  User,
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';

const AdminPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showProposal, setShowProposal] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [language, setLanguage] = useState('en');

  // Translations
  const translations = {
    en: {
      title: "Admin Dashboard",
      subtitle: "Arctika AI Onboarding Management",
      totalSubmissions: "Total Submissions",
      searchPlaceholder: "Search by company name, email, or industry...",
      filterIndustry: "Filter by Industry",
      filterStatus: "Filter by Status",
      allIndustries: "All Industries",
      allStatuses: "All Statuses",
      noProposal: "No Proposal",
      hasProposal: "Has Proposal",
      viewDetails: "View Details",
      generateProposal: "Generate Proposal",
      regenerateProposal: "Regenerate Proposal",
      downloadProposal: "Download Proposal",
      downloadCSV: "Download CSV",
      backToList: "Back to List",
      companyInfo: "Company Information",
      clientInfo: "Client Information",
      responses: "Assessment Responses",
      proposal: "Generated Proposal",
      noData: "No assessment data available",
      noAssessments: "No assessments found matching your criteria",
      loading: "Loading assessments...",
      generatingProposal: "Generating proposal...",
      proposalGenerated: "Proposal generated successfully!",
      errorGenerating: "Error generating proposal",
      errorLoading: "Error loading assessments",
      company: "Company",
      industry: "Industry",
      size: "Size",
      clientName: "Client Name",
      email: "Email",
      language: "Language",
      submitted: "Submitted",
      status: "Status",
      actions: "Actions",
      refresh: "Refresh",
      exportAll: "Export All",
      backToForm: "Back to Form",
      recentActivity: "Recent Activity",
      thisWeek: "This Week",
      avgCompletion: "Avg Completion"
    },
    es: {
      title: "Panel de Administración",
      subtitle: "Gestión de Incorporación Arctika AI",
      totalSubmissions: "Total de Envíos",
      searchPlaceholder: "Buscar por nombre de empresa, email o industria...",
      filterIndustry: "Filtrar por Industria",
      filterStatus: "Filtrar por Estado",
      allIndustries: "Todas las Industrias",
      allStatuses: "Todos los Estados",
      noProposal: "Sin Propuesta",
      hasProposal: "Con Propuesta",
      viewDetails: "Ver Detalles",
      generateProposal: "Generar Propuesta",
      regenerateProposal: "Regenerar Propuesta",
      downloadProposal: "Descargar Propuesta",
      downloadCSV: "Descargar CSV",
      backToList: "Volver a la Lista",
      companyInfo: "Información de la Empresa",
      clientInfo: "Información del Cliente",
      responses: "Respuestas de la Evaluación",
      proposal: "Propuesta Generada",
      noData: "No hay datos de evaluación disponibles",
      noAssessments: "No se encontraron evaluaciones",
      loading: "Cargando evaluaciones...",
      generatingProposal: "Generando propuesta...",
      proposalGenerated: "¡Propuesta generada exitosamente!",
      errorGenerating: "Error generando propuesta",
      errorLoading: "Error cargando evaluaciones",
      company: "Empresa",
      industry: "Industria",
      size: "Tamaño",
      clientName: "Nombre del Cliente",
      email: "Email",
      language: "Idioma",
      submitted: "Enviado",
      status: "Estado",
      actions: "Acciones",
      refresh: "Actualizar",
      exportAll: "Exportar Todo",
      backToForm: "Volver al Formulario",
      recentActivity: "Actividad Reciente",
      thisWeek: "Esta Semana",
      avgCompletion: "Completitud Promedio"
    }
  };

  const t = translations[language];

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transformation_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError(t.errorLoading);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const generateProposalForAssessment = async (assessment) => {
    try {
      setGeneratingProposal(true);
      
      const formData = typeof assessment.responses === 'string' 
        ? JSON.parse(assessment.responses) 
        : assessment.responses;
      
      const companyContext = {
        companyName: assessment.company_name,
        industry: assessment.industry,
        companySize: assessment.company_size
      };
      
      const sections = [
        { title: language === 'es' ? 'Visión General del Negocio' : 'Business Overview', questions: [] },
        { title: language === 'es' ? 'Procesos Actuales' : 'Current Processes', questions: [] },
        { title: language === 'es' ? 'Infraestructura de Datos' : 'Data Infrastructure', questions: [] },
        { title: language === 'es' ? 'Preparación para IA' : 'AI Readiness', questions: [] },
        { title: language === 'es' ? 'Estrategia' : 'Strategy', questions: [] },
        { title: language === 'es' ? 'Desafíos' : 'Challenges', questions: [] },
        { title: language === 'es' ? 'Visión Futura' : 'Future Vision', questions: [] }
      ];

      const proposal = await generateTransformationProposal(companyContext, formData, sections, language);
      
      const { error } = await supabase
        .from('transformation_assessments')
        .update({ 
          proposal: proposal,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment.id);

      if (error) throw error;

      setAssessments(prev => prev.map(a => 
        a.id === assessment.id ? { ...a, proposal: proposal } : a
      ));

      setSuccess(t.proposalGenerated);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating proposal:', err);
      setError(t.errorGenerating);
      setTimeout(() => setError(null), 5000);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const downloadProposal = (assessment) => {
    if (!assessment.proposal) return;
    
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Transformation Proposal - ${assessment.company_name || 'Company'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
            h2 { color: #6b21a8; margin-top: 30px; }
            h3 { color: #8b5cf6; margin-top: 20px; }
            .header { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Digital Transformation Proposal</h1>
            <div><strong>Company:</strong> ${assessment.company_name || 'N/A'}</div>
            <div><strong>Industry:</strong> ${assessment.industry || 'N/A'}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
          <div>${assessment.proposal.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.company_name || 'Company'}-Transformation-Proposal.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllData = () => {
    try {
      const csvData = [['ID', 'Company', 'Industry', 'Size', 'Client', 'Email', 'Date', 'Has Proposal']];
      assessments.forEach(a => {
        csvData.push([
          a.id,
          a.company_name || '',
          a.industry || '',
          a.company_size || '',
          a.client_name || '',
          a.client_email || '',
          new Date(a.created_at).toLocaleDateString(),
          a.proposal ? 'Yes' : 'No'
        ]);
      });

      const csvContent = csvData.map(row =>
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arctika-admin-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Error exporting data');
      setTimeout(() => setError(null), 5000);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = searchTerm === '' || 
      (assessment.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.client_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = filterIndustry === '' || assessment.industry === filterIndustry;
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'hasProposal' && assessment.proposal) ||
      (filterStatus === 'noProposal' && !assessment.proposal);
    
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const industries = [...new Set(assessments.map(a => a.industry).filter(Boolean))];
  
  // Calculate stats
  const stats = {
    total: assessments.length,
    withProposal: assessments.filter(a => a.proposal).length,
    thisWeek: assessments.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.created_at) > weekAgo;
    }).length,
    avgCompletion: Math.round(
      assessments.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / 
      (assessments.length || 1)
    )
  };

  if (selectedAssessment && showProposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-3 sm:gap-4">
                <img src="/Images/logo.png" alt="Arctika" className="w-10 h-10 sm:w-12 sm:h-12" />
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-gray-900">{t.title}</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                </select>
                <button
                  onClick={() => { setSelectedAssessment(null); setShowProposal(false); }}
                  className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t.backToList}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Company Card */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-purple-100">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                  {t.companyInfo}
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">{t.company}</span>
                    <p className="text-sm sm:text-base text-gray-900 font-medium">{selectedAssessment.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">{t.industry}</span>
                    <p className="text-sm sm:text-base text-gray-900">{selectedAssessment.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">{t.size}</span>
                    <p className="text-sm sm:text-base text-gray-900">{selectedAssessment.company_size || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Client Card */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  {t.clientInfo}
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">{t.clientName}</span>
                    <p className="text-sm sm:text-base text-gray-900">{selectedAssessment.client_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">{t.email}</span>
                    <p className="text-sm sm:text-base text-gray-900 break-all">{selectedAssessment.client_email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">{t.submitted}</span>
                    <p className="text-sm sm:text-base text-gray-900">{new Date(selectedAssessment.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-4 sm:p-6 border border-purple-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                  {t.actions}
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => generateProposalForAssessment(selectedAssessment)}
                    disabled={generatingProposal}
                    className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition text-sm sm:text-base font-medium shadow-md"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generatingProposal ? 'animate-spin' : ''}`} />
                    {generatingProposal ? t.generatingProposal : (selectedAssessment.proposal ? t.regenerateProposal : t.generateProposal)}
                  </button>
                  
                  {selectedAssessment.proposal && (
                    <button
                      onClick={() => downloadProposal(selectedAssessment)}
                      className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm sm:text-base font-medium shadow-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t.downloadProposal}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Proposal Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 border border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-purple-600" />
                  {t.proposal}
                </h2>
                
                {selectedAssessment.proposal ? (
                  <div className="prose prose-purple max-w-none">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6 border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        <strong>{t.company}:</strong> {selectedAssessment.company_name} | 
                        <strong className="ml-2">{t.industry}:</strong> {selectedAssessment.industry}
                      </p>
                      <p className="text-xs text-gray-500">
                        Generated: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-gray-800 leading-relaxed space-y-4 text-sm sm:text-base">
                      {selectedAssessment.proposal.split('\n').map((line, idx) => {
                        if (line.startsWith('### ')) {
                          return <h3 key={idx} className="text-lg sm:text-xl font-bold text-purple-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={idx} className="text-xl sm:text-2xl font-bold text-purple-900 mt-8 mb-4 pb-2 border-b-2 border-purple-200">{line.replace('## ', '')}</h2>;
                        }
                        if (line.trim() === '') {
                          return <br key={idx} />;
                        }
                        const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
                        return <p key={idx} className="text-gray-700" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Proposal Generated</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6">Generate a proposal to view it here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src="/Images/logo.png" alt="Arctika" className="w-10 h-10 sm:w-12 sm:h-12" />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
              <button
                onClick={() => window.location.href = '/'}
                className="hidden sm:flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToForm}
              </button>
              <button
                onClick={fetchAssessments}
                className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t.refresh}</span>
              </button>
              <button
                onClick={exportAllData}
                className="hidden sm:flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.exportAll}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{t.totalSubmissions}</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{t.hasProposal}</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.withProposal}</p>
              </div>
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{t.thisWeek}</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{t.avgCompletion}</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.avgCompletion}%</p>
              </div>
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                {t.searchPlaceholder}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                {t.filterIndustry}
              </label>
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.allIndustries}</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                {t.filterStatus}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.allStatuses}</option>
                <option value="hasProposal">{t.hasProposal}</option>
                <option value="noProposal">{t.noProposal}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Assessments List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">{t.loading}</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noAssessments}</h3>
              <p className="text-gray-600">{t.noData}</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-gray-200">
                {filteredAssessments.map((assessment) => (
                  <div key={assessment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{assessment.company_name || 'N/A'}</h3>
                        <p className="text-sm text-gray-600">{assessment.industry || 'N/A'}</p>
                      </div>
                      {assessment.proposal ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center mb-1">
                        <Mail className="w-3 h-3 mr-1" />
                        {assessment.client_email || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAssessment(assessment);
                        setShowProposal(true);
                      }}
                      className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.company}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.clientName}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.industry}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.submitted}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{assessment.company_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{assessment.company_size || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{assessment.client_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{assessment.client_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.industry || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assessment.proposal ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t.hasProposal}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {t.noProposal}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              setShowProposal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 flex items-center px-3 py-1.5 rounded hover:bg-purple-50 transition"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t.viewDetails}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;