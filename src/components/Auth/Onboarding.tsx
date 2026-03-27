import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  X,
  Loader2,
  Instagram,
  Users,
  Eye
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

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

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Manual Input State
  const [followers, setFollowers] = useState('');
  const [avgViews, setAvgViews] = useState('');
  const [username, setUsername] = useState('');

  const handleComplete = async () => {
    if (step === 1) {
      if (!consent) return;
      setStep(2);
      return;
    }

    if (!followers || !avgViews || !username) {
      toast.error('Bhai, saari details dalo!');
      return;
    }

    setLoading(true);
    try {
      const fCount = parseInt(followers);
      const vCount = parseInt(avgViews);
      const handle = username.replace('@', '');

      const initialStats = {
        followers: fCount,
        avgViews: vCount,
        username: handle,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        onboardingCompleted: true,
        legalConsent: true,
        automationActive: false,
        subscriptionPlan: 'none',
        createdAt: serverTimestamp(),
        initialStats,
        currentStats: {
          followers: fCount,
          avgViews: vCount,
          lastUpdated: new Date().toISOString()
        },
        syncedData: {
          username: handle,
          followers: String(fCount),
          avgReach: String(vCount),
          health: vCount > fCount ? 'Viral Potential' : fCount < 100 ? 'Newbie' : 'Good',
          growthProb: Math.min(99, Math.floor((vCount / (fCount || 1)) * 10 + 20)),
          lastSync: new Date().toISOString()
        }
      });

      // Create first daily log
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'users', user.uid, 'daily_logs', today), {
        uid: user.uid,
        date: today,
        followers: fCount,
        views: vCount,
        createdAt: serverTimestamp()
      });

      // LocalStorage Persistence
      localStorage.setItem(`astrax_initial_${user.uid}`, JSON.stringify(initialStats));
      localStorage.setItem(`astrax_stats_${user.uid}`, JSON.stringify({
        followers: fCount,
        avgViews: vCount,
        lastUpdated: new Date().toISOString()
      }));

      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full glass p-10 space-y-8"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                  <ShieldCheck className="text-primary w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Welcome to AstraX</h2>
                <p className="text-white/50">Let's set up your secure automation environment.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold">Account Verified</h4>
                    <p className="text-sm text-white/40">Your identity has been securely confirmed via {user.providerData[0]?.providerId}.</p>
                  </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="relative mt-1">
                      <input 
                        type="checkbox" 
                        id="consent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="w-6 h-6 rounded-lg bg-white/10 border-white/20 text-primary focus:ring-primary transition-all cursor-pointer"
                      />
                    </div>
                    <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer select-none">
                      <span className="font-bold text-white block mb-1">Legal Consent</span>
                      I allow AstraX to access my public profile and manage DMs based on my specific automation triggers.
                    </label>
                  </div>

                  <button 
                    onClick={() => setShowTerms(true)}
                    className="text-primary text-sm font-bold flex items-center gap-2 hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    Read Full Terms & Privacy Policy
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                  <Instagram className="text-primary w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Setup Your Profile</h2>
                <p className="text-white/50">Enter your current stats to start tracking growth.</p>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 ml-2">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold">@</span>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 focus:border-orange-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 ml-2">
                      Followers
                    </label>
                    <input 
                      type="number"
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-orange-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 ml-2">
                      Avg. Views
                    </label>
                    <input 
                      type="number"
                      value={avgViews}
                      onChange={(e) => setAvgViews(e.target.value)}
                      placeholder="Last 15 Reels"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-orange-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={handleComplete}
          disabled={(step === 1 && !consent) || loading}
          className={`w-full py-5 text-lg flex items-center justify-center gap-3 shadow-2xl transition-all ${
            step === 2 
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30' 
              : 'btn-primary shadow-primary/30'
          }`}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span className="font-black uppercase tracking-widest">
                {step === 1 ? 'Next Step' : 'Shubh Aarambh'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass p-10 max-h-[80vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowTerms(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-bold mb-8">Detailed Privacy Clauses</h3>
              <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/60">
                <section>
                  <h4 className="text-white font-bold mb-2">1. Data Access</h4>
                  <p>AstraX requests access to your public profile information, including your username, profile picture, and follower count, to personalize your dashboard and provide accurate engagement analytics.</p>
                </section>
                <section>
                  <h4 className="text-white font-bold mb-2">2. DM Automation</h4>
                  <p>By enabling automation, you authorize AstraX to send direct messages on your behalf. These messages are strictly triggered by your predefined rules (e.g., replying to specific keywords or welcoming new followers).</p>
                </section>
                <section>
                  <h4 className="text-white font-bold mb-2">3. Security Guardrails</h4>
                  <p>AstraX implements strict rate-limiting and content filtering to ensure your account remains compliant with platform guidelines. You retain full control and can revoke all permissions at any time via the user profile settings.</p>
                </section>
                <section>
                  <h4 className="text-white font-bold mb-2">4. Data Retention</h4>
                  <p>We do not store your private messages. Automation logs are kept for 30 days to provide performance reports and are then permanently deleted.</p>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
