// src/components/auth/user-registration.tsx
'use client';

import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { Loader2, Users } from 'lucide-react'; // Import Loader2 and Users icon

interface UserRegistrationProps {
  onUserRegistered: (user: User, username: string) => void;
}

export default function UserRegistration({ onUserRegistered }: UserRegistrationProps) {
  const t = useTranslations('UserRegistration');
  const tHomePage = useTranslations('HomePage');
  const [username, setUsername] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // Start loading on auth state change check
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(currentUser);
            const userData = userDoc.data();
            const currentUsername = userData.username || '';
            setUsername(currentUsername);
            onUserRegistered(currentUser, currentUsername);
          } else {
            // User exists in auth but not in Firestore, sign out and force registration
            await auth.signOut();
            setUser(null);
            setUsername('');
          }
        } catch (error) {
          console.error("Error checking user document:", error);
          // Keep user logged out if Firestore check fails
          await auth.signOut();
          setUser(null);
          setUsername('');
        }
      } else {
        // No user is signed in
        setUser(null);
        setUsername('');
      }
      setLoading(false); // Finish loading after check
    });
    return () => unsubscribe();
  }, [onUserRegistered]);

  const handleRegister = async () => {
    if (!username.trim()) {
      toast({
        title: t('validationErrorTitle'),
        description: t('validationErrorMessage'),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const newUser = userCredential.user;
      await setDoc(doc(db, 'users', newUser.uid), {
        username: username.trim(),
        createdAt: serverTimestamp(),
      });
      // No need to setUser or call onUserRegistered here, useEffect handles it
      toast({
        title: t('successToastTitle'),
        description: t('successToastDescription', { username: username.trim() }),
      });
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      toast({
        title: t('errorToastTitle'),
        description: error.message || 'Could not register user.',
        variant: 'destructive',
      });
      setLoading(false); // Ensure loading stops on error
    }
    // setLoading(false) is handled by the useEffect on auth state change
  };

  // If still checking auth state, show a loader within the card structure
  if (loading) {
    return (
      <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden bg-card/90 backdrop-blur-sm border-border/20">
         <CardHeader className="text-center p-6 sm:p-8">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary border border-primary/20 w-fit">
              <Users className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold text-gradient">{t('title')}</CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-base">{t('description')}</CardDescription>
         </CardHeader>
         <CardContent className="p-6 sm:p-8 flex justify-center items-center min-h-[150px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </CardContent>
         <CardFooter className="p-6 sm:p-8 bg-muted/30 border-t border-border/10">
             <Button className="w-full h-12 text-lg bg-primary text-primary-foreground" disabled={true}>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {tHomePage('loading')}
            </Button>
         </CardFooter>
      </Card>
    );
  }

   // If user is logged in (checked by useEffect), this component shouldn't render anything substantial.
   // The parent component handles showing the main board. Return null.
  if (user) {
    return null;
  }

  // Only render the registration form if not loading and no user is logged in
  return (
      // Removed the outer div with gradient background and centering
      <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden bg-card/90 backdrop-blur-sm border-border/20">
        <CardHeader className="text-center p-6 sm:p-8">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary border border-primary/20 w-fit">
            <Users className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-gradient">{t('title')}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-base">{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">{t('usernameLabel')}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t('usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 text-base focus:ring-2 focus:ring-primary/50 transition-shadow duration-200 shadow-inner bg-background/80"
              disabled={loading} // Keep disabled check here for button click state
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleRegister()} // Allow Enter key submission
            />
          </div>
        </CardContent>
        <CardFooter className="p-6 sm:p-8 bg-muted/30 border-t border-border/10">
          <Button onClick={handleRegister} className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition duration-200" disabled={loading}>
            {loading ? ( // Show loading only when registration action is in progress
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('joiningButton')}
              </>
            ) : (
              t('joinButton')
            )}
          </Button>
        </CardFooter>
      </Card>
  );
}
