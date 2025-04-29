
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';

// Types pour le stockage des tokens
interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// Types pour les données utilisateur
interface User {
  id: string;
  email: string;
  role?: string;
}

// Interface pour les credentials de connexion
interface LoginCredentials {
  email: string;
  password: string;
}

// Interface pour les contacts (exemple)
interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

/**
 * Hook personnalisé pour la gestion de l'API sécurisée
 */
export const useSecureApi = () => {
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Charger les tokens du localStorage au chargement
  useEffect(() => {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens) as AuthTokens;
        setTokens(parsedTokens);
      } catch (err) {
        // Si les tokens stockés sont invalides, les supprimer
        localStorage.removeItem('auth_tokens');
      }
    }
  }, []);

  /**
   * Fonction d'authentification sécurisée
   */
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Appel à l'Edge Function de login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Stockage sécurisé des tokens
      const newTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
      
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
      setTokens(newTokens);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction de déconnexion
   */
  const logout = () => {
    localStorage.removeItem('auth_tokens');
    setTokens(null);
    setUser(null);
    setContacts([]);
  };

  /**
   * Fonction pour rafraîchir le token d'accès
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!tokens?.refresh_token) return false;
    
    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!response.ok) {
        // Si le refresh token est invalide, déconnecter l'utilisateur
        logout();
        return false;
      }

      const data = await response.json();
      
      // Mettre à jour les tokens
      const newTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
      
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
      setTokens(newTokens);
      return true;
    } catch (err) {
      logout();
      return false;
    }
  };

  /**
   * Fonction générique pour appeler l'API avec le token d'accès
   */
  const fetchWithAuth = async <T,>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> => {
    if (!tokens?.access_token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`,
        },
        ...(body && { body: JSON.stringify(body) }),
      });

      // Si le token est expiré (401), essayer de rafraîchir
      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
          // Refaire la requête avec le nouveau token
          return fetchWithAuth<T>(endpoint, method, body);
        } else {
          throw new Error('Session expirée');
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur réseau');
    }
  };

  /**
   * Fonction pour récupérer les contacts
   */
  const fetchContacts = async () => {
    if (!tokens?.access_token) {
      setError('Vous devez être connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithAuth<{ data: Contact[] }>('/api/db/contacts');
      setContacts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction pour ajouter un contact
   */
  const addContact = async (contact: Omit<Contact, 'id' | 'created_at'>) => {
    if (!tokens?.access_token) {
      setError('Vous devez être connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithAuth<{ data: Contact[] }>(
        '/api/db/contacts',
        'POST',
        contact
      );
      
      // Rafraîchir la liste des contacts après ajout
      await fetchContacts();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction pour mettre à jour un contact
   */
  const updateContact = async (contact: Contact) => {
    if (!tokens?.access_token) {
      setError('Vous devez être connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithAuth<{ data: Contact[] }>(
        '/api/db/contacts',
        'PATCH',
        contact
      );
      
      // Rafraîchir la liste des contacts après mise à jour
      await fetchContacts();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fonction pour supprimer un contact
   */
  const deleteContact = async (id: string) => {
    if (!tokens?.access_token) {
      setError('Vous devez être connecté');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithAuth<{ data: Contact[] }>(
        `/api/db/contacts?id=${id}`,
        'DELETE'
      );
      
      // Rafraîchir la liste des contacts après suppression
      await fetchContacts();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    tokens,
    loading,
    error,
    contacts,
    login,
    logout,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    isAuthenticated: !!tokens?.access_token,
  };
};

/**
 * Composant de démonstration utilisant l'API sécurisée
 */
const SecureApiDemo: React.FC = () => {
  const {
    user,
    loading,
    error,
    contacts,
    login,
    logout,
    fetchContacts,
    addContact,
    isAuthenticated,
  } = useSecureApi();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [newContact, setNewContact] = useState<{ name: string; email: string; phone: string }>({
    name: '',
    email: '',
    phone: '',
  });

  // Gérer la soumission du formulaire de connexion
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  // Gérer l'ajout d'un contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    addContact(newContact);
    setNewContact({ name: '', email: '', phone: '' });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Sécurisée avec Edge Functions</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading && <div className="text-gray-600 mb-4">Chargement...</div>}
      
      {!isAuthenticated ? (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connexion</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={loading}
            >
              Se connecter
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Connecté</h2>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1 rounded-md"
              >
                Déconnexion
              </button>
            </div>
            {user && (
              <div>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>ID:</strong> {user.id}</p>
                {user.role && <p><strong>Rôle:</strong> {user.role}</p>}
              </div>
            )}
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Contacts</h2>
            <button
              onClick={fetchContacts}
              className="bg-green-600 text-white px-3 py-1 rounded-md mb-4"
              disabled={loading}
            >
              Charger les contacts
            </button>

            {contacts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Nom</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="border-t">
                        <td className="px-4 py-2">{contact.name}</td>
                        <td className="px-4 py-2">{contact.email}</td>
                        <td className="px-4 py-2">{contact.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucun contact à afficher</p>
            )}
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Ajouter un contact</h2>
            <form onSubmit={handleAddContact}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Téléphone</label>
                <input
                  type="text"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md"
                disabled={loading}
              >
                Ajouter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureApiDemo;
