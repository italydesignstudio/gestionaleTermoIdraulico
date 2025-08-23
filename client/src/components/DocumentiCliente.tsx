import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Table, Badge, InputGroup, Alert } from 'react-bootstrap';
import { FileText, Upload, Download, Trash2, Search, Filter, Plus, X } from 'lucide-react';
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

    // Verifica dimensione file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Il file è troppo grande. Dimensione massima: 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      await documentiService.uploadDocumento(clienteId, {
        ...formData,
        file: selectedFile
      });
      
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
      <div className="d-flex justify-content-center align-items-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FileText size={20} className="me-2 text-primary" />
          <h5 className="mb-0">Documenti di {nomeCliente}</h5>
        </div>
        <Button
          variant={showUploadForm ? "outline-secondary" : "primary"}
          size="sm"
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="d-flex align-items-center"
        >
          {showUploadForm ? <X size={16} className="me-1" /> : <Plus size={16} className="me-1" />}
          {showUploadForm ? 'Annulla' : 'Carica Documento'}
        </Button>
      </Card.Header>

      <Card.Body>
        {/* Form di upload */}
        {showUploadForm && (
          <Card className="mb-4 border-primary">
            <Card.Body className="bg-light">
              <Form onSubmit={handleUpload}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo Documento *</Form.Label>
                      <Form.Select
                        value={formData.tipoDocumento}
                        onChange={(e) => setFormData({...formData, tipoDocumento: e.target.value as TipoDocumento})}
                        required
                      >
                        {tipiDocumento.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Titolo *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.titolo}
                        onChange={(e) => setFormData({...formData, titolo: e.target.value})}
                        placeholder="Inserisci il titolo del documento"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Descrizione</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.descrizione}
                    onChange={(e) => setFormData({...formData, descrizione: e.target.value})}
                    placeholder="Descrizione opzionale"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>File *</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                    required
                  />
                  {selectedFile && (
                    <Form.Text className="text-muted">
                      File selezionato: {selectedFile.name} ({documentiService.formatFileSize(selectedFile.size)})
                    </Form.Text>
                  )}
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    disabled={uploading || !selectedFile}
                    className="d-flex align-items-center"
                  >
                    {uploading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Caricamento...</span>
                        </div>
                        Caricamento...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="me-1" />
                        Carica Documento
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => {
                      setShowUploadForm(false);
                      setSelectedFile(null);
                      setFormData({
                        tipoDocumento: 'Altro',
                        titolo: '',
                        descrizione: ''
                      });
                    }}
                  >
                    Annulla
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {/* Filtri */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Cerca documenti</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Cerca per titolo, descrizione o nome file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Filtra per tipo</Form.Label>
              <Form.Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoDocumento | 'Tutti')}
              >
                <option value="Tutti">Tutti i tipi</option>
                {tipiDocumento.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Lista documenti */}
        {documentiFiltered.length === 0 ? (
          <Alert variant="info" className="text-center">
            <FileText size={48} className="mb-3 opacity-50" />
            <h6>Nessun documento trovato</h6>
            <p className="mb-0">Non ci sono documenti per questo cliente o nessun documento corrisponde ai filtri selezionati.</p>
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table hover>
              <thead className="table-dark">
                <tr>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Data Caricamento</th>
                  <th>Dimensione</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {documentiFiltered.map((documento) => (
                  <tr key={documento.documentoId}>
                    <td>
                      <div>
                        <strong>{documento.titolo}</strong>
                        <br />
                        <small className="text-muted">{documento.nomeFile}</small>
                        {documento.descrizione && (
                          <>
                            <br />
                            <small className="text-muted">{documento.descrizione}</small>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">{documento.tipoDocumento}</Badge>
                    </td>
                    <td className="small text-muted">
                      {new Date(documento.dataCreazione).toLocaleDateString('it-IT')}
                    </td>
                    <td className="small text-muted">
                      {documento.dimensioneFile ? 
                        `${(documento.dimensioneFile / 1024 / 1024).toFixed(2)} MB` : 
                        'N/A'
                      }
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleDownload(documento)}
                          title="Scarica documento"
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(documento.documentoId)}
                          title="Elimina documento"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DocumentiCliente;
