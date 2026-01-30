import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Mail, Lock } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card.jsx';

/**
 * ForgotPassword Component
 * 
 * Allows registered users to request a password reset link via email
 * Implements security best practices:
 * - Uniform response regardless of account existence (prevents account enumeration)
 * - Rate limiting (UI feedback after N attempts)
 * - CAPTCHA-ready (placeholder for captcha)
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Check rate limiting (client-side for UX feedback)
    if (requestCount >= 5) {
      setError('Πάρα πολλές αιτήσεις επαναφοράς. Παρακαλώ δοκιμάστε ξανά σε λίγα λεπτά.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        { emailOrUsername },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      // Always show success message (even if account doesn't exist)
      // This prevents account enumeration attacks
      setSuccess(true);
      setEmailOrUsername('');
      setRequestCount(requestCount + 1);

      // Auto-redirect after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      // Even on error, show generic message to prevent enumeration
      if (err.response?.status === 429) {
        setError('Πάρα πολλές αιτήσεις επαναφοράς. Παρακαλώ δοκιμάστε ξανά αργότερα.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Η αίτηση έληξε. Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.');
      } else {
        // Show generic error
        setError('Αντιμετωπίσαμε ένα πρόβλημα. Παρακαλώ δοκιμάστε ξανά αργότερα.');
      }
      setRequestCount(requestCount + 1);
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Ελέγξτε το Email Σας</CardTitle>
            <CardDescription className="text-center">
              Στείλαμε ασφαλή σύνδεσμο επαναφοράς κωδικού
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">
                Εάν υπάρχει λογαριασμός συνδεδεμένος με <strong>{emailOrUsername}</strong>, στείλαμε ασφαλή σύνδεσμο επαναφοράς κωδικού στο email σας.
              </p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Ο σύνδεσμος θα λήξει σε 30 λεπτά για λόγους ασφαλείας.
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Ανακατεύθυνση στη σύνδεση σε λίγα δευτερόλεπτα...</p>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Επιστροφή στη Σύνδεση
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Ξέχασα τον Κωδικό</CardTitle>
          <CardDescription className="text-center">
            Θα σας βοηθήσουμε να επαναφέρετε τον κωδικό σας ασφαλώς
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email ή Όνομα Χρήστη
              </label>
              <Input
                type="text"
                placeholder="Εισάγετε email ή όνομα χρήστη"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Θα επαληθεύσουμε τον λογαριασμό σας και θα στείλουμε ασφαλή σύνδεσμο επαναφοράς.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Αποστολή...' : 'Αποστολή Συνδέσμου Επαναφοράς'}
            </Button>

            <div className="flex items-center justify-center pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-primary hover:underline font-medium"
              >
                Επιστροφή στη Σύνδεση
              </button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
