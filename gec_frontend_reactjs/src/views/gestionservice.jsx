import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './gestionservice.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsersCog, faBuilding, faCogs,
  faTimes, faCheck, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const GestionService = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: '' 
  });

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/services', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setServices(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des services');
      showNotification('Erreur lors du chargement des services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  const handleAddService = async () => {
    if (!newService.trim()) {
      showNotification('Veuillez entrer un nom de service', 'error');
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8000/api/services', 
        { nom: newService },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setServices([...services, response.data.service]);
      setNewService('');
      setShowAddForm(false);
      showNotification('Service ajouté avec succès', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Erreur lors de l\'ajout du service';
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:8000/api/services/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setServices(services.filter(service => service.id !== id));
      showNotification(response.data?.message || 'Service supprimé avec succès', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         'Erreur lors de la suppression du service';
      showNotification(errorMessage, 'error');
    }
  };

  const filteredServices = services.filter(service =>
    service.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const Notification = ({ notification }) => {
    if (!notification.show) return null;

    const icon = notification.type === 'success' 
      ? faCheck 
      : notification.type === 'error' 
        ? faExclamationTriangle 
        : null;

    return (
      <div className={`notification ${notification.type}`}>
        {icon && <FontAwesomeIcon icon={icon} className="notification-icon" />}
        {notification.message}
      </div>
    );
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-container">
          <div className="logo">
            <img src="/images/logo.png" alt="Logo GEC_CTAMA" />
            <div className="logo-text">
              <div className="main">GEC_CTAMA</div>
              <div className="sub">Gestionnaire des courriers</div>
            </div>
          </div>
          <div className="user-info">
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <h2>Menu Administration</h2>
          <ul className="nav-menu">
            <li className="nav-item">
              <a href="/compteadmin">
                <FontAwesomeIcon icon={faUsersCog} /> Gestion utilisateurs
              </a>
            </li>
            <li className="nav-item">
              <a href="/gestionservice" className="active">
                <FontAwesomeIcon icon={faBuilding} /> Gestion services
              </a>
            </li>
            <li className="nav-item">
              <a href="/parametresadmin">
                <FontAwesomeIcon icon={faCogs} /> Paramètres système
              </a>
            </li>
          </ul>
        </aside>

        <main className="admin-main">
          <div className="admin-toolbar">
            <h2>Gestion des services</h2>
          </div>

          <div className="service-management">
            <div className="search-add-section">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="add-btn"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? 'Annuler' : 'Ajouter un service'}
              </button>
            </div>

            {showAddForm && (
              <div className="add-service-form">
                <input
                  type="text"
                  placeholder="Nom du nouveau service"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
                />
                <button onClick={handleAddService}>Confirmer</button>
              </div>
            )}

            <div className="services-list">
              {loading ? (
                <p className="loading-message">Chargement des services...</p>
              ) : filteredServices.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Nom du service</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map(service => (
                      <tr key={service.id}>
                        <td>{service.nom}</td>
                        <td>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteService(service.id)}
                            disabled={notification.show}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-results">Aucun service trouvé</p>
              )}
            </div>
          </div>
        </main>
      </div>

      <Notification notification={notification} />
    </div>
  );
};

export default GestionService;