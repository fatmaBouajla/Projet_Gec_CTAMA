import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './compteadmin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsersCog, faBuilding, faCogs,
  faEdit, faTrash, faSearch, faPlus, faTimes
} from '@fortawesome/free-solid-svg-icons';
import debounce from 'lodash/debounce';

const CompteAdmin = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [user, setUser] = useState({ name: '', email: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [filters, setFilters] = useState({ service: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState(null);
  const [servicesError, setServicesError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchUsers();
    fetchServices();
  }, []);

  useEffect(() => {
    setFilteredUsers(filterUsers());
  }, [allUsers, filters]);

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
        setUser(userData);
      } else {
        throw new Error('Échec de la récupération des données utilisateur');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Erreur lors de la récupération des données utilisateur');
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token d\'authentification manquant');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const usersData = Array.isArray(data) ? data : (data.data || data.users || []);
      if (usersData.length === 0) {
        setError('Aucun utilisateur trouvé');
      }
      const formattedUsers = usersData.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        service: u.service?.nom || u.service_id || 'Inconnu',
        role: u.role || 'user',
        position: u.position || 'Non spécifiée'
      }));
      setAllUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Erreur lors du chargement des utilisateurs: ' + err.message);
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setServicesError('Token d\'authentification manquant');
      setLoadingServices(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/services', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Erreur services:', error);
      setServicesError('Impossible de charger les services. Veuillez réessayer.');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await fetch('http://localhost:8000/api/logout', {
            method: 'Get',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error('Logout error:', err);
        } finally {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      }
    }
  };

  const handleSearch = useCallback(
    debounce((value) => {
      setFilters(prev => ({ ...prev, search: value.trim().toLowerCase() }));
    }, 300),
    []
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filterUsers = () => {
  return allUsers.filter(user => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search ||
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.position && user.position.toLowerCase().includes(searchTerm))
      ) && (
        !filters.service || user.service === filters.service
      )
    );
  });
};

  const openUserModal = (user = null) => {
    setSelectedUser(user || {
      name: '',
      email: '',
      service: services.length > 0 ? services[0].nom : '',
      role: 'user',
      password: '',
      password_confirmation: '',
      position: ''
    });
    setShowUserModal(true);
  };

  const closeUserModal = () => setShowUserModal(false);
  const closeConfirmModal = () => setShowConfirmModal(false);

  const saveUser = async () => {
    const { name, email, service, role, password, password_confirmation, position } = selectedUser;
    if (!name || !email || !service || !position) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!validateEmail(email)) {
      alert('Veuillez entrer une adresse email valide');
      return;
    }
    if (!selectedUser.id && (!password || password !== password_confirmation)) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    const token = localStorage.getItem('authToken');
    setIsSubmitting(true);
    try {
      const url = selectedUser.id
        ? `http://localhost:8000/api/users/${selectedUser.id}`
        : 'http://localhost:8000/api/admin/users';

      const method = selectedUser.id ? 'PUT' : 'POST';

      const userData = selectedUser.id
        ? { 
            name, 
            email, 
            service, 
            role, 
            position,
            service_nom: service
          }
        : { 
            name, 
            email, 
            service_nom: service, 
            role, 
            password, 
            password_confirmation, 
            position 
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      const action = selectedUser.id ? 'modifié' : 'ajouté';
      alert(`Utilisateur ${action} avec succès !`);
      closeUserModal();
      fetchUsers();
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.message || 'Une erreur est survenue');
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      const token = localStorage.getItem('authToken');
      setIsSubmitting(true);
      try {
        const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }

        setAllUsers(allUsers.filter(u => u.id !== userId));
        setFilteredUsers(filteredUsers.filter(u => u.id !== userId));
        closeConfirmModal();
      } catch (err) {
        console.error('Erreur:', err);
        alert(err.message || 'Erreur lors de la suppression');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const editUser = (user) => {
    setSelectedUser({ ...user });
    openUserModal(user);
  };

  const deleteUser = (userId) => {
    setSelectedUser(allUsers.find(u => u.id === userId));
    setShowConfirmModal(true);
  };

  return (
    <div className="compte-admin">
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
              <div className="user-name">{user.name || 'Administrateur'}</div>
              <div className="user-email">{user.email || 'admin@gmail.com'}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <h2 className="sidebar-title">Menu Administration</h2>
          <ul className="nav-menu">
            <li className="nav-item">
              <a href="/compteadmin" className="active">
                <FontAwesomeIcon icon={faUsersCog} /> Gestion utilisateurs
              </a>
            </li>
            <li className="nav-item">
              <a href="/gestionservice">
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

        <main className="content">
          <div className="content-header">
            <h1 className="content-title">Gestion des <span>utilisateurs</span></h1>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => openUserModal()}>
                <FontAwesomeIcon icon={faPlus} /> Ajouter un utilisateur
              </button>
            </div>
          </div>

          <div className="filters">
            <div className="filter-group">
              <label htmlFor="serviceFilter">Service</label>
              <select id="serviceFilter" name="service" onChange={handleFilterChange} value={filters.service}>
                <option value="">Tous les services</option>
                {services.map(service => (
                  <option key={service.id} value={service.nom}>{service.nom}</option>
                ))}
              </select>
            </div>
            <div className="search-bar">
              <input
                type="text"
                id="userSearch"
                placeholder="Rechercher un utilisateur..."
                onChange={(e) => handleSearch(e.target.value)}
                value={filters.search}
              />
              <button id="searchBtn"><FontAwesomeIcon icon={faSearch} /></button>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Chargement des utilisateurs...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="error-message">Aucun utilisateur correspondant aux filtres</div>
          ) : (
            <table className="users-table" id="usersTable">
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Email</th>
                  <th>Service</th>
                  <th>Position</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.service}</td>
                    <td>{user.position}</td>
                    <td><span className={`user-role role-${user.role}`}>{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span></td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => editUser(user)}>
                        <FontAwesomeIcon icon={faEdit} /> Modifier
                      </button>
                      <button className="action-btn delete-btn" onClick={() => deleteUser(user.id)}>
                        <FontAwesomeIcon icon={faTrash} /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pagination">
            <button><FontAwesomeIcon icon={faTimes} /></button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button><FontAwesomeIcon icon={faTimes} /></button>
          </div>
        </main>
      </div>

      <div id="userModal" className={`modal ${showUserModal ? 'modal-active' : ''}`} onClick={closeUserModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <span className="close-btn" onClick={closeUserModal}>×</span>
          <h2 className="modal-title">
            {selectedUser?.id ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          </h2>

          <div className="form-group">
            <label htmlFor="userFullName">Nom complet</label>
            <input
              type="text"
              id="userFullName"
              value={selectedUser?.name || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
              placeholder="Entrez le nom complet"
            />
          </div>

          <div className="form-group">
            <label htmlFor="userEmail">Email</label>
            <input
              type="email"
              id="userEmail"
              value={selectedUser?.email || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              placeholder="Entrez l'email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="userService">Service</label>
            {servicesError ? (
              <div className="error-message">{servicesError}</div>
            ) : (
              <select
                id="userService"
                value={selectedUser?.service || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, service: e.target.value })}
                disabled={loadingServices}
              >
                <option value="">Sélectionnez un service</option>
                {loadingServices ? (
                  <option value="" disabled>Chargement des services...</option>
                ) : (
                  services.map(service => (
                    <option key={service.id} value={service.nom}>
                      {service.nom}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="userRole">Rôle</label>
            <select
              id="userRole"
              value={selectedUser?.role || 'user'}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
            >
              <option value="user">Utilisateur standard</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="userPosition">Position</label>
            <input
              type="text"
              id="userPosition"
              value={selectedUser?.position || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, position: e.target.value })}
              placeholder="Position dans l'entreprise"
            />
          </div>

          {!selectedUser?.id && (
            <>
              <div className="form-group">
                <label htmlFor="userPassword">Mot de passe</label>
                <input
                  type="password"
                  id="userPassword"
                  value={selectedUser?.password || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                  placeholder="Entrez le mot de passe"
                />
              </div>
              <div className="form-group">
                <label htmlFor="userPasswordConfirm">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="userPasswordConfirm"
                  value={selectedUser?.password_confirmation || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, password_confirmation: e.target.value })}
                  placeholder="Confirmez le mot de passe"
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={closeUserModal}>Annuler</button>
            <button className="btn btn-primary" onClick={saveUser} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      <div id="confirmModal" className={`modal ${showConfirmModal ? 'modal-active' : ''}`} onClick={closeConfirmModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
          <h2 className="modal-title">Confirmer la suppression</h2>
          <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={closeConfirmModal}>Annuler</button>
            <button className="btn btn-danger" onClick={() => confirmDelete(selectedUser?.id)} disabled={isSubmitting}>
              {isSubmitting ? 'Suppression...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompteAdmin;