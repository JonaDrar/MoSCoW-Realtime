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
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(currentUser);
          const userData = userDoc.data();
          setUsername(userData.username || '');
          onUserRegistered(currentUser, userData.username || '');
        } else {
          await auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
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
      setUser(newUser);
      onUserRegistered(newUser, username.trim());
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-primary-gradient p-4">
        <div className="flex items-center text-primary-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span className="text-lg">{tHomePage('loading')}</span>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-primary-gradient p-4">
      {/* Increased max-w, added padding, background blur backdrop */}
      <Card className="w-full max-w-lg shadow-2xl rounded-xl overflow-hidden bg-card/90 backdrop-blur-sm border-border/20">
        <CardHeader className="text-center p-6 sm:p-8">
           {/* Added icon */}
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary border border-primary/20 w-fit">
            <Users className="h-8 w-8" />
          </div>
          {/* Larger title */}
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
              className="h-12 text-base focus:ring-2 focus:ring-primary/50 transition-shadow duration-200 shadow-inner bg-background/80" // Larger input, subtle styling
              disabled={loading}
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter className="p-6 sm:p-8 bg-muted/30 border-t border-border/10">
          {/* Larger button */}
          <Button onClick={handleRegister} className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition duration-200" disabled={loading}>
            {loading ? (
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
    </div>
  );
}
