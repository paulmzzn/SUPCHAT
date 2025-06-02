import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (token && email) {
      try {
        // Utilise la même clé que le reste de l'app (token)
        localStorage.setItem('token', token);
        localStorage.setItem('email', email);
        
        // Comme l'authentification OAuth est vérifiée par le fournisseur,
        // on considère l'utilisateur comme déjà validé
        localStorage.setItem('isValidated', 'true');
        
        
        // Redirige proprement avec React Router
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error during redirection:', error);
        navigate('/login');
      }
    } else {
      console.error('Missing token or email');
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return <div>Redirection vers le dashboard...</div>;
}

export default AuthCallback;
