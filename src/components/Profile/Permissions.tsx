import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  ShieldOff, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  CheckCircle2,
  Lock,
  Zap
} from 'lucide-react';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { cn } from '../../lib/utils';

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

const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
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

export default function Permissions({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setProfile(doc.data());
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleAutomation = async () => {
    if (!profile) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        automationActive: !profile.automationActive
      });
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleOfficialApi = async () => {
    if (!profile) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        officialApiConnected: !profile.officialApiConnected
      });
    } catch (err) {
      console.error("API Toggle error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const revokeAllAccess = async () => {
    if (!profile || !window.confirm("Are you sure you want to revoke all access? This will delete your profile data and stop all automations.")) return;
    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'users', profile.uid));
      await auth.currentUser?.delete();
    } catch (err) {
      console.error("Revoke error:", err);
      alert("Please re-authenticate to perform this sensitive action.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold mb-2">Account Settings</h2>
        <p className="text-white/50">Manage your profile and security settings.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Privacy & Security</h3>
                  <p className="text-sm text-white/40 mt-1">Your data is protected with AstraX Growth AI.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/2 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold text-white/60">
                <Lock className="w-4 h-4" />
                Data Protection
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-white/40">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Manual data entry mode active
                </li>
                <li className="flex items-center gap-3 text-sm text-white/40">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Secure LocalStorage persistence
                </li>
                <li className="flex items-center gap-3 text-sm text-white/40">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Encrypted Firestore storage
                </li>
              </ul>
            </div>
          </div>

          <div className="glass p-8 border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-red-500/20 rounded-2xl text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-400">Danger Zone</h3>
                <p className="text-sm text-red-400/60 mt-1">
                  Deleting your account will immediately remove all your growth data and history from AstraX.
                </p>
              </div>
            </div>

            <button 
              onClick={revokeAllAccess}
              disabled={updating}
              className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account & Data
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Growth Mode
            </h4>
            <p className="text-xs text-white/40 leading-relaxed">
              You are currently in Manual Entry Mode. This ensures 100% accuracy of your metrics as you track them daily.
            </p>
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                <span>Accuracy Level</span>
                <span className="text-green-400">100%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full w-full bg-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
