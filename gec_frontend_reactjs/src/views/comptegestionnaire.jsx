import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './comptegestionnaire.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileSignature, faPaperPlane, faFileImport, faCog,
  faCheck, faTimes, faSearch, faAngleLeft, faAngleRight, 
  faDownload, faFile, faFileAlt
} from '@fortawesome/free-solid-svg-icons';

const CompteGestionnaire = () => {
  const [courriers, setCourriers] = useState([]);
  const [user, setUser] = useState({ name: '', email: '', id: null });
  const [currentCourrier, setCurrentCourrier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user.id) {
      fetchCourriers();
    }
  }, [user.id]);

  const fetchUserData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token d\'authentification manquant');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser({
          name: userData.name,
          email: userData.email,
          id: userData.id
        });
      } else {
        throw new Error('Échec de la récupération des données utilisateur');
      }
    } catch (err) {
      console.error('Erreur fetchUserData:', err);
      setError('Erreur lors de la récupération des données utilisateur');
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    }
  };

  const fetchCourriers = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token d\'authentification manquant');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/transferts/mes-courriers-signes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourriers(data.map(c => ({
          id: c.id,
          transfert_id: c.transfert_id,
          service_destinataire: c.service_destinataire,
          destinataire: c.destinataire,
          objet: c.objet,
          date: c.date_envoi,
          signature: c.signature, // Maintenant géré comme texte
          statut: c.statut,
          fichier: c.fichier,
          can_mark_treated: c.can_mark_treated
        })));
      } else {
        throw new Error('Échec de la récupération des courriers signés');
      }
    } catch (error) {
      console.error('Erreur fetchCourriers:', error);
      setError('Erreur lors de la récupération des courriers signés');
    } finally {
      setLoading(false);
    }
  };

  const handleShowCourrierDetail = (courrier) => {
    setCurrentCourrier(courrier);
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action, transfertId) => {
    setActionToConfirm({ action, transfertId });
    setIsConfirmModalOpen(true);
    setError(null);
  };

  const handleMarquerTraite = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Vous devez être connecté');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/transferts/${actionToConfirm.transfertId}/marquer-traite`, 
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors du traitement');
      }

      setCourriers(courriers.map(c => 
        c.transfert_id === actionToConfirm.transfertId 
          ? { ...c, statut: 'traite' } 
          : c
      ));

      setIsConfirmModalOpen(false);
      
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await fetch('http://localhost:8000/api/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error('Erreur logout:', err);
        } finally {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      }
    }
  };

  const handleDownload = (filePath) => {
    const link = document.createElement('a');
    link.href = `http://localhost:8000/storage/${filePath}`;
    link.setAttribute('download', filePath.split('/').pop());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCourriers = courriers.filter(c => 
    c.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.destinataire.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.service_destinataire.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="compte-gestionnaire">
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/images/logo.png" alt="Logo GEC_CTAMA" />
            <div className="logo-text">
              <div className="main">GEC_CTAMA</div>
              <div className="sub">Gestionnaire des courriers</div>
            </div>
          </div>
          <div className="user-menu">
            <div className="user-info">
              <div className="user-name">{user.name || 'Gestionnaire'}</div>
              <div className="user-email">{user.email || 'gestionnaire@ctama.com'}</div>
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
              <a href="/comptegestionnaire" className="active">
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
              <a href="/brouillongest">
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
            <h1 className="content-title">Mes courriers <span>signés</span></h1>
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Rechercher par destinataire, service ou objet..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <button><FontAwesomeIcon icon={faSearch} /></button>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Chargement de vos courriers signés...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredCourriers.length === 0 ? (
            <div className="no-results">Aucun courrier signé trouvé pour votre compte</div>
          ) : (
            <table className="courriers-table">
              <thead>
                <tr>
                  <th>Service destinataire</th>
                  <th>Destinataire</th>
                  <th>Objet</th>
                  <th>Date envoi</th>
                  <th>Signature</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourriers.map(courrier => (
                  <tr key={courrier.id} onClick={() => handleShowCourrierDetail(courrier)}>
                    <td>{courrier.service_destinataire}</td>
                    <td>{courrier.destinataire}</td>
                    <td>{courrier.objet}</td>
                    <td>{new Date(courrier.date).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {courrier.signature ? (
                        <span className="signature-text">{courrier.signature}</span>
                      ) : (
                        <span className="no-signature">Non signé</span>
                      )}
                    </td>
                    <td className="actions">
                      {courrier.can_mark_treated && courrier.statut !== 'traite' && (
                        <button 
                          className="btn-traite"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmAction('traite', courrier.transfert_id);
                          }}
                        >
                          <FontAwesomeIcon icon={faCheck} /> Traité
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pagination">
            <button><FontAwesomeIcon icon={faAngleLeft} /></button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button><FontAwesomeIcon icon={faAngleRight} /></button>
          </div>
        </main>
      </div>

      {isModalOpen && currentCourrier && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setIsModalOpen(false)}>×</span>
            <h2>Détails du courrier</h2>
            
            <div className="modal-section">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Service destinataire:</span>
                  <span>{currentCourrier.service_destinataire}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Destinataire:</span>
                  <span>{currentCourrier.destinataire}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date envoi:</span>
                  <span>{new Date(currentCourrier.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Objet:</span>
                  <span>{currentCourrier.objet}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Statut:</span>
                  <span>{currentCourrier.statut}</span>
                </div>
              </div>
              
              {currentCourrier.signature && (
                <div className="signature-section">
                  <p className="signature-label">Signature:</p>
                  <p className="signature-text-large">{currentCourrier.signature}</p>
                </div>
              )}
            </div>

            

            {currentCourrier.can_mark_treated && currentCourrier.statut !== 'traite' && (
              <div className="modal-actions">
                <button 
                  className="btn-traite"
                  onClick={() => handleConfirmAction('traite', currentCourrier.transfert_id)}
                >
                  <FontAwesomeIcon icon={faCheck} /> Marquer comme traité
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConfirmModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Confirmer l'action</h3>
            <p>Voulez-vous vraiment marquer ce courrier comme traité ?</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="modal-buttons">
              <button 
                className="btn-confirm"
                onClick={handleMarquerTraite}
                disabled={actionLoading}
              >
                {actionLoading ? 'Traitement...' : (
                  <>
                    <FontAwesomeIcon icon={faCheck} /> Confirmer
                  </>
                )}
              </button>
              <button 
                className="btn-cancel"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setError(null);
                }}
                disabled={actionLoading}
              >
                <FontAwesomeIcon icon={faTimes} /> Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompteGestionnaire;