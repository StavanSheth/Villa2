import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Redirect to the custom demo login page
  redirect('/login');
}
