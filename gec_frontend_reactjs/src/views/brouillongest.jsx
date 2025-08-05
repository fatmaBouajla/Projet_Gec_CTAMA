import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileSignature, faPaperPlane, faFileImport, faCog,
  faSearch, faFileAlt, faEdit, faTrash, faSyncAlt, faTimes,
  faSave, faBan, faCloudUploadAlt, faFilePdf, faFileImage,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import './comptegestionnaire.css';

const BrouillonGest = () => {
  const [brouillons, setBrouillons] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState({ 
    name: '', 
    email: '', 
    id: null 
  });
  
  const [selectedBrouillon, setSelectedBrouillon] = useState({
    id: null,
    service: { id: null, nom: '' },
    objet: '',
    type: 'entrant',
    date_reception: '',
    urgent: false,
    commentaire: '',
    fichier: null,
    created_at: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    objet: '',
    service_id: '',
    type: 'entrant',
    date_reception: '',
    urgent: false,
    commentaire: '',
    fichier: null
  });
  const [filePreview, setFilePreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      await fetchUserData();
      await fetchServices();
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user.id) {
      fetchBrouillons(user.id);
    }
  }, [user.id]);

  const fetchUserData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token d\'authentification manquant');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const userData = await response.json();
      setUser({ 
        name: userData.name || '', 
        email: userData.email || '',
        id: userData.id || null
      });
    } catch (err) {
      console.error("Erreur fetchUserData:", err);
      setError(`Erreur lors de la récupération des données utilisateur: ${err.message}`);
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:8000/api/services', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur fetchServices:", error);
      setServices([]);
    }
  };

  const fetchBrouillons = async (userId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token d\'authentification manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/api/brouillons/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      setBrouillons(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur fetchBrouillons:", error);
      setError(`Erreur lors du chargement des brouillons: ${error.message}`);
      setBrouillons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const showBrouillonDetail = (brouillon) => {
    if (!brouillon) return;
    
    setSelectedBrouillon({
      id: brouillon.id || null,
      service: {
        id: brouillon.service_id || null,
        nom: brouillon.service?.nom || ''
      },
      objet: brouillon.objet || '',
      type: brouillon.type || 'entrant',
      date_reception: brouillon.date_reception || '',
      urgent: Boolean(brouillon.urgent),
      commentaire: brouillon.commentaire || '',
      fichier: brouillon.fichier || null,
      created_at: brouillon.created_at || ''
    });

    setEditFormData({
      objet: brouillon.objet || '',
      service_id: brouillon.service_id || '',
      type: brouillon.type || 'entrant',
      date_reception: brouillon.date_reception || '',
      urgent: Boolean(brouillon.urgent),
      commentaire: brouillon.commentaire || '',
      fichier: null
    });

    setFilePreview(brouillon.fichier ? `http://localhost:8000/storage/${brouillon.fichier}` : null);
    setShowModal(true);
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      setEditFormData(prev => ({ ...prev, fichier: file }));
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (event) => setFilePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBrouillon = async () => {
    if (!editFormData.objet || !editFormData.service_id) {
      setError('Les champs obligatoires doivent être remplis');
      return;
    }

    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    
    formData.append('_method', 'PUT');
    formData.append('objet', editFormData.objet);
    formData.append('service_id', editFormData.service_id);
    formData.append('type', editFormData.type);
    formData.append('date_reception', editFormData.date_reception);
    formData.append('urgent', editFormData.urgent);
    formData.append('commentaire', editFormData.commentaire);
    formData.append('is_draft', 'true');
    
    if (editFormData.fichier) {
      formData.append('fichier', editFormData.fichier);
    }

    try {
      const response = await fetch(`http://localhost:8000/api/courriers/${selectedBrouillon.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      const updatedBrouillon = await response.json();
      
      const updatedData = updatedBrouillon.data || updatedBrouillon;
      if (updatedData) {
        setBrouillons(brouillons.map(b => 
          b.id === selectedBrouillon.id ? {
            ...b,
            ...updatedData,
            service: updatedData.service || b.service
          } : b
        ));
        
        setSelectedBrouillon(prev => ({
          ...prev,
          ...updatedData,
          service: updatedData.service || prev.service
        }));
        
        setIsEditing(false);
        setSuccessMessage('Brouillon mis à jour avec succès');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la mise à jour: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const deleteBrouillon = async () => {
    if (!selectedBrouillon?.id || !window.confirm('Supprimer ce brouillon ?')) return;
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:8000/api/courriers/${selectedBrouillon.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setBrouillons(brouillons.filter(b => b.id !== selectedBrouillon.id));
        setShowModal(false);
        setSuccessMessage('Brouillon supprimé avec succès');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      setError('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const filteredBrouillons = brouillons.filter(b => {
    const searchLower = searchTerm.toLowerCase();
    const objet = b.objet?.toLowerCase() || '';
    const serviceNom = b.service?.nom?.toLowerCase() || '';
    return objet.includes(searchLower) || serviceNom.includes(searchLower);
  });

  return (
    <div className="compte-gestionnaire">
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/images/logo.png" alt="Logo" />
            <div className="logo-text">
              <div className="main">GEC_CTAMA</div>
              <div className="sub">Gestionnaire des courriers</div>
            </div>
          </div>
          <div className="user-menu">
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <h2 className="sidebar-title">Menu Gestionnaire</h2>
          <ul className="nav-menu">
            <li className="nav-item">
              <a href="/comptegestionnaire">
                <FontAwesomeIcon icon={faFileSignature} /> Courriers signés
              </a>
            </li>
            <li className="nav-item">
              <a href="/courrierenvoyegest">
                <FontAwesomeIcon icon={faPaperPlane} /> Courriers envoyés
              </a>
            </li>
            <li className="nav-item">
              <a href="/ajoutercourrier">
                <FontAwesomeIcon icon={faFileImport} /> Créer Courrier
              </a>
            </li>
            <li className="nav-item">
              <a href="/brouillongest" className="active">
                <FontAwesomeIcon icon={faFileAlt} /> Mes Brouillons
              </a>
            </li>
            <li className="nav-item">
              <a href="/parametres">
                <FontAwesomeIcon icon={faCog} /> Paramètres
              </a>
            </li>
          </ul>
        </aside>

        <main className="content">
          <div className="content-header">
            <h1 className="content-title">Mes <span>Brouillons</span></h1>
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Rechercher par objet ou service..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <button><FontAwesomeIcon icon={faSearch} /></button>
            </div>
          </div>

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
              <button onClick={() => setSuccessMessage(null)} className="close-btn">
                &times;
              </button>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <strong>Erreur :</strong> {error}
              <button onClick={() => setError(null)} className="close-btn">
                &times;
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-message">
              <FontAwesomeIcon icon={faSyncAlt} spin /> Chargement en cours...
            </div>
          ) : filteredBrouillons.length === 0 ? (
            <div className="no-results">
              {searchTerm ? (
                <p>Aucun résultat ne correspond à votre recherche</p>
              ) : (
                <p>Aucun brouillon disponible</p>
              )}
            </div>
          ) : (
            <table className="courriers-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Objet</th>
                  <th>Date création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrouillons.map(brouillon => (
                  <tr key={brouillon.id} onClick={() => showBrouillonDetail(brouillon)}>
                    <td>{brouillon.service?.nom || 'Non spécifié'}</td>
                    <td>{brouillon.objet || 'Sans objet'}</td>
                    <td>{brouillon.created_at ? new Date(brouillon.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}</td>
                    <td className="actions">
                      <button 
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          showBrouillonDetail(brouillon);
                          setIsEditing(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBrouillon(brouillon);
                          if (window.confirm('Supprimer ce brouillon ?')) {
                            deleteBrouillon();
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>

      <div className={`modal ${showModal && selectedBrouillon ? 'modal-active' : ''}`} onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <span className="close-btn" onClick={() => setShowModal(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </span>
          
          <h2>{isEditing ? 'Modifier le brouillon' : 'Détails du brouillon'}</h2>
          
          {selectedBrouillon && (
            <div className="modal-sections">
              {!isEditing ? (
                <>
                  <div className="modal-section">
                    <p><strong>Service:</strong> {selectedBrouillon.service?.nom || 'Non spécifié'}</p>
                    <p><strong>Objet:</strong> {selectedBrouillon.objet || 'Sans objet'}</p>
                    <p><strong>Type:</strong> {selectedBrouillon.type || 'Non spécifié'}</p>
                    <p><strong>Date:</strong> {selectedBrouillon.date_reception || 'Non spécifiée'}</p>
                    <p><strong>Urgent:</strong> {selectedBrouillon.urgent ? 'Oui' : 'Non'}</p>
                    <p><strong>Commentaire:</strong> {selectedBrouillon.commentaire || 'Aucun'}</p>
                  </div>
                  
                  <div className="modal-section">
                    <h3>Fichier joint</h3>
                    {selectedBrouillon.fichier ? (
                      <div className="file-download-container">
                        <a 
                          href={`http://localhost:8000/api/courriers/${selectedBrouillon.id}/telecharger`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-link"
                        >
                          <FontAwesomeIcon icon={faDownload} /> Télécharger le fichier
                        </a>
                        {selectedBrouillon.fichier.endsWith('.pdf') ? (
                          <span className="file-type"><FontAwesomeIcon icon={faFilePdf} /> PDF</span>
                        ) : (
                          <span className="file-type"><FontAwesomeIcon icon={faFileImage} /> Image</span>
                        )}
                      </div>
                    ) : (
                      <p>Aucun fichier joint</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Objet *</label>
                    <input
                      type="text"
                      name="objet"
                      value={editFormData.objet}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Service destinataire *</label>
                    <select
                      name="service_id"
                      value={editFormData.service_id}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="">Sélectionnez un service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      name="type"
                      value={editFormData.type}
                      onChange={handleEditChange}
                      required
                    >
                      <option value="entrant">Entrant</option>
                      <option value="sortant">Sortant</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      name="date_reception"
                      value={editFormData.date_reception}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="urgent"
                        checked={editFormData.urgent}
                        onChange={handleEditChange}
                      />
                      Courrier urgent
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Commentaire</label>
                    <textarea
                      name="commentaire"
                      value={editFormData.commentaire}
                      onChange={handleEditChange}
                      rows="4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pièce jointe</label>
                    <div className="file-upload-container">
                      <label className="file-upload-label">
                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                        <span>{editFormData.fichier ? editFormData.fichier.name : 'Choisir un fichier'}</span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="file-input"
                        />
                      </label>
                      {filePreview && (
                        <div className="file-preview">
                          {editFormData.fichier?.type?.includes('image') ? (
                            <img src={filePreview} alt="Aperçu" />
                          ) : (
                            <div className="file-info">
                              <FontAwesomeIcon icon={faFilePdf} />
                              <span>{editFormData.fichier?.name || 'Fichier joint'}</span>
                            </div>
                          )}
                          <button 
                            type="button" 
                            className="remove-file-btn"
                            onClick={() => {
                              setEditFormData(prev => ({ ...prev, fichier: null }));
                              setFilePreview(null);
                            }}
                          >
                            
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="file-hint">Formats acceptés: PDF, JPG, PNG (max. 5MB)</p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="modal-actions">
            {!isEditing ? (
              <>
                <button 
                  className="btn-edit"
                  onClick={() => setIsEditing(true)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button 
                  className="btn-delete"
                  onClick={deleteBrouillon}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  <FontAwesomeIcon icon={faBan} /> Annuler
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleUpdateBrouillon}
                  disabled={!editFormData.objet || !editFormData.service_id}
                >
                  <FontAwesomeIcon icon={faSave} /> Enregistrer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrouillonGest;