import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Mail, 
  Zap, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  MessageSquare,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'script', label: 'Script Generator', icon: FileText },
  { id: 'email', label: 'Email Writer', icon: Mail },
  { id: 'growth', label: '30-Day Growth Plan', icon: Calendar },
  { id: 'permissions', label: 'Settings', icon: ShieldCheck },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const user = auth.currentUser;
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedback.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'beta_feedback'), {
        uid: user.uid,
        email: user.email,
        suggestion: feedback,
        createdAt: serverTimestamp(),
      });
      setFeedback('');
      setShowFeedback(false);
      toast.success("Feedback sent! Thank you for helping us grow.", {
        style: {
          background: '#05070a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-64 h-screen glass border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 mb-10 px-2 relative">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap className="text-white w-6 h-6 fill-current" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            AstraX
          </h1>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest absolute -top-2 -right-2 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Beta
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-white")} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {isActive && (
                <motion.div layoutId="active-indicator">
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-4">
        <button 
          onClick={() => setShowFeedback(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-primary hover:bg-primary/5 rounded-xl transition-all text-sm font-medium"
        >
          <MessageSquare className="w-5 h-5" />
          Send Feedback
        </button>

        {user && (
          <div className="flex items-center gap-3 px-4 py-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-white/10" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <UserIcon className="w-4 h-4 text-white/40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.displayName || 'Creator'}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => signOut(auth)}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedback(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Beta Feedback</h3>
                <button onClick={() => setShowFeedback(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-white/50 leading-relaxed">
                Your feedback is crucial for the beta version. Let us know how we can improve AstraX for you.
              </p>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-field w-full min-h-[150px] resize-none"
                placeholder="What's on your mind?"
              />

              <button
                onClick={handleSendFeedback}
                disabled={sending || !feedback.trim()}
                className="btn-primary w-full py-4 flex items-center justify-center gap-3"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Feedback
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
