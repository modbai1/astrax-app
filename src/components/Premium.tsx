import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Zap, Star, Shield, Globe, Clock, Loader2 } from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import toast from 'react-hot-toast';

interface PlanCardProps {
  id: string;
  name: string;
  price: string;
  features: string[];
  icon: any;
  isPopular?: boolean;
  onSelect: (id: string) => void;
  loading: boolean;
}

const PlanCard = ({ id, name, price, features, icon: Icon, isPopular, onSelect, loading }: PlanCardProps) => (
  <div className={`glass p-8 relative overflow-hidden flex flex-col h-full transition-all duration-500 group ${isPopular ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-white/5 hover:border-white/20'}`}>
    {isPopular && (
      <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20 z-10">
        Most Popular
      </div>
    )}
    
    <div className="mb-8 relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isPopular ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-white/40 text-sm font-bold uppercase tracking-widest">{name}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black tracking-tighter">{price}</span>
        {price !== 'Free' && <span className="text-white/40 text-sm font-medium">/month</span>}
      </div>
    </div>

    <ul className="space-y-4 mb-10 flex-1 relative z-10">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-white/70 group-hover:text-white transition-colors">
          <div className={`mt-1 rounded-full p-0.5 ${isPopular ? 'bg-primary/20' : 'bg-white/10'}`}>
            <Check className={`w-3 h-3 ${isPopular ? 'text-primary' : 'text-white/40'}`} />
          </div>
          {feature}
        </li>
      ))}
    </ul>

    <button 
      onClick={() => onSelect(id)}
      disabled={loading}
      className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10 ${
        isPopular 
          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-xl shadow-primary/20 hover:shadow-primary/40' 
          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
      }`}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Select ${name}`}
    </button>

    {/* Background Decorative Elements */}
    {isPopular && (
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
    )}
  </div>
);

export default function Premium() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(planId);
    try {
      // Update both users and user_settings collections
      const userRef = doc(db, 'users', user.uid);
      const settingsRef = doc(db, 'user_settings', user.uid);

      await Promise.all([
        updateDoc(userRef, { subscriptionPlan: planId }),
        setDoc(settingsRef, { subscriptionPlan: planId, updatedAt: new Date() }, { merge: true })
      ]);

      toast.success(`Welcome to ${planId.toUpperCase()}!`, {
        style: { background: '#050505', color: '#fff', border: '1px solid rgba(99,102,241,0.2)' }
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update plan.");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 'Free',
      icon: Clock,
      features: ["Limited AI Scripts", "Basic Analytics", "Standard Templates", "No Automation"]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹499',
      icon: Zap,
      features: ["Unlimited AI Scripts", "Manual Growth Plan", "Algorithm Insights", "Priority Support"]
    },
    {
      id: 'elite',
      name: 'Elite',
      price: '₹999',
      icon: Star,
      isPopular: true,
      features: ["Full AI Profile Analysis", "Auto-DM Automation", "1-on-1 AI Strategy", "Global Brand Database", "Early Beta Access"]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto py-12"
    >
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-6xl font-black mb-6 tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent"
        >
          Choose Your Plan
        </motion.h2>
        <p className="text-xl text-white/50 max-w-2xl mx-auto font-medium">
          Scale your creator career with the right tools for your journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={plan.isPopular ? 'relative group' : 'group'}>
            {plan.isPopular && (
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse" />
            )}
            <PlanCard 
              {...plan}
              onSelect={handleSelectPlan}
              loading={loading === plan.id}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
