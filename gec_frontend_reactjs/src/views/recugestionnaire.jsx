import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './compteutilisateur.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox, 
  faPaperPlane, 
  faCog, 
  faSearch, 
  faStar, 
  faCheckCircle, 
  faTrash, 
  faSignature, 
  faAngleLeft, 
  faAngleRight, 
  faSort,
  faFileSignature,
  faFileImport
} from '@fortawesome/free-solid-svg-icons';

const RecuGestionnaire = () => {
  const [courriers, setCourriers] = useState([]);
  const [user, setUser] = useState({ name: '', email: '', id: null });
  const [services, setServices] = useState([]);
  const [selectedCourrier, setSelectedCourrier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
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
      setError('Token d\'authentification manquant');
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
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
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token d\'authentification manquant');
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
        setServices(data);
      } else {
        throw new Error('Échec de la récupération des services');
      }
    } catch (error) {
      console.error('Erreur services:', error);
      setError('Impossible de charger les services');
    }
  };

  const fetchCourriersRecus = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || !user.id) {
      setError('Token d\'authentification manquant ou utilisateur non identifié');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/transferts/courriers-recus', {
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
          reference: c.reference,
          service_expediteur: c.service_expediteur?.nom || 'Non spécifié',
          destinataire: user.name,
          objet: c.objet,
          date_reception: c.date_reception ? new Date(c.date_reception).toLocaleDateString('fr-FR') : '',
          statut: c.statut,
          contenu: c.contenu || 'Aucun contenu',
        })));
      } else {
        throw new Error('Échec de la récupération des courriers');
      }
    } catch (error) {
      console.error('Erreur fetchCourriersRecus:', error);
      setError('Erreur lors de la récupération des courriers');
    } finally {
      setLoading(false);
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

  const handleSearch = (e) => setFilters({ ...filters, search: e.target.value.trim().toLowerCase() });
  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const showCourrierDetail = (courrier) => {
    setSelectedCourrier(courrier);
    setShowModal(true);
    if (courrier.statut === 'pending') setShowSignatureModal(true);
  };

  const confirmSignature = async () => {
    if (selectedCourrier) {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`http://localhost:8000/api/transferts/${selectedCourrier.transfert_id}/marquer-lu`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setCourriers(courriers.map(c => c.id === selectedCourrier.id ? { ...c, statut: 'read' } : c));
          setShowSignatureModal(false);
          setShowModal(true);
        } else {
          throw new Error('Échec de la signature');
        }
      } catch (error) {
        setError('Erreur lors de la signature du courrier');
        console.error(error);
      }
    }
  };

  const markAsFavoris = () => alert('Courrier ajouté aux favoris');

  const markAsTraite = async () => {
    if (selectedCourrier) {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`http://localhost:8000/api/transferts/${selectedCourrier.transfert_id}/marquer-traite`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setCourriers(courriers.map(c => c.id === selectedCourrier.id ? { ...c, statut: 'traite' } : c));
          setShowModal(false);
        } else {
          throw new Error('Échec du marquage comme traité');
        }
      } catch (error) {
        setError('Erreur lors du marquage comme traité');
        console.error(error);
      }
    }
  };

  const deleteCourrier = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer ce courrier ?')) {
      const token = localStorage.getItem('authToken');
      try {
        await fetch(`http://localhost:8000/api/transferts/${selectedCourrier.transfert_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourriers(courriers.filter(c => c.id !== selectedCourrier.id));
        setShowModal(false);
      } catch (error) {
        setError('Erreur lors de la suppression du courrier');
        console.error(error);
      }
    }
  };

  const filterCourriers = () => {
    return courriers.filter(courrier => {
      const serviceMatch = !filters.service || courrier.service_expediteur === filters.service;
      const dateMatch = !filters.date || new Date(courrier.date_reception).toISOString().split('T')[0] === filters.date;
      const statutMatch = !filters.statut || courrier.statut === filters.statut;
      const searchMatch = !filters.search || 
        courrier.objet.toLowerCase().includes(filters.search) || 
        courrier.reference.toLowerCase().includes(filters.search) || 
        courrier.service_expediteur.toLowerCase().includes(filters.search);
      return serviceMatch && dateMatch && statutMatch && searchMatch;
    });
  };

  const sortTable = (columnIndex) => {
    const sorted = [...filterCourriers()].sort((a, b) => {
      const aValue = columnIndex === 4 ? new Date(a.date_reception) : a[columnIndex === 0 ? 'reference' : columnIndex === 1 ? 'service_expediteur' : columnIndex === 2 ? 'destinataire' : columnIndex === 3 ? 'objet' : 'statut'];
      const bValue = columnIndex === 4 ? new Date(b.date_reception) : b[columnIndex === 0 ? 'reference' : columnIndex === 1 ? 'service_expediteur' : columnIndex === 2 ? 'destinataire' : columnIndex === 3 ? 'objet' : 'statut'];
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    });
    setCourriers(sorted);
  };

  return (
    <div className="compte-utilisateur">
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
              <div className="user-name">{user.name || 'Utilisateur'}</div>
              <div className="user-email">{user.email || 'utilisateur@ctama.com'}</div>
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
            <li className="nav-item"><a href="/courrierenvoye"><FontAwesomeIcon icon={faPaperPlane} /> Courriers envoyés</a></li>
            <li className="nav-item">
              <a href="Comptegestionnaire" className="active"><FontAwesomeIcon icon={faFileSignature} /> Signatures reçues</a>
            </li>
            <li className="nav-item">
              <a href="/Ajoutercourrier"><FontAwesomeIcon icon={faFileImport} /> Créer Courrier</a>
            </li>
            <li className="nav-item"><a href="/parametres"><FontAwesomeIcon icon={faCog} /> Paramètres</a></li>
          </ul>
        </aside>

        <main className="content">
          <div className="content-header">
            <h1 className="content-title">Courriers <span>reçus</span></h1>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher un courrier..."
                onChange={handleSearch}
                value={filters.search}
              />
              <button onClick={handleSearch}><FontAwesomeIcon icon={faSearch} /></button>
            </div>
          </div>

          <div className="filters">
            <div className="filter-group">
              <label htmlFor="service">Service expéditeur</label>
              <select id="service" name="service" onChange={handleFilterChange} value={filters.service}>
                <option value="">Tous les services</option>
                {services.map(service => (
                  <option key={service.id} value={service.nom}>{service.nom}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="date">Date de réception</label>
              <input type="date" id="date" name="date" onChange={handleFilterChange} value={filters.date} />
            </div>
            <div className="filter-group">
              <label htmlFor="statut">Statut</label>
              <select id="statut" name="statut" onChange={handleFilterChange} value={filters.statut}>
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="read">Lu</option>
                <option value="traite">Traité</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Chargement des courriers reçus...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <table className="courriers-table" id="courriersTable">
              <thead>
                <tr>
                  <th onClick={() => sortTable(0)}>Référence <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(1)}>Service expéditeur <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(2)}>Destinataire <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(3)}>Objet <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(4)}>Date de réception <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(5)}>Statut <FontAwesomeIcon icon={faSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filterCourriers().map(courrier => (
                  <tr key={courrier.id} onClick={() => showCourrierDetail(courrier)}>
                    <td>{courrier.reference}</td>
                    <td>{courrier.service_expediteur}</td>
                    <td>{courrier.destinataire}</td>
                    <td>{courrier.objet}</td>
                    <td>{courrier.date_reception}</td>
                    <td><span className={`courrier-status status-${courrier.statut}`}>
                      {courrier.statut === 'pending' ? 'En attente' : 
                       courrier.statut === 'read' ? 'Lu' : 
                       courrier.statut === 'traite' ? 'Traité' : 'Inconnu'}
                    </span></td>
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
          <h2 id="modalRef">{selectedCourrier?.reference}</h2>
          <div className="modal-section">
            <h3>Détails du courrier</h3>
            <p><strong>Service expéditeur:</strong> <span id="modalExpediteur">{selectedCourrier?.service_expediteur}</span></p>
            <p><strong>Destinataire:</strong> <span>{selectedCourrier?.destinataire}</span></p>
            <p><strong>Date de réception:</strong> <span id="modalDate">{selectedCourrier?.date_reception}</span></p>
            <p><strong>Statut:</strong> <span id="modalStatut">
              <span className={`courrier-status status-${selectedCourrier?.statut}`}>
                {selectedCourrier?.statut === 'pending' ? 'En attente' : 
                 selectedCourrier?.statut === 'read' ? 'Lu' : 
                 selectedCourrier?.statut === 'traite' ? 'Traité' : 'Inconnu'}
              </span>
            </span></p>
            <p><strong>Objet:</strong> <span id="modalObjet">{selectedCourrier?.objet}</span></p>
          </div>
          <div className="modal-section">
            <h3>Contenu</h3>
            <div id="modalContenu" className="contenu-courrier">{selectedCourrier?.contenu}</div>
          </div>
          <div className="modal-actions">
            <button id="favorisBtn" onClick={markAsFavoris}><FontAwesomeIcon icon={faStar} /> Favoris</button>
            <button id="traiteBtn" onClick={markAsTraite}><FontAwesomeIcon icon={faCheckCircle} /> Marquer comme traité</button>
            <button id="supprimerBtn" onClick={deleteCourrier}><FontAwesomeIcon icon={faTrash} /> Supprimer</button>
          </div>
        </div>
      </div>

      <div id="signatureModal" className={`modal ${showSignatureModal ? 'modal-active' : ''}`} onClick={() => setShowSignatureModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <span className="close-btn" onClick={() => setShowSignatureModal(false)}>×</span>
          <h2>Confirmation de lecture</h2>
          <p>Veuillez confirmer que vous avez pris connaissance de ce courrier :</p>
          <button id="confirmSignature" className="signer-btn" onClick={confirmSignature}>
            <FontAwesomeIcon icon={faSignature} /> Signer pour confirmer
          </button>
          <div className="signature-actions">
            <button id="cancelSignature" onClick={() => setShowSignatureModal(false)}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecuGestionnaire;