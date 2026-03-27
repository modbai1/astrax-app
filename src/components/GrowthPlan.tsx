import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Lock, 
  ChevronRight, 
  Zap, 
  Brain, 
  User, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Sparkles,
  Instagram,
  Target,
  AlertCircle,
  Users,
  Trophy,
  Clock,
  FileText,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { doc, setDoc, onSnapshot, updateDoc, query, collection, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import toast from 'react-hot-toast';
import Premium from './Premium';

import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface DayCardProps {
  day: number;
  isLocked: boolean;
  isCompleted: boolean;
  content?: {
    idea: string;
    hooks: { shocking: string; curiosity: string; direct: string };
    hashtags: string[];
    strategy: string;
    dailyTip: string;
    successRate: number;
    time: string;
  };
  onClick: () => void;
}

const DayCard = ({ day, isLocked, isCompleted, content, onClick }: DayCardProps) => (
  <motion.button
    whileHover={isLocked ? {} : { scale: 1.02, y: -2 }}
    whileTap={isLocked ? {} : { scale: 0.98 }}
    onClick={onClick}
    className={`relative min-h-[320px] rounded-2xl p-6 flex flex-col gap-4 transition-all border text-left overflow-hidden group ${
      isCompleted 
        ? 'bg-green-500/10 border-green-500/30' 
        : isLocked 
          ? 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed' 
          : 'glass border-white/10 hover:border-primary/50 bg-white/5'
    }`}
  >
    {/* Mission Card Background Effect */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex justify-between items-start w-full relative z-10">
      <div className="flex flex-col">
        <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isCompleted ? 'text-green-400' : 'text-white/40'}`}>Mission {day}</span>
        {!isLocked && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[8px] font-black text-primary uppercase tracking-widest">Active</span>
          </div>
        )}
      </div>
      {isLocked ? (
        <div className="bg-white/10 p-1.5 rounded-lg">
          <Lock className="w-3 h-3 text-white/40" />
        </div>
      ) : isCompleted ? (
        <CheckCircle2 className="w-4 h-4 text-green-400" />
      ) : (
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Success Rate</span>
          <span className="text-xs font-black text-green-400">{content?.successRate || '??'}%</span>
        </div>
      )}
    </div>
    
    {isLocked ? (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-2 relative z-10">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <Lock className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] leading-relaxed">
          Upgrade to unlock <br />
          <span className="text-primary">Hyper-Growth Strategy</span>
        </p>
      </div>
    ) : (
      <div className="space-y-4 flex-1 relative z-10">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Objective
          </p>
          <p className="text-xs font-bold text-white/90 line-clamp-3 leading-relaxed">
            {content?.idea || 'Thinking of something viral...'}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
          <div className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Shocking</span>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-full bg-accent/40" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Curiosity</span>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-full bg-primary/40" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Direct</span>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-full bg-green-400/40" />
            </div>
          </div>
        </div>

        <div className="pt-2 mt-auto border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-white/30" />
            <span className="text-[10px] font-black text-white/40 tracking-widest">{content?.time || '18:00'}</span>
          </div>
          {!isCompleted && (
            <div className="flex items-center gap-1 text-primary">
              <span className="text-[8px] font-black uppercase tracking-widest">Deploy</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    )}
  </motion.button>
);

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
  // We don't throw here to avoid crashing the whole UI, but we log it for the agent
};

export default function GrowthPlan({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [manualInput, setManualInput] = useState({ 
    niche: '', 
    goal: '', 
    audience: '', 
    followerCount: '', 
    contentType: '',
    engagementRate: ''
  });
  const [isCheckingNiche, setIsCheckingNiche] = useState(false);
  const [setupView, setSetupView] = useState<'selection' | 'manual-form'>('manual-form');
  const [formStep, setFormStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const extractUsername = (url: string) => {
    try {
      const cleanUrl = url.trim().replace(/\/$/, "");
      const parts = cleanUrl.split("/");
      const username = parts[parts.length - 1].split("?")[0];
      return username;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setProfile(doc.data());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const unsubSettings = onSnapshot(doc(db, 'user_settings', user.uid), (doc) => {
      setSettings(doc.data());
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `user_settings/${user.uid}`);
      setLoading(false);
    });

    const logsQuery = query(
      collection(db, 'users', user.uid, 'daily_logs'),
      orderBy('date', 'desc'),
      limit(7)
    );

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDailyLogs(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/daily_logs`);
    });

    return () => {
      unsubProfile();
      unsubSettings();
      unsubLogs();
    };
  }, [user]);

  const handleDayClick = (day: number) => {
    const isFree = !profile?.subscriptionPlan || profile.subscriptionPlan === 'none';
    const isLocked = isFree && day > 3;

    if (isLocked) {
      setShowPlanModal(true);
      return;
    }

    if (!settings?.growthPlan) {
      toast.error("Please generate your plan first!");
      return;
    }

    const completedDays = settings.completedDays || [];
    const newCompletedDays = completedDays.includes(day)
      ? completedDays.filter((d: number) => d !== day)
      : [...completedDays, day];

    updateDoc(doc(db, 'user_settings', auth.currentUser!.uid), {
      completedDays: newCompletedDays
    });
  };

  const checkNiche = async () => {
    if (!manualInput.niche || !manualInput.followerCount) return;
    
    setIsCheckingNiche(true);
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY in .env.');
      }
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      const prompt = `The user's niche is "${manualInput.niche}". Is this niche clearly educational or clearly entertainment, or is it ambiguous? 
      Return JSON: { "isAmbiguous": boolean, "suggestedType": "Educational" | "Entertainment" | null }`;
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text);
      if (result.isAmbiguous) {
        setFormStep(3); // Go to follow-up step
      } else {
        setManualInput(prev => ({ ...prev, contentType: result.suggestedType || 'Educational' }));
        setFormStep(4); // Skip to Goal
      }
    } catch (err) {
      console.error("Niche check error:", err);
      setFormStep(3); // Default to asking if error
    } finally {
      setIsCheckingNiche(false);
    }
  };

  const startAnalysis = async (type: 'manual') => {
    let username = profile?.initialStats?.username || 'creator';
    let followers = manualInput.followerCount || profile?.currentStats?.followers || '0';
    let er = manualInput.engagementRate || '2';
    let niche = manualInput.niche || profile?.initialStats?.niche || 'Trending content';
    let avgViews = profile?.currentStats?.avgViews || 0;

    // Daily Check-in History Analysis
    const history = dailyLogs.map(log => ({
      date: log.date,
      followers: log.followers,
      views: log.views
    })).reverse();

    const previousLog = dailyLogs.length > 1 ? dailyLogs[1] : null;
    const prevFollowers = previousLog?.followers || profile?.initialStats?.followers || followers;
    const prevViews = previousLog?.views || profile?.initialStats?.avgViews || avgViews;

    setIsAnalyzing(true);
    setAnalysisStep(1);

    try {
      const steps = [
        `Analyzing @${username} trends...`,
        `Optimizing hooks for ${manualInput.goal}...`,
        "Finalizing 30-day calendar..."
      ];

      // AI Generation Logic
      if (!GEMINI_API_KEY) {
        throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY in .env.');
      }
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const model = "gemini-3.1-pro-preview";
      
      const prompt = `You are the 'AstraX Growth AI', a highly intelligent and empathetic strategist for Instagram creators, especially those focusing on Shayari, Devotional content, or unique niches. Your primary goal is to analyze user-provided daily metrics and generate actionable, 30-day personalized growth plans.

INPUT DATA:
- @username: @${username}
- Current_Followers: ${followers}
- Previous_Followers: ${prevFollowers}
- Avg_Views_Last_15_Reels: ${avgViews}
- Previous_Avg_Views: ${prevViews}
- User_Content_Niche: ${niche}
- Daily_Check_In_History: ${JSON.stringify(history)}

CORE ANALYSIS LOGIC:
1. Calculate Daily_Follower_Growth and Daily_View_Growth.
2. Calculate 7-day growth rates for both.
3. Apply Decision Tree:
   A. LOW Follower Growth (< 5/day) & HIGH View Growth (> 10% increase): Focus on Conversion & Profile Optimization.
   B. HIGH Follower Growth (> 10/day) & LOW View Growth (< 5% increase): Focus on Reach & Hook Optimization.
   C. BOTH LOW: Re-evaluate content strategy, experiment, and build consistency.
   D. BOTH HIGH: Scale up, collaborate, and build community.
   E. History Analysis: Look for dips (e.g., Sundays) and suggest specific optimizations.

REQUIREMENTS FOR THE OUTPUT:
- Language: Hinglish (Hindi + English). Friendly, encouraging, slightly devotional tone.
- "greeting": A personalized greeting like "Jai Shri Ram, @username! Chaliye, aapki growth journey ko naya mod dete hain."
- "summary": A concise summary of their current performance based on the analysis.
- "recommendations": 3-5 actionable recommendations for the NEXT 7 DAYS based on the logic above.
- "plan": A 30-day array where each day has:
  - "day": Day number.
  - "idea": A specific, viral content topic or reel idea.
  - "hooks": An object with keys "shocking", "curiosity", "direct".
  - "hashtags": 5-7 niche-specific hashtags.
  - "strategy": Why this specific idea works for their niche/phase.
  - "dailyTip": A specific, actionable tip for the algorithm.
  - "successRate": A predicted success percentage (number between 70-98).
  - "time": Optimized posting time.

Return ONLY a JSON object.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              greeting: { type: Type.STRING },
              summary: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              plan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.NUMBER },
                    idea: { type: Type.STRING },
                    hooks: { 
                      type: Type.OBJECT,
                      properties: {
                        shocking: { type: Type.STRING },
                        curiosity: { type: Type.STRING },
                        direct: { type: Type.STRING }
                      },
                      required: ["shocking", "curiosity", "direct"]
                    },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    strategy: { type: Type.STRING },
                    dailyTip: { type: Type.STRING },
                    successRate: { type: Type.NUMBER },
                    time: { type: Type.STRING }
                  },
                  required: ["day", "idea", "hooks", "hashtags", "strategy", "dailyTip", "successRate", "time"]
                }
              }
            },
            required: ["greeting", "summary", "recommendations", "plan"]
          }
        }
      });

      const result = JSON.parse(response.text);

      for (let i = 0; i < steps.length; i++) {
        setAnalysisStep(i + 1);
        await new Promise(r => setTimeout(r, 1500));
      }

      await setDoc(doc(db, 'user_settings', auth.currentUser!.uid), {
        growthPlan: result.plan,
        aiGreeting: result.greeting,
        aiSummary: result.summary,
        aiRecommendations: result.recommendations,
        niche: manualInput.niche,
        goal: manualInput.goal,
        audience: manualInput.audience,
        followerCount: manualInput.followerCount,
        engagementRate: manualInput.engagementRate,
        contentType: manualInput.contentType,
        igHandle: username,
        completedDays: [],
        updatedAt: new Date()
      }, { merge: true });

      setIsAnalyzing(false);
      toast.success("Growth Plan Generated!");
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Failed to generate plan. Please try again.");
      setIsAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const progress = settings?.growthPlan 
    ? (settings.completedDays?.length || 0) / 30 * 100 
    : 0;

  const isFree = !profile?.subscriptionPlan || profile.subscriptionPlan === 'none';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black mb-2 flex items-center gap-3 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent tracking-tighter">
            30-Day Growth Plan
            <Sparkles className="w-8 h-8 text-accent fill-current animate-pulse" />
          </h1>
          <p className="text-lg text-white/50 font-medium">Your personalized roadmap to viral success.</p>
        </div>

        {settings?.growthPlan && (
          <div className="w-full md:w-96 glass p-6 border-primary/20 bg-primary/5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-2xl rounded-full group-hover:bg-primary/20 transition-all" />
            <div className="flex justify-between text-sm mb-3 relative z-10">
              <span className="text-white/40 font-black uppercase tracking-widest text-[10px]">Goal Progress</span>
              <span className="text-primary font-black">{Math.round(progress)}%</span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_20px_rgba(99,102,241,0.6)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!settings?.growthPlan ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {isAnalyzing ? (
              <div className="glass p-16 text-center max-w-2xl mx-auto border-primary/30 bg-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className="relative w-32 h-32 mx-auto mb-10">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-primary/10 border-t-primary rounded-full"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 m-auto w-14 h-14 text-primary"
                  >
                    <Brain className="w-full h-full" />
                  </motion.div>
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">Crafting Your Strategy</h3>
                <p className="text-white/50 mb-10 h-6 italic text-lg">
                  {[
                    `Analyzing trends in ${manualInput.niche || 'your niche'}...`,
                    `Optimizing hooks for ${manualInput.goal || 'viral growth'}...`,
                    "Finalizing 30-day calendar..."
                  ][analysisStep - 1]}
                </p>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysisStep / 3) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="glass p-10 border-white/10 bg-white/5">
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(step => (
                        <div 
                          key={step}
                          className={`h-1.5 w-12 rounded-full transition-all duration-500 ${
                            formStep >= step ? 'bg-primary' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Step {formStep} of 5</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {formStep === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                          <Trophy className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">The Discovery</h3>
                        <p className="text-white/50 text-lg">Tell us about your niche and current reach.</p>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Your Niche</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Tech, Fashion, Food, Fitness"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl focus:outline-none focus:border-primary/50 transition-all"
                              value={manualInput.niche}
                              onChange={e => setManualInput({...manualInput, niche: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Current Followers</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 500, 10000"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl focus:outline-none focus:border-primary/50 transition-all"
                              value={manualInput.followerCount}
                              onChange={e => setManualInput({...manualInput, followerCount: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Engagement Rate (%)</label>
                            <input 
                              type="number" 
                              step="0.1"
                              placeholder="e.g. 2.5"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl focus:outline-none focus:border-primary/50 transition-all"
                              value={manualInput.engagementRate}
                              onChange={e => setManualInput({...manualInput, engagementRate: e.target.value})}
                            />
                            <p className="text-[10px] text-white/30 mt-1 italic">Average likes/comments divided by followers.</p>
                          </div>
                        </div>

                        <button 
                          onClick={checkNiche}
                          disabled={!manualInput.niche || !manualInput.followerCount || isCheckingNiche}
                          className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {isCheckingNiche ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              AI is Thinking...
                            </>
                          ) : (
                            <>
                              Analyze Niche
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}

                    {formStep === 2 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                        <p className="text-white/50">AI is analyzing your niche...</p>
                      </div>
                    )}

                    {formStep === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                          <Zap className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">Content Type?</h3>
                        <p className="text-white/50 text-lg">Is your content more educational or entertainment based?</p>
                        <div className="grid grid-cols-2 gap-4">
                          {['Educational', 'Entertainment'].map(type => (
                            <button
                              key={type}
                              onClick={() => setManualInput({...manualInput, contentType: type})}
                              className={`p-6 rounded-2xl border transition-all text-lg font-bold ${
                                manualInput.contentType === type 
                                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                  : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setFormStep(2)}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => setFormStep(4)}
                            disabled={!manualInput.contentType}
                            className="flex-[2] bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Next Step
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {formStep === 4 && (
                      <motion.div 
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                          <Target className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">What is your 30-Day Goal?</h3>
                        <p className="text-white/50 text-lg">What do you want to achieve this month?</p>
                        <input 
                          type="text" 
                          placeholder="e.g. Get 1k followers, Sell a Course, Go Viral"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl focus:outline-none focus:border-accent/50 transition-all"
                          value={manualInput.goal}
                          onChange={e => setManualInput({...manualInput, goal: e.target.value})}
                          autoFocus
                        />
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setFormStep(3)}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => setFormStep(5)}
                            disabled={!manualInput.goal}
                            className="flex-[2] bg-accent text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-accent/20 hover:shadow-accent/40 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Next Step
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {formStep === 5 && (
                      <motion.div 
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                          <Users className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">Describe your Audience</h3>
                        <p className="text-white/50 text-lg">Who are you creating content for?</p>
                        <textarea 
                          placeholder="e.g. Students, Entrepreneurs, Busy Moms..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xl focus:outline-none focus:border-white/30 transition-all h-32 resize-none"
                          value={manualInput.audience}
                          onChange={e => setManualInput({...manualInput, audience: e.target.value})}
                          autoFocus
                        />
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setFormStep(4)}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => startAnalysis('manual')}
                            disabled={!manualInput.audience}
                            className="flex-[2] bg-gradient-to-r from-primary to-accent text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Generate My Plan
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            {/* AstraX Growth AI Summary */}
            <div className="glass p-8 border-primary/30 bg-primary/5 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-white">AstraX Growth AI</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Personal Strategist</p>
                  </div>
                </div>
                
                <h4 className="text-2xl font-bold text-white mb-4 leading-tight">
                  {settings.aiGreeting || `Jai Shri Ram, @${settings.igHandle || 'Creator'}! Chaliye, aapki growth journey ko naya mod dete hain.`}
                </h4>
                
                <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="text-sm text-white/70 leading-relaxed italic">
                      {settings.aiSummary || "Analyzing your recent performance to optimize your strategy..."}
                    </p>
                  </div>
                  
                  {settings.aiRecommendations && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Next 7 Days Action Plan</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {settings.aiRecommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="mt-1">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            </div>
                            <p className="text-xs text-white/80 font-medium leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">AstraX Growth AI aapke saath hai!</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Live Analysis Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass p-8 border-primary/20 bg-primary/5">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2">Account Status</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    {Number(settings.followerCount) < 100 ? "👻" : Number(settings.engagementRate) < 1 ? "💀" : "🚀"}
                  </div>
                  <p className="text-xl font-black tracking-tight">
                    {Number(settings.followerCount) < 100 
                      ? "Ghost Mode" 
                      : Number(settings.engagementRate) < 1 
                        ? "CPR Phase" 
                        : "Active Growth"}
                  </p>
                </div>
                <p className="text-[10px] text-white/30 mt-2 italic">
                  {Number(settings.followerCount) < 100 
                    ? "Let's get you to your first 100!" 
                    : Number(settings.engagementRate) < 1 
                      ? "Algorithm reset in progress." 
                      : "Optimizing for viral reach."}
                </p>
              </div>
              <div className="glass p-8 border-primary/20 bg-primary/5">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2">Target Niche</p>
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-primary" />
                  <p className="text-2xl font-black tracking-tight">{settings.niche}</p>
                </div>
              </div>
              <div className="glass p-8 border-accent/20 bg-accent/5">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2">30-Day Goal</p>
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-accent" />
                  <p className="text-2xl font-black tracking-tight">{settings.goal}</p>
                </div>
              </div>
              <div className="glass p-8 border-white/10 bg-white/5">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2">
                  {Number(settings.followerCount) < 100 ? "Viral Hook of the Day" : "Audience"}
                </p>
                <div className="flex items-center gap-3">
                  {Number(settings.followerCount) < 100 ? (
                    <>
                      <Zap className="w-6 h-6 text-accent" />
                      <p className="text-sm font-bold italic text-white/80">
                        "{settings.growthPlan[settings.completedDays?.length || 0]?.hooks?.shocking || 'Loading...'}"
                      </p>
                    </>
                  ) : (
                    <>
                      <Users className="w-6 h-6 text-white/40" />
                      <p className="text-2xl font-black tracking-tight">{settings.audience}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Algorithm Tip */}
            <div className="glass p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <Instagram className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">Mastering the Algorithm</h3>
                </div>
                <p className="text-xl font-bold text-white/90 mb-2">
                  {settings.growthPlan[settings.completedDays?.length || 0]?.dailyTip || "Reply to all comments in the first 30 mins to boost initial reach."}
                </p>
                <p className="text-sm text-white/40 italic">Today's algorithm hack for your niche.</p>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {settings.growthPlan?.map((day: any) => (
                <DayCard 
                  key={day.day}
                  day={day.day}
                  content={day}
                  isLocked={isFree && day.day > 3}
                  isCompleted={settings.completedDays?.includes(day.day)}
                  onClick={() => {
                    if (isFree && day.day > 3) {
                      setShowPlanModal(true);
                    } else {
                      setSelectedDay(day);
                    }
                  }}
                />
              ))}
            </div>

            {/* Growth Guarantee Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass p-8 border-green-500/30 bg-green-500/5 text-center relative overflow-hidden"
            >
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-green-500/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-green-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Growth Guarantee
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tight">50% Engagement Boost</h2>
                <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
                  This plan is designed to increase your engagement by <span className="text-green-400 font-bold">50%</span> if followed strictly. 
                  Consistency is the key to the Instagram algorithm.
                </p>
              </div>
            </motion.div>

            <div className="flex justify-center pt-10">
              <button 
                onClick={() => updateDoc(doc(db, 'user_settings', auth.currentUser!.uid), { growthPlan: null })}
                className="text-white/20 hover:text-white/50 text-xs transition-colors flex items-center gap-2 font-bold uppercase tracking-widest"
              >
                <AlertCircle className="w-4 h-4" />
                Reset Strategy & Re-analyze
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass border-white/10 p-8 md:p-12 overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedDay(null)}
                className="absolute top-6 right-6 p-3 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-primary/20 p-4 rounded-2xl">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Day {selectedDay.day}</p>
                  <h3 className="text-3xl font-black tracking-tight">Daily Strategy</h3>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white/90">Viral Idea</h4>
                  </div>
                  <p className="text-lg text-white/70 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10">
                    {selectedDay.idea}
                  </p>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-accent" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white/90">Viral Hooks</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Hook A: Shocking</p>
                      <p className="text-sm italic text-white/90">"{selectedDay.hooks.shocking}"</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Hook B: Curiosity</p>
                      <p className="text-sm italic text-white/90">"{selectedDay.hooks.curiosity}"</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Hook C: Direct</p>
                      <p className="text-sm italic text-white/90">"{selectedDay.hooks.direct}"</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-green-400" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white/90">Growth Strategy</h4>
                  </div>
                  <p className="text-white/60 leading-relaxed">
                    {selectedDay.strategy}
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary">Daily Tip</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {selectedDay.dailyTip}
                    </p>
                  </section>

                  <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-white/40" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Best Time</h4>
                    </div>
                    <p className="text-xl font-black text-white">
                      {selectedDay.time}
                    </p>
                  </section>
                </div>

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white/90">Trending Hashtags</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDay.hashtags?.map((tag: string, i: number) => (
                      <span key={i} className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold text-white/40 border border-white/10">
                        #{tag.replace('#', '')}
                      </span>
                    )) || (
                      <p className="text-white/40 text-sm italic">No hashtags generated.</p>
                    )}
                  </div>
                </section>

                <button 
                  onClick={() => {
                    const completedDays = settings.completedDays || [];
                    const newCompletedDays = completedDays.includes(selectedDay.day)
                      ? completedDays.filter((d: number) => d !== selectedDay.day)
                      : [...completedDays, selectedDay.day];

                    updateDoc(doc(db, 'user_settings', auth.currentUser!.uid), {
                      completedDays: newCompletedDays
                    });
                    setSelectedDay(null);
                    toast.success(completedDays.includes(selectedDay.day) ? "Day marked as incomplete" : "Day marked as complete!");
                  }}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                    settings.completedDays?.includes(selectedDay.day)
                      ? 'bg-white/10 text-white/40 hover:bg-white/20'
                      : 'bg-green-500 text-white shadow-xl shadow-green-500/20 hover:shadow-green-500/40'
                  }`}
                >
                  {settings.completedDays?.includes(selectedDay.day) ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Mark as Incomplete
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Complete Task
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlanModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto glass border-white/10 p-10"
            >
              <button 
                onClick={() => setShowPlanModal(false)}
                className="absolute top-6 right-6 p-3 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white"
              >
                ✕
              </button>
              <Premium />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
