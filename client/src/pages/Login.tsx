import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm/LoginForm';

export function Login() {
  const navigate = useNavigate();
  return <LoginForm onSuccess={() => navigate('/')} />;
}
