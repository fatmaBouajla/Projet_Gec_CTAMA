import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ajoutercourrier.css';

const CreerCourrier = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    expediteur: '',
    objet: '',
    type: 'entrant',
    service: '',
    date: new Date().toISOString().split('T')[0],
    urgence: false,
    commentaire: '',
    pieceJointe: null
  });
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
  });

  api.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token.includes('|') ? token.split('|')[1] : token}`;
    }
    return config;
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data);
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de chargement des services');
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Ajout pour le défilement automatique
  useEffect(() => {
    if (successMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [successMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError('Format de fichier non supporté (PDF, JPG, PNG uniquement)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Fichier trop volumineux (max 5MB)');
        return;
      }
      setFormData(prev => ({ ...prev, pieceJointe: file }));
      setError(null);
      if (file.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = (event) => setFilePreview(event.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.objet) {
      setError("L'objet est obligatoire même pour un brouillon");
      return;
    }

    try {
      setSaving(true);
      const formPayload = new FormData();
      
      formPayload.append('objet', formData.objet);
      formPayload.append('type', formData.type);
      formPayload.append('date_reception', formData.date);
      if (formData.service) formPayload.append('service_id', formData.service);
      formPayload.append('urgent', formData.urgence ? '1' : '0');
      formPayload.append('is_draft', '1');
      
      if (formData.expediteur) formPayload.append('expediteur_externe', formData.expediteur);
      if (formData.commentaire) formPayload.append('commentaire', formData.commentaire);
      if (formData.pieceJointe) formPayload.append('fichier', formData.pieceJointe);

      await api.post('/courriers', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setTimeout(() => {
        navigate('/comptegestionnaire');
      }, 3000); 
      setError(null);
      setSuccessMessage("Brouillon enregistré avec succès ");

    } catch (error) {
      console.error('Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'enregistrement du brouillon');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.objet || !formData.service || !formData.pieceJointe) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    try {
      setSaving(true);
      const formPayload = new FormData();
      
      formPayload.append('objet', formData.objet);
      formPayload.append('type', formData.type);
      formPayload.append('date_reception', formData.date);
      formPayload.append('service_id', formData.service);
      formPayload.append('urgent', formData.urgence ? '1' : '0');
      formPayload.append('is_draft', '0');
      
      if (formData.expediteur) formPayload.append('expediteur_externe', formData.expediteur);
      if (formData.commentaire) formPayload.append('commentaire', formData.commentaire);
      if (formData.pieceJointe) formPayload.append('fichier', formData.pieceJointe);

      const response = await api.post('/courriers', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/envoyercourrier', {
        state: { 
          courrierId: response.data.data.id,
          objet: formData.objet,
          serviceId: formData.service,
          serviceName: services.find(s => s.id == formData.service)?.nom
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors de la création du courrier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="creer-courrier-page">
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/images/logo.png" alt="Logo" />
            <div className="logo-text">
              <div className="main">GEC_CTAMA</div>
              <div className="sub">Gestionnaire des courriers</div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-container">
        <div className="creation-form">
          <h1 className="form-title">Créer un <span className="hi">courrier</span></h1>
          
          {error && (
            <div className="alert alert-error">
              {error}
              <button onClick={() => setError(null)} className="close-btn">
                &times;
              </button>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="expediteur">Expéditeur</label>
                  <input
                    type="text"
                    id="expediteur"
                    name="expediteur"
                    value={formData.expediteur}
                    onChange={handleChange}
                    placeholder="Nom de l'expéditeur externe"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="entrant">Entrant</option>
                    <option value="sortant">Sortant</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="objet">Objet *</label>
                  <input
                    type="text"
                    id="objet"
                    name="objet"
                    value={formData.objet}
                    onChange={handleChange}
                    required
                    placeholder="Objet du courrier"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="service">Service destinataire *</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Sélectionnez un service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.nom}
                      </option>
                    ))}
                  </select>
                  {loading && <div className="loading-text">Chargement des services...</div>}
                </div>
              </div>

              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Urgence *</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="urgence"
                        checked={!formData.urgence}
                        onChange={() => setFormData({ ...formData, urgence: false })}
                      />
                      <span>Normal</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="urgence"
                        checked={formData.urgence}
                        onChange={() => setFormData({ ...formData, urgence: true })}
                      />
                      <span>Urgent</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="piece-jointe">Pièce jointe *</label>
                  <div className="file-upload">
                    <label htmlFor="piece-jointe" className="file-upload-btn">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <p>{formData.pieceJointe ? formData.pieceJointe.name : "Choisir un fichier"}</p>
                      <p className="file-info">
                        {formData.pieceJointe 
                          ? `Taille: ${(formData.pieceJointe.size / 1024 / 1024).toFixed(2)} MB` 
                          : 'Formats: PDF, JPG, PNG (Max. 5MB)'}
                      </p>
                    </label>
                    <input
                      type="file"
                      id="piece-jointe"
                      name="piece-jointe"
                      className="file-upload-input"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </div>
                  {filePreview && (
                    <div className="file-preview-container">
                      <img src={filePreview} alt="Aperçu" className="file-preview" />
                      <button 
                        type="button" 
                        className="remove-file-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, pieceJointe: null }));
                          setFilePreview(null);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="commentaire">Commentaire</label>
              <textarea
                id="commentaire"
                name="commentaire"
                value={formData.commentaire}
                onChange={handleChange}
                rows="4"
                placeholder="Ajoutez un commentaire si nécessaire"
              ></textarea>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/comptegestionnaire')}
                disabled={saving}
              >
                Annuler
              </button>
              
              <button
                type="button"
                className="btn btn-draft"
                onClick={handleSaveDraft}
                disabled={saving || !formData.objet}
              >
                {saving ? (
                  <>
                    <span className="spinner-btn"></span>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer Brouillon'
                )}
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !formData.objet || !formData.service || !formData.pieceJointe}
              >
                {saving ? (
                  <>
                    <span className="spinner-btn"></span>
                    Transfert en cours...
                  </>
                ) : (
                  'Transférer le courrier'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreerCourrier;