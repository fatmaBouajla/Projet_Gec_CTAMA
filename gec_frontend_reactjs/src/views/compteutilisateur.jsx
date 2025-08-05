  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import './compteutilisateur.css';
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
  import {
    faInbox, faPaperPlane, faCog, faSearch, faStar, faCheckCircle, 
    faTrash, faSignature, faAngleLeft, faAngleRight, faSort, 
    faFileImport, faDownload, faComment
  } from '@fortawesome/free-solid-svg-icons';

  const CompteUtilisateur = () => {
    const [courriers, setCourriers] = useState([]);
    const [user, setUser] = useState({ name: '', email: '', id: null });
    const [services, setServices] = useState([]);
    const [selectedCourrier, setSelectedCourrier] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signature, setSignature] = useState('');
    const [filters, setFilters] = useState({
      service: '',
      date: '',
      statut: '',
      search: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      fetchUserData();
      fetchServices();
    }, []);

    useEffect(() => {
      if (user.id) {
        fetchCourriersRecus();
      }
    }, [user.id]);

    const fetchUserData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Token manquant');
        return;
      }
      try {
        const response = await fetch('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser({
            name: userData.name || 'Utilisateur',
            email: userData.email || 'email@ctama.com',
            id: userData.id
          });
        } else {
          throw new Error('Échec récupération utilisateur');
        }
      } catch (err) {
        console.error('Erreur fetchUserData:', err);
        setError('Erreur récupération utilisateur');
      }
    };

    const fetchServices = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Token manquant');
        return;
      }
      try {
        const response = await fetch('http://localhost:8000/api/services', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          },
        });
        if (response.ok) {
          const data = await response.json();
          setServices(data || []);
        } else {
          throw new Error('Échec récupération services');
        }
      } catch (error) {
        console.error('Erreur services:', error);
        setError('Impossible charger services');
      }
    };

    const fetchCourriersRecus = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/transferts/courriers-recus', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            Accept: 'application/json'
          },
        });

        if (!response.ok) throw new Error('Erreur récupération courriers');

        const data = await response.json();
        
        setCourriers((data || []).map(item => ({
          id: item.id || '',
          transfert_id: item.transfert_id || '',
          service_expediteur: item.service_expediteur || 'Service inconnu',
          expediteur: item.expediteur || 'Expéditeur inconnu',
          destinataire: item.destinataire || 'Destinataire inconnu',
          objet: item.objet || 'Sans objet',
          date_reception: item.date_reception 
            ? new Date(item.date_reception).toLocaleDateString('fr-FR') 
            : 'Non spécifiée',
          statut: item.statut || 'inconnu',
          commentaire: item.commentaire || '',
          fichier: item.fichier || null,
          courrier_id: item.courrier_id || null
        })));

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleLogout = async () => {
      if (window.confirm('Déconnexion ?')) {
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

    const handleSearch = (e) => setFilters({ ...filters, search: e.target.value.trim().toLowerCase() });
    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    const showCourrierDetail = (courrier) => {
      if (!courrier) return;
      setSelectedCourrier(courrier);
      setShowModal(true);
      if (courrier.statut === 'transfere') {
        setShowSignatureModal(true);
      }
    };

    const confirmSignature = async () => {
      if (!selectedCourrier?.transfert_id || !signature) return;
      
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`http://localhost:8000/api/transferts/${selectedCourrier.transfert_id}/confirmer`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ signature })
        });
        
        if (response.ok) {
          const updatedCourrier = await response.json();
          setCourriers(courriers.map(c => 
            c.id === selectedCourrier.id ? { 
              ...c, 
              statut: updatedCourrier.statut || 'lu',
              date_accuse: updatedCourrier.date_accuse || new Date().toISOString(),
              signature: updatedCourrier.signature || signature
            } : c
          ));
          setShowSignatureModal(false);
          setSignature('');
        } else {
          throw new Error('Échec signature');
        }
      } catch (error) {
        setError('Erreur lors de la signature');
        console.error(error);
      }
    };

    const deleteCourrier = async () => {
      if (!selectedCourrier?.transfert_id || !window.confirm('Supprimer ce courrier ?')) return;
      
      const token = localStorage.getItem('authToken');
      try {
        await fetch(`http://localhost:8000/api/transferts/${selectedCourrier.transfert_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourriers(courriers.filter(c => c.id !== selectedCourrier.id));
        setShowModal(false);
      } catch (error) {
        setError('Erreur suppression');
        console.error(error);
      }
    };

    const filterCourriers = () => {
      return courriers.filter(courrier => {
        const courrierStatut = courrier.statut?.toLowerCase() || '';
        const filterStatut = filters.statut.toLowerCase();
        
        const serviceMatch = !filters.service || 
          (courrier.service_expediteur?.toLowerCase() || '').includes(filters.service.toLowerCase());
        const dateMatch = !filters.date || 
          (courrier.date_reception && new Date(courrier.date_reception).toISOString().split('T')[0] === filters.date);
        const statutMatch = !filters.statut || courrierStatut === filterStatut;
        const searchMatch = !filters.search || 
          (courrier.objet?.toLowerCase() || '').includes(filters.search.toLowerCase()) || 
          (courrier.service_expediteur?.toLowerCase() || '').includes(filters.search.toLowerCase());
        
        return serviceMatch && dateMatch && statutMatch && searchMatch;
      });
    };

    const sortTable = (columnIndex) => {
      const sorted = [...filterCourriers()].sort((a, b) => {
        const getValue = (item, index) => {
          switch(index) {
            case 0: return item.service_expediteur?.toLowerCase() || '';
            case 1: return item.expediteur?.toLowerCase() || '';
            case 2: return item.destinataire?.toLowerCase() || '';
            case 3: return item.objet?.toLowerCase() || '';
            case 4: return item.date_reception ? new Date(item.date_reception) : null;
            case 5: return item.statut?.toLowerCase() || '';
            default: return '';
          }
        };

        const aValue = getValue(a, columnIndex);
        const bValue = getValue(b, columnIndex);

        if (aValue === null || bValue === null) return 0;
        if (aValue > bValue) return 1;
        if (aValue < bValue) return -1;
        return 0;
      });
      setCourriers(sorted);
    };

    const mapStatut = (statut) => {
      if (!statut) return 'Inconnu';
      
      const statutLower = statut.toLowerCase();
      const statutMap = {
        'en_attente': 'En attente',
        'transfere': 'transfere',
        'lu': 'Lu', 
        'traite': 'Traité'
      };
      
      return statutMap[statutLower] || 'Inconnu';
    };

    return (
      <div className="compte-utilisateur">
        <header className="header">
          <div className="header-container">
            <div className="logo">
              <img src="/images/logo.png" alt="Logo" />
              <div className="logo-text">
                <div className="main">GEC_CTAMA</div>
                <div className="sub">Gestionnaire courriers</div>
              </div>
            </div>
            <div className="user-menu">
              <div className="user-info">
                <div className="user-name">{user.name || 'Utilisateur'}</div>
                <div className="user-email">{user.email || 'email@ctama.com'}</div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
            </div>
          </div>
        </header>

        <div className="main-container">
          <aside className="sidebar">
            <h2 className="sidebar-title">Menu</h2>
            <ul className="nav-menu">
              <li className="nav-item"><a href="/compteutilisateur" className="active"><FontAwesomeIcon icon={faInbox} /> Courriers reçus</a></li>
              <li className="nav-item"><a href="/parametres"><FontAwesomeIcon icon={faCog} /> Paramètres</a></li>
            </ul>
          </aside>

          <main className="content">
            <div className="content-header">
              <h1 className="content-title">Courriers <span>reçus</span></h1>
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  onChange={handleSearch}
                  value={filters.search}
                />
                <button onClick={handleSearch}><FontAwesomeIcon icon={faSearch} /></button>
              </div>
            </div>

            <div className="filters">
              <div className="filter-group">
                <label htmlFor="service">Service</label>
                <select id="service" name="service" onChange={handleFilterChange} value={filters.service}>
                  <option value="">Tous</option>
                  {services.map(service => (
                    <option key={service.id} value={service.nom}>{service.nom}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="date">Date réception</label>
                <input type="date" id="date" name="date" onChange={handleFilterChange} value={filters.date} />
              </div>
              <div className="filter-group">
                <label htmlFor="statut">Statut</label>
                <select id="statut" name="statut" onChange={handleFilterChange} value={filters.statut}>
                  <option value="">Tous</option>
                  <option value="transfere">transfere</option>
                  <option value="recu">Reçu</option>
                  <option value="traite">Traité</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-message">Chargement...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <table className="courriers-table">
                <thead>
                  <tr>
                    <th onClick={() => sortTable(0)}>Service expéditeur <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => sortTable(1)}>Expéditeur <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => sortTable(2)}>Destinataire <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => sortTable(3)}>Objet <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => sortTable(4)}>Date réception <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => sortTable(5)}>Statut <FontAwesomeIcon icon={faSort} /></th>
                  </tr>
                </thead>
                <tbody>
                  {filterCourriers().map(courrier => (
                    <tr key={courrier.id} onClick={() => showCourrierDetail(courrier)}>
                      <td>{courrier.service_expediteur}</td>
                      <td>{courrier.expediteur}</td>
                      <td>{courrier.destinataire}</td>
                      <td>{courrier.objet}</td>
                      <td>{courrier.date_reception}</td>
                      <td>
                        <span className={`statut-${(courrier.statut || '').toLowerCase().replace(' ', '_')}`}>
                          {mapStatut(courrier.statut)}
                        </span>
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

        <div id="courrierModal" className={`modal ${showModal ? 'modal-active' : ''}`} onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setShowModal(false)}>×</span>
            <div className="modal-section">
              <h3>Détails</h3>
              <p><strong>Service:</strong> <span>{selectedCourrier?.service_expediteur || 'Non spécifié'}</span></p>
              <p><strong>Expéditeur:</strong> <span>{selectedCourrier?.expediteur || 'Non spécifié'}</span></p>
              <p><strong>Destinataire:</strong> <span>{selectedCourrier?.destinataire || 'Non spécifié'}</span></p>
              <p><strong>Date réception:</strong> <span>{selectedCourrier?.date_reception || 'Non spécifiée'}</span></p>
              <p><strong>Statut:</strong>
                <span className={`statut-${(selectedCourrier?.statut || '').toLowerCase().replace(' ', '_')}`}>
                  {mapStatut(selectedCourrier?.statut)}
                </span>
              </p>
              <p><strong>Objet:</strong> <span>{selectedCourrier?.objet || 'Sans objet'}</span></p>
            </div>
            <div className="modal-section">
              <h3>Commentaire</h3>
              <div className="commentaire-courrier">
                {selectedCourrier?.commentaire || 'Aucun commentaire'}
              </div>
            </div>
            <div className="modal-section">
              <h3>Fichier joint</h3>
              {selectedCourrier?.fichier ? (
                <a 
                  href={`http://localhost:8000/api/courriers/${selectedCourrier.courrier_id}/telecharger`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="download-link"
                >
                  <FontAwesomeIcon icon={faDownload} /> Télécharger le fichier
                </a>
              ) : (
                <p>Aucun fichier joint</p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={deleteCourrier}><FontAwesomeIcon icon={faTrash} /> Supprimer</button>
            </div>
          </div>
        </div>

        {selectedCourrier?.statut === 'transfere' && (
          <div id="signatureModal" className={`modal ${showSignatureModal ? 'modal-active' : ''}`} onClick={() => setShowSignatureModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <span className="close-btn" onClick={() => setShowSignatureModal(false)}>×</span>
              <h2>Confirmation</h2>
              <p>Confirmez la lecture :</p>
              <div className="signature-input">
                <label>Signature:</label>
                <input 
                  type="text" 
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Entrez votre signature"
                  required
                />
              </div>
              <div className="signature-actions">
                <button onClick={confirmSignature}>
                  <FontAwesomeIcon icon={faSignature} /> Confirmer
                </button>
                <button onClick={() => setShowSignatureModal(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default CompteUtilisateur;