import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './courrierenvoye.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox, faPaperPlane, faCog, faSearch, faAngleLeft, faAngleRight, faSort, faEye
} from '@fortawesome/free-solid-svg-icons';

const CourriersEnvoyes = () => {
  const [courriers, setCourriers] = useState([]);
  const [user, setUser] = useState({ name: '', email: '', id: null });
  const [services, setServices] = useState([]);
  const [selectedCourrier, setSelectedCourrier] = useState(null);
  const [showModal, setShowModal] = useState(false);
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
      fetchCourriersEnvoyes();
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
      if (err.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
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

  const fetchCourriersEnvoyes = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || !user.id) {
      setError('Token d\'authentification manquant ou utilisateur non identifié');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/transferts/courriers-envoyes', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error('Échec de la récupération des courriers envoyés');
      }
      
      const data = await response.json();
      setCourriers(data.map(c => ({
        id: c.id,
        transfert_id: c.transfert_id,
        reference: c.reference || 'N/A',
        service_destinataire: c.service_destinataire || 'Non spécifié',
        expediteur: c.expediteur || user.name,
        objet: c.objet || 'Sans objet',
        date_envoi: c.date_envoi || c.created_at,
        statut: c.statut || 'pending',
        contenu: c.contenu || 'Aucun contenu',
      })));
    } catch (error) {
      console.error('Erreur fetchCourriersEnvoyes:', error);
      setError(error.message || 'Erreur lors de la récupération des courriers envoyés');
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
  };

  const mapStatut = (statut) => {
    if (!statut) return 'Inconnu';
    
    const statutLower = statut.toLowerCase();
    const statutMap = {
      'pending': 'En attente',
      'read': 'Lu',
      'traite': 'Traité',
      'refuse': 'Refusé'
    };
    
    return statutMap[statutLower] || statut;
  };

  const filterCourriers = () => {
    return courriers.filter(courrier => {
      const courrierStatut = courrier.statut?.toLowerCase() || '';
      const filterStatut = filters.statut.toLowerCase();
      
      const serviceMatch = !filters.service || 
        (courrier.service_destinataire?.toLowerCase() || '').includes(filters.service.toLowerCase());
      const dateMatch = !filters.date || 
        (courrier.date_envoi && new Date(courrier.date_envoi).toISOString().split('T')[0] === filters.date);
      const statutMatch = !filters.statut || courrierStatut === filterStatut;
      const searchMatch = !filters.search || 
        (courrier.objet?.toLowerCase() || '').includes(filters.search.toLowerCase()) || 
        (courrier.reference?.toLowerCase() || '').includes(filters.search.toLowerCase()) ||
        (courrier.service_destinataire?.toLowerCase() || '').includes(filters.search.toLowerCase());
      
      return serviceMatch && dateMatch && statutMatch && searchMatch;
    });
  };

  const sortTable = (columnIndex) => {
    const sorted = [...filterCourriers()].sort((a, b) => {
      const getValue = (item, index) => {
        switch(index) {
          case 0: return item.reference?.toLowerCase() || '';
          case 1: return item.service_destinataire?.toLowerCase() || '';
          case 2: return item.expediteur?.toLowerCase() || '';
          case 3: return item.objet?.toLowerCase() || '';
          case 4: return item.date_envoi ? new Date(item.date_envoi) : null;
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

  return (
    <div className="courriers-envoyes">
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
            <li className="nav-item"><a href="/compteutilisateur"><FontAwesomeIcon icon={faInbox} /> Courriers reçus</a></li>
            <li className="nav-item"><a href="/courriersenvoyes" className="active"><FontAwesomeIcon icon={faPaperPlane} /> Courriers envoyés</a></li>
            <li className="nav-item"><a href="/parametres"><FontAwesomeIcon icon={faCog} /> Paramètres</a></li>
          </ul>
        </aside>

        <main className="content">
          <div className="content-header">
            <h1 className="content-title">Courriers <span>envoyés</span></h1>
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
              <label htmlFor="service">Service destinataire</label>
              <select id="service" name="service" onChange={handleFilterChange} value={filters.service}>
                <option value="">Tous les services</option>
                {services.map(service => (
                  <option key={service.id} value={service.nom}>{service.nom}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="date">Date envoi</label>
              <input type="date" id="date" name="date" onChange={handleFilterChange} value={filters.date} />
            </div>
            <div className="filter-group">
              <label htmlFor="statut">Statut</label>
              <select id="statut" name="statut" onChange={handleFilterChange} value={filters.statut}>
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="read">Lu</option>
                <option value="traite">Traité</option>
                <option value="refuse">Refusé</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Chargement des courriers envoyés...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <table className="courriers-table">
              <thead>
                <tr>
                  <th onClick={() => sortTable(0)}>Référence <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(1)}>Service destinataire <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(2)}>Expéditeur <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(3)}>Objet <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(4)}>Date envoi <FontAwesomeIcon icon={faSort} /></th>
                  <th onClick={() => sortTable(5)}>Statut <FontAwesomeIcon icon={faSort} /></th>
                </tr>
              </thead>
              <tbody>
                {filterCourriers().map(courrier => (
                  <tr key={courrier.id} onClick={() => showCourrierDetail(courrier)}>
                    <td>{courrier.reference}</td>
                    <td>{courrier.service_destinataire}</td>
                    <td>{courrier.expediteur}</td>
                    <td>{courrier.objet}</td>
                    <td>{courrier.date_envoi ? new Date(courrier.date_envoi).toLocaleDateString('fr-FR') : 'N/A'}</td>
                    <td>
                      <span className={`statut-${courrier.statut?.toLowerCase()}`}>
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
          <h2>{selectedCourrier?.reference || 'Détails du courrier'}</h2>
          <div className="modal-section">
            <h3>Détails</h3>
            <p><strong>Service destinataire:</strong> <span>{selectedCourrier?.service_destinataire || 'Non spécifié'}</span></p>
            <p><strong>Expéditeur:</strong> <span>{selectedCourrier?.expediteur || 'Non spécifié'}</span></p>
            <p><strong>Date envoi:</strong> <span>{selectedCourrier?.date_envoi ? new Date(selectedCourrier.date_envoi).toLocaleDateString('fr-FR') : 'Non spécifiée'}</span></p>
            <p><strong>Statut:</strong>
              <span className={`statut-${selectedCourrier?.statut?.toLowerCase()}`}>
                {mapStatut(selectedCourrier?.statut)}
              </span>
            </p>
            <p><strong>Objet:</strong> <span>{selectedCourrier?.objet || 'Sans objet'}</span></p>
          </div>
          <div className="modal-section">
            <h3>Contenu</h3>
            <div className="contenu-courrier">{selectedCourrier?.contenu || 'Aucun contenu'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourriersEnvoyes;