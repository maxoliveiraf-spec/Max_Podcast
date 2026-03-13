import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Plus, X, Upload, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Episode } from '../types';

export const AdminPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    audioUrl: '',
    duration: ''
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEpisodes();
    }
  }, [isOpen]);

  const fetchEpisodes = async () => {
    const q = query(collection(db, 'episodes'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const fetchedEpisodes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Episode[];
    setEpisodes(fetchedEpisodes);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const uploadFile = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!audioFile) return resolve(form.audioUrl);

      const storageRef = ref(storage, `podcasts/${Date.now()}_${audioFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, audioFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => reject(error),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      let finalAudioUrl = form.audioUrl;

      if (audioFile) {
        finalAudioUrl = await uploadFile();
      } else if (finalAudioUrl.includes('drive.google.com')) {
        const driveIdMatch = finalAudioUrl.match(/\/d\/(.+?)\//) || finalAudioUrl.match(/id=(.+?)(&|$)/);
        if (driveIdMatch && driveIdMatch[1]) {
          finalAudioUrl = `https://docs.google.com/uc?export=open&id=${driveIdMatch[1]}`;
        }
      }

      if (editingId) {
        await updateDoc(doc(db, 'episodes', editingId), {
          title: form.title,
          description: form.description,
          audioUrl: finalAudioUrl,
          duration: Number(form.duration) || 0,
        });
      } else {
        await addDoc(collection(db, 'episodes'), {
          ...form,
          audioUrl: finalAudioUrl,
          duration: Number(form.duration) || 0,
          createdAt: serverTimestamp(),
          authorId: auth.currentUser.uid
        });
      }

      setForm({ title: '', description: '', audioUrl: '', duration: '' });
      setAudioFile(null);
      setUploadProgress(0);
      setEditingId(null);
      fetchEpisodes();
      if (!editingId) setIsOpen(false);
    } catch (error) {
      console.error("Error saving episode:", error);
      alert("Erro ao salvar episódio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar este episódio?")) {
      try {
        await deleteDoc(doc(db, 'episodes', id));
        fetchEpisodes();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const startEdit = (episode: Episode) => {
    setEditingId(episode.id);
    setForm({
      title: episode.title,
      description: episode.description,
      audioUrl: episode.audioUrl,
      duration: String(episode.duration)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', description: '', audioUrl: '', duration: '' });
    setAudioFile(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Plus size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl my-8"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                <h3 className="text-xl font-bold text-white">
                  {editingId ? 'Editar Episódio' : 'Gerenciar Episódios'}
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Form Section */}
                <div className="p-6 border-r border-zinc-800">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4">
                      {editingId ? 'Atualizar Dados' : 'Novo Episódio'}
                    </h4>
                    
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Título</label>
                      <input
                        required
                        type="text"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Título do episódio"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Descrição</label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                        placeholder="Descrição detalhada"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Áudio</label>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileChange}
                          className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-600 text-[10px]">OU LINK DIRETO:</span>
                          <input
                            type="url"
                            value={form.audioUrl}
                            onChange={e => setForm({ ...form, audioUrl: e.target.value })}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      
                      {uploadProgress > 0 && (
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        disabled={loading}
                        type="submit"
                        className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? 'Processando...' : (
                          <>
                            {editingId ? <Check size={18} /> : <Upload size={18} />}
                            {editingId ? 'Salvar Alterações' : 'Publicar'}
                          </>
                        )}
                      </button>
                      
                      {editingId && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List Section */}
                <div className="p-6 bg-zinc-950/50 max-h-[500px] overflow-y-auto">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Lista de Episódios</h4>
                  <div className="space-y-3">
                    {episodes.map(ep => (
                      <div key={ep.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center justify-between group">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm font-medium text-white truncate">{ep.title}</h5>
                          <p className="text-[10px] text-zinc-500 truncate">{ep.description}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button 
                            onClick={() => startEdit(ep)}
                            className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(ep.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {episodes.length === 0 && (
                      <div className="text-center py-10 text-zinc-600">
                        <AlertCircle className="mx-auto mb-2 opacity-20" size={40} />
                        <p className="text-xs">Nenhum episódio encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
