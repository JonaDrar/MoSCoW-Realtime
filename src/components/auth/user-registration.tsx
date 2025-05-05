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

interface UserRegistrationProps {
  onUserRegistered: (user: User, username: string) => void;
}

export default function UserRegistration({ onUserRegistered }: UserRegistrationProps) {
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
          // User exists in auth but not in Firestore (e.g., deleted account), sign them out
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
        title: 'Error',
        description: 'Please enter a username.',
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
        title: 'Success',
        description: `Welcome, ${username.trim()}!`,
      });
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Could not register user.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (user) {
    return null; // Don't render anything if user is already registered and loaded
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gradient">Join MoSCoW Realtime</CardTitle>
          <CardDescription className="text-center text-muted-foreground">Enter a username to start collaborating.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="focus:ring-accent"
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRegister} className="w-full bg-primary-gradient text-primary-foreground hover:opacity-90" disabled={loading}>
            {loading ? 'Joining...' : 'Join Session'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
