export interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration?: number;
  createdAt: any; // Firestore Timestamp
  authorId: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'listener';
}
