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
        localStorage.setItem('userToken', token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isValidated', 'true');
        console.log('Token stored, redirecting to dashboard...');
        // Force la navigation vers le dashboard
        window.location.href = '/dashboard';
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
