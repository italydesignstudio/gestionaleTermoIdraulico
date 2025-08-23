import React, { useState, useEffect } from 'react';
import { DocumentoCliente, TipoDocumento, DocumentoFormData } from '../types';
import { documentiService } from '../services/documentiService';
import { toast } from 'react-toastify';

interface DocumentiClienteProps {
  clienteId: number;
  nomeCliente: string;
}

const DocumentiCliente: React.FC<DocumentiClienteProps> = ({ clienteId, nomeCliente }) => {
  const [documenti, setDocumenti] = useState<DocumentoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Omit<DocumentoFormData, 'file'>>({
    tipoDocumento: 'Altro',
    titolo: '',
    descrizione: ''
  });
  const [filtroTipo, setFiltroTipo] = useState<TipoDocumento | 'Tutti'>('Tutti');
  const [searchTerm, setSearchTerm] = useState('');

  const tipiDocumento: TipoDocumento[] = [
    'Fattura', 'Scontrino', 'Libretto', 'Preventivo', 
    'Contratto', 'Certificazione', 'Garanzia', 'Altro'
  ];

  useEffect(() => {
    loadDocumenti();
  }, [clienteId]);

  const loadDocumenti = async () => {
    try {
      setLoading(true);
      const data = await documentiService.getDocumentiCliente(clienteId);
      setDocumenti(data);
    } catch (error) {
      console.error('Errore nel caricamento documenti:', error);
      toast.error('Errore nel caricamento dei documenti');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!documentiService.isFileTypeAllowed(file)) {
      toast.error('Tipo di file non supportato');
      return;
    }

    if (!documentiService.isFileSizeAllowed(file)) {
      toast.error('File troppo grande (max 10MB)');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.titolo.trim()) {
      toast.error('Seleziona un file e inserisci un titolo');
      return;
    }

    try {
      setUploading(true);
      const uploadData: DocumentoFormData = {
        ...formData,
        file: selectedFile
      };
      
      await documentiService.uploadDocumento(clienteId, uploadData);
      toast.success('Documento caricato con successo');
      
      // Reset form
      setFormData({
        tipoDocumento: 'Altro',
        titolo: '',
        descrizione: ''
      });
      setSelectedFile(null);
      setShowUploadForm(false);
      
      // Ricarica lista
      loadDocumenti();
    } catch (error) {
      console.error('Errore upload:', error);
      toast.error('Errore nel caricamento del documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documento: DocumentoCliente) => {
    try {
      const blob = await documentiService.downloadDocumento(documento.documentoId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documento.nomeFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Errore download:', error);
      toast.error('Errore nel download del documento');
    }
  };

  const handleDelete = async (documentoId: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo documento?')) return;

    try {
      await documentiService.deleteDocumento(documentoId);
      toast.success('Documento eliminato');
      loadDocumenti();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast.error('Errore nell\'eliminazione del documento');
    }
  };

  const documentiFiltered = documenti.filter(doc => {
    const matchesTipo = filtroTipo === 'Tutti' || doc.tipoDocumento === filtroTipo;
    const matchesSearch = searchTerm === '' || 
      doc.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descrizione?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.nomeFile.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTipo && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          📁 Documenti di {nomeCliente}
        </h3>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showUploadForm ? 'Annulla' : '+ Carica Documento'}
        </button>
      </div>

      {/* Form di upload */}
      {showUploadForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Documento *
                </label>
                <select
                  value={formData.tipoDocumento}
                  onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value as TipoDocumento})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {tipiDocumento.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => setFormData({...formData, titolo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Inserisci il titolo del documento"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={formData.descrizione}
                onChange={(e) => setFormData({...formData, descrizione: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Descrizione opzionale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File *
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                required
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  File selezionato: {selectedFile.name} ({documentiService.formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {uploading ? 'Caricamento...' : 'Carica Documento'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setFormData({
                    tipoDocumento: 'Altro',
                    titolo: '',
                    descrizione: ''
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cerca documenti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoDocumento | 'Tutti')}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tutti">Tutti i tipi</option>
            {tipiDocumento.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista documenti */}
      {documentiFiltered.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {documenti.length === 0 
            ? 'Nessun documento caricato per questo cliente'
            : 'Nessun documento corrisponde ai filtri selezionati'
          }
        </div>
      ) : (
        <div className="space-y-3">
          {documentiFiltered.map((documento) => (
            <div key={documento.documentoId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {documento.tipoDocumento}
                    </span>
                    <h4 className="font-medium text-gray-900">{documento.titolo}</h4>
                  </div>
                  
                  {documento.descrizione && (
                    <p className="text-sm text-gray-600 mb-2">{documento.descrizione}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📄 {documento.nomeFile}</span>
                    <span>📊 {documentiService.formatFileSize(documento.dimensioneFile)}</span>
                    <span>📅 {new Date(documento.dataCreazione).toLocaleDateString('it-IT')}</span>
                    <span>👤 {documento.nomeUtenteCreazione} {documento.cognomeUtenteCreazione}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDownload(documento)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    title="Scarica documento"
                  >
                    ⬇️ Scarica
                  </button>
                  <button
                    onClick={() => handleDelete(documento.documentoId)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    title="Elimina documento"
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentiCliente;
