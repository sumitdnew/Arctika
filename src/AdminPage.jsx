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
  ArrowLeft
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
      title: "Admin Dashboard - Arctika AI Onboarding",
      subtitle: "Manage Assessment Submissions",
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
      exportAll: "Export All Data",
      backToForm: "Back to Form"
    },
    es: {
      title: "Panel de Administración - Arctika AI Onboarding",
      subtitle: "Gestionar Envíos de Evaluaciones",
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
      noAssessments: "No se encontraron evaluaciones que coincidan con tus criterios",
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
      exportAll: "Exportar Todos los Datos",
      backToForm: "Volver al Formulario"
    }
  };

  const t = translations[language];

  // Fetch assessments from Supabase
  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transformation_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched assessments:', data);
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

  // Generate proposal for an assessment
  const generateProposalForAssessment = async (assessment) => {
    try {
      setGeneratingProposal(true);
      
      // Parse the assessment data - use existing structure
      const formData = typeof assessment.responses === 'string' ? JSON.parse(assessment.responses) : assessment.responses;
      
      // Create company context from existing data
      const companyContext = {
        companyName: assessment.company_name,
        industry: assessment.industry,
        companySize: assessment.company_size
      };
      
      // Define sections based on the form structure
      const sections = [
        { title: language === 'es' ? 'Visión General del Negocio' : 'Business Overview', questions: [] },
        { title: language === 'es' ? 'Procesos Actuales' : 'Current Processes', questions: [] },
        { title: language === 'es' ? 'Infraestructura de Datos' : 'Data Infrastructure', questions: [] },
        { title: language === 'es' ? 'Preparación para IA' : 'AI Readiness', questions: [] },
        { title: language === 'es' ? 'Estrategia' : 'Strategy', questions: [] },
        { title: language === 'es' ? 'Desafíos' : 'Challenges', questions: [] },
        { title: language === 'es' ? 'Visión Futura' : 'Future Vision', questions: [] }
      ];

      // Generate proposal
      const proposal = await generateTransformationProposal(companyContext, formData, sections, language);
      
      // Update the assessment with the new proposal
      const { error } = await supabase
        .from('transformation_assessments')
        .update({ 
          proposal: proposal,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment.id);

      if (error) throw error;

      // Update local state
      setAssessments(prev => prev.map(a => 
        a.id === assessment.id 
          ? { ...a, proposal: proposal }
          : a
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

  // Download proposal as DOC
  const downloadProposal = (assessment) => {
    if (!assessment.proposal) return;
    
    // Convert markdown to HTML for better DOC formatting
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Transformation Proposal - ${assessment.company_context ? JSON.parse(assessment.company_context).companyName : 'Company'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
            h2 { color: #6b21a8; margin-top: 30px; }
            h3 { color: #8b5cf6; margin-top: 20px; }
            .header { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .company-info { display: flex; gap: 20px; flex-wrap: wrap; }
            .info-item { flex: 1; min-width: 200px; }
            .info-label { font-weight: bold; color: #374151; }
            .info-value { color: #6b7280; margin-top: 5px; }
            ul, ol { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
            .proposal-content { margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Digital Transformation Proposal</h1>
            <div class="company-info">
              <div class="info-item">
                <div class="info-label">Company:</div>
                <div class="info-value">${assessment.company_name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Industry:</div>
                <div class="info-value">${assessment.industry || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Company Size:</div>
                <div class="info-value">${assessment.company_size || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Client:</div>
                <div class="info-value">${assessment.client_name} (${assessment.client_email})</div>
              </div>
              <div class="info-item">
                <div class="info-label">Generated:</div>
                <div class="info-value">${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          
          <div class="proposal-content">
            ${assessment.proposal.replace(/\n/g, '<br>')}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.company_name || 'Company'}-Transformation-Proposal-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export all data as CSV
  const exportAllData = () => {
    try {
      const csvData = [];
      csvData.push([
        'ID', 'Company Name', 'Industry', 'Company Size', 'Client Name', 'Client Email',
        'Submitted Date', 'Has Proposal', 'Form Data', 'Proposal'
      ]);

      assessments.forEach(assessment => {
        csvData.push([
          assessment.id,
          assessment.company_name || '',
          assessment.industry || '',
          assessment.company_size || '',
          assessment.client_name || '',
          assessment.client_email || '',
          new Date(assessment.created_at).toLocaleDateString(),
          assessment.proposal ? 'Yes' : 'No',
          typeof assessment.responses === 'string' ? assessment.responses : JSON.stringify(assessment.responses) || '',
          assessment.proposal || ''
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

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    const companyName = assessment.company_name || '';
    const industry = assessment.industry || '';
    const clientName = assessment.client_name || '';
    const clientEmail = assessment.client_email || '';
    
    const matchesSearch = searchTerm === '' || 
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = filterIndustry === '' || industry === filterIndustry;
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'hasProposal' && assessment.proposal) ||
      (filterStatus === 'noProposal' && !assessment.proposal);
    
    return matchesSearch && matchesIndustry && matchesStatus;
  });

  // Get unique industries for filter
  const industries = [...new Set(assessments.map(a => a.industry).filter(Boolean))];

  if (selectedAssessment && showProposal) {
    const formData = selectedAssessment.responses ? 
      (typeof selectedAssessment.responses === 'string' ? JSON.parse(selectedAssessment.responses) : selectedAssessment.responses) : 
      {};
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <img src="/Images/logo.png" alt="Arctika Logo" className="w-12 h-12 mr-4" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
                  <p className="text-sm text-gray-600">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
                <button
                  onClick={() => { setSelectedAssessment(null); setShowProposal(false); }}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.backToList}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Details */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Company & Client Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  {t.companyInfo}
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.company}:</span>
                    <p className="text-gray-900">{selectedAssessment.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.industry}:</span>
                    <p className="text-gray-900">{selectedAssessment.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.size}:</span>
                    <p className="text-gray-900">{selectedAssessment.company_size || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  {t.clientInfo}
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.clientName}:</span>
                    <p className="text-gray-900">{selectedAssessment.client_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.email}:</span>
                    <p className="text-gray-900">{selectedAssessment.client_email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.language}:</span>
                    <p className="text-gray-900">{selectedAssessment.language || 'en'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.submitted}:</span>
                    <p className="text-gray-900">{new Date(selectedAssessment.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  {t.actions}
                </h2>
                <div className="space-y-3">
                  {!selectedAssessment.proposal ? (
                    <button
                      onClick={() => generateProposalForAssessment(selectedAssessment)}
                      disabled={generatingProposal}
                      className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${generatingProposal ? 'animate-spin' : ''}`} />
                      {generatingProposal ? t.generatingProposal : t.generateProposal}
                    </button>
                  ) : (
                    <button
                      onClick={() => generateProposalForAssessment(selectedAssessment)}
                      disabled={generatingProposal}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${generatingProposal ? 'animate-spin' : ''}`} />
                      {generatingProposal ? t.generatingProposal : t.regenerateProposal}
                    </button>
                  )}
                  
                  {selectedAssessment.proposal && (
                    <button
                      onClick={() => downloadProposal(selectedAssessment)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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
              <div className="bg-white rounded-lg shadow p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3" />
                  {t.proposal}
                </h2>
                
                {selectedAssessment.proposal ? (
                  <div className="prose prose-purple max-w-none">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>{t.company}:</strong> {selectedAssessment.company_name} | <strong>{t.industry}:</strong> {selectedAssessment.industry} | <strong>{t.size}:</strong> {selectedAssessment.company_size}
                      </p>
                      <p className="text-xs text-gray-500">
                        Generated: {new Date().toLocaleDateString()} | AI-Powered Analysis
                      </p>
                    </div>
                    
                    <div className="text-gray-800 leading-relaxed space-y-4">
                      {selectedAssessment.proposal.split('\n').map((line, idx) => {
                        if (line.startsWith('### ')) {
                          return <h3 key={idx} className="text-xl font-bold text-purple-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={idx} className="text-2xl font-bold text-purple-900 mt-8 mb-4 pb-2 border-b-2 border-purple-200">{line.replace('## ', '')}</h2>;
                        }
                        if (line.startsWith('# ')) {
                          return <h1 key={idx} className="text-3xl font-bold text-purple-900 mt-8 mb-4">{line.replace('# ', '')}</h1>;
                        }
                        
                        const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
                        
                        if (line.trim() === '') {
                          return <br key={idx} />;
                        }
                        
                        return <p key={idx} className="text-gray-700" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposal Generated</h3>
                    <p className="text-gray-600 mb-6">Generate a proposal for this assessment to view it here.</p>
                    <button
                      onClick={() => generateProposalForAssessment(selectedAssessment)}
                      disabled={generatingProposal}
                      className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition mx-auto"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${generatingProposal ? 'animate-spin' : ''}`} />
                      {generatingProposal ? t.generatingProposal : t.generateProposal}
                    </button>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/Images/logo.png" alt="Arctika Logo" className="w-12 h-12 mr-4" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-sm text-gray-600">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToForm}
              </button>
              <button
                onClick={fetchAssessments}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.refresh}
              </button>
              <button
                onClick={exportAllData}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.exportAll}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{assessments.length}</h2>
                <p className="text-gray-600">{t.totalSubmissions}</p>
              </div>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {assessments.filter(a => a.proposal).length}
                  </div>
                  <div className="text-sm text-gray-600">{t.hasProposal}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {assessments.filter(a => !a.proposal).length}
                  </div>
                  <div className="text-sm text-gray-600">{t.noProposal}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.searchPlaceholder}</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.filterIndustry}</label>
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t.allIndustries}</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.filterStatus}</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t.allStatuses}</option>
                <option value="hasProposal">{t.hasProposal}</option>
                <option value="noProposal">{t.noProposal}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {/* Assessments List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t.loading}</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noAssessments}</h3>
              <p className="text-gray-600">{t.noData}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.company}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.clientName}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.industry}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.language}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.submitted}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.status}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssessments.map((assessment) => {
                    return (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assessment.company_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assessment.company_size || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assessment.client_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assessment.client_email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.industry || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Globe className="w-3 h-3 mr-1" />
                            {assessment.language || 'en'}
                          </span>
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
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedAssessment(assessment);
                                setShowProposal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900 flex items-center px-2 py-1 rounded hover:bg-purple-50 transition"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {t.viewDetails}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
