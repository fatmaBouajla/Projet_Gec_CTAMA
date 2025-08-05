import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './courrierenvoye.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox, faPaperPlane, faCog, faSearch,
  faAngleLeft, faAngleRight, faSort,
  faFileImport, faFileAlt, faDownload, faTrash
} from '@fortawesome/free-solid-svg-icons';

const CourriersEnvoyesgest = () => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
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
    try {
      const response = await fetch('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await response.json();
      setUser({
        name: userData.name,
        email: userData.email,
        id: userData.id
      });
    } catch (err) {
      setError('Erreur récupération utilisateur');
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:8000/api/services', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setServices(data);
    } catch (error) {
      setError('Impossible charger services');
    }
  };

  const fetchCourriersEnvoyes = async () => {
    const token = localStorage.getItem('authToken');
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/transferts/courriers-envoyes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      setCourriers(data.map(c => ({
        ...c,
        id: c.id,
        transfert_id: c.transfert_id,
        reference: c.reference || 'N/A',
        service_destinataire: c.service_destinataire || 'Non spécifié',
        expediteur: c.expediteur || user.name,
        destinataire: c.destinataire || 'Non spécifié', // Nom du destinataire depuis l'API
        objet: c.objet || 'Sans objet',
        date_envoi: c.date_envoi, // Date de création du transfert depuis l'API
        statut: c.statut || 'en_attente',
        commentaire: c.contenu || 'Aucun commentaire', // Contenu du courrier depuis l'API
        fichier: c.fichier || null, // Fichier du courrier
        courrier_id: c.courrier_id || c.id
      })));
    } catch (error) {
      setError('Erreur récupération courriers envoyés');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Déconnexion ?')) {
      localStorage.removeItem('authToken');
      navigate('/login');
    }
  };

  const handleSearch = (e) => setFilters({ ...filters, search: e.target.value.trim().toLowerCase() });
  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const showCourrierDetail = (courrier) => {
    if (!courrier) return;
    setSelectedCourrier(courrier);
    setShowModal(true);
  };

  const mapStatut = (statut) => {
    const statutMap = {
      'pending': 'En attente', 
      'en_attente': 'En attente',
      'transfere': 'Transféré',
      'read': 'Lu',
      'lu': 'Lu',
      'traite': 'Traité',
      'refuse': 'Refusé'
    };
    return statutMap[statut?.toLowerCase()] || statut;
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
    }
  };

  const handleDownload = (e, courrierId, fileName) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    window.open(
      `http://localhost:8000/api/courriers/${courrierId}/telecharger?token=${token}`,
      '_blank'
    );
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedCourriers = () => {
    const sortableCourriers = [...courriers];
    if (sortConfig.key) {
      sortableCourriers.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCourriers;
  };

  const filterCourriers = () => {
    return getSortedCourriers().filter(courrier => {
      const matchesSearch = !filters.search ||
        (courrier.objet?.toLowerCase().includes(filters.search.toLowerCase()) ||
          courrier.reference?.toLowerCase().includes(filters.search.toLowerCase()) ||
          courrier.service_destinataire?.toLowerCase().includes(filters.search.toLowerCase()));

      const matchesService = !filters.service ||
        courrier.service_destinataire?.toLowerCase().includes(filters.service.toLowerCase());

      const matchesDate = !filters.date ||
        (courrier.date_envoi && new Date(courrier.date_envoi).toISOString().split('T')[0] === filters.date);

      const matchesStatut = !filters.statut ||
        courrier.statut?.toLowerCase() === filters.statut.toLowerCase();

      return matchesSearch && matchesService && matchesDate && matchesStatut;
    });
  };
  
  const paginatedCourriers = () => {
    const filtered = filterCourriers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filterCourriers().length / itemsPerPage);

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
            <li className="nav-item"><a href="/comptegestionnaire"><FontAwesomeIcon icon={faInbox} /> Signatures reçus</a></li>
            <li className="nav-item"><a href="/courrierenvoyegest" className="active"><FontAwesomeIcon icon={faPaperPlane} /> Courriers envoyés</a></li>
            <li className="nav-item"><a href="/Ajoutercourrier"><FontAwesomeIcon icon={faFileImport} /> Créer Courrier</a></li>
            <li className="nav-item"><a href="/brouillongest"><FontAwesomeIcon icon={faFileAlt} /> Mes Brouillons</a></li>
            <li className="nav-item"><a href="/parametres"><FontAwesomeIcon icon={faCog} /> Paramètres</a></li>
          </ul>
        </aside>

        <main className="content">
          <div className="content-header">
            <h1 className="content-title">Courriers <span>envoyés</span></h1>
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
              <label htmlFor="service">Service destinataire</label>
              <select id="service" name="service" onChange={handleFilterChange} value={filters.service}>
                <option value="">Tous</option>
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
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="transfere">Transféré</option>
                <option value="read">Lu</option>
                <option value="traite">Traité</option>
                <option value="refuse">Refusé</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Chargement...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <table className="courriers-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('reference')}>Référence <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => requestSort('service_destinataire')}>Service destinataire <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => requestSort('expediteur')}>Expéditeur <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => requestSort('objet')}>Objet <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => requestSort('date_envoi')}>Date envoi <FontAwesomeIcon icon={faSort} /></th>
                    <th onClick={() => requestSort('statut')}>Statut <FontAwesomeIcon icon={faSort} /></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCourriers().map(courrier => (
                    <tr key={courrier.id} onClick={() => showCourrierDetail(courrier)}>
                      <td>{courrier.reference}</td>
                      <td>{courrier.service_destinataire}</td>
                      <td>{courrier.expediteur}</td>
                      <td>{courrier.objet}</td>
                      <td>{courrier.date_envoi ? new Date(courrier.date_envoi).toLocaleDateString('fr-FR') : 'N/A'}</td>
                      <td>
                        <span className={`statut-${(courrier.statut || '').toLowerCase().replace(' ', '_')}`}>
                          {mapStatut(courrier.statut)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <FontAwesomeIcon icon={faAngleLeft} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={currentPage === page ? 'active' : ''}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <FontAwesomeIcon icon={faAngleRight} />
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal détaillé identique à compteutilisateur.jsx */}
      <div id="courrierModal" className={`modal ${showModal ? 'modal-active' : ''}`} onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <span className="close-btn" onClick={() => setShowModal(false)}>×</span>
          
          <div className="modal-section">
            <h3>Détails</h3>
            <p><strong>Référence:</strong> <span>{selectedCourrier?.reference || 'N/A'}</span></p>
            <p><strong>Service destinataire:</strong> <span>{selectedCourrier?.service_destinataire || 'Non spécifié'}</span></p>
            <p><strong>Expéditeur:</strong> <span>{selectedCourrier?.expediteur || user.name}</span></p>
            <p><strong>Destinataire:</strong> <span>{selectedCourrier?.destinataire || 'Non spécifié'}</span></p>
            <p><strong>Date d'envoi:</strong> <span>{selectedCourrier?.date_envoi ? new Date(selectedCourrier.date_envoi).toLocaleDateString('fr-FR') : 'Non spécifiée'}</span></p>
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
                onClick={(e) => handleDownload(e, selectedCourrier.courrier_id, selectedCourrier.fichier)}
              >
                <FontAwesomeIcon icon={faDownload} /> Télécharger le fichier
              </a>
            ) : (
              <p>Aucun fichier joint</p>
            )}
          </div>

          <div className="modal-actions">
            <button onClick={() => setShowModal(false)}>Fermer</button>
            <button
              onClick={deleteCourrier}
              className="delete-btn"
            >
              <FontAwesomeIcon icon={faTrash} /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourriersEnvoyesgest;