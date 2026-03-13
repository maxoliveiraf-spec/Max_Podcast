/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { Episode } from './types';
import { AudioProvider } from './AudioContext';
import { EpisodeList } from './components/EpisodeList';
import { AudioPlayer } from './components/AudioPlayer';
import { PixDonation } from './components/PixDonation';
import { AdminPanel } from './components/AdminPanel';
import { Mic2, LogIn, LogOut, Search, Headphones } from 'lucide-react';
import { motion } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

export default function App() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'episodes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const episodesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Episode[];
      setEpisodes(episodesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'episodes');
    });

    const authUnsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u?.email, u?.emailVerified);
      setUser(u);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const filteredEpisodes = episodes.filter(ep => 
    ep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = user?.email === 'maxoliveiraf@gmail.com';

  return (
    <AudioProvider>
      <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black">
                <Mic2 size={20} />
              </div>
              <h1 className="text-white font-bold text-xl tracking-tight">Max Podcast</h1>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-white text-xs font-bold">{user.displayName}</p>
                    <span className="text-zinc-500 text-[10px] block">{isAdmin ? 'Administrador' : 'Ouvinte'}</span>
                  </div>
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-zinc-700" />
                  <button 
                    onClick={() => auth.signOut()}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full transition-colors"
                >
                  <LogIn size={18} />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-12 pb-32">
          {/* Hero Section */}
          <section className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium mb-6"
            >
              <Headphones size={14} />
              Ouça agora os melhores episódios
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">
              CONECTE-SE COM <br />
              <span className="text-emerald-500">A INFORMAÇÃO.</span>
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-lg mb-10">
              Explore histórias, entrevistas e debates exclusivos. 
              O seu podcast favorito, agora em um só lugar.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar episódios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </section>

          {/* Episodes List */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">Episódios Recentes</h3>
              <span className="text-zinc-500 text-sm font-medium">{filteredEpisodes.length} episódios</span>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <EpisodeList episodes={filteredEpisodes} />
            )}
          </section>

          {/* PIX Donation */}
          <PixDonation />
        </main>

        {/* Admin Panel (Strictly restricted to admin email) */}
        {isAdmin && <AdminPanel />}

        {/* Persistent Audio Player */}
        <AudioPlayer />
      </div>
    </AudioProvider>
  );
}

