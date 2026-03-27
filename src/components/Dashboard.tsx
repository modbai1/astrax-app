import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Eye, 
  TrendingUp, 
  Zap, 
  Info, 
  RefreshCw, 
  Instagram,
  ShieldCheck,
  Activity,
  BarChart3,
  Heart,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import toast from 'react-hot-toast';

const getDemoData = (baseViews: number) => [
  { name: 'Day 1', views: Math.floor(baseViews * 0.8), followers: 100 },
  { name: 'Day 2', views: Math.floor(baseViews * 0.9), followers: 110 },
  { name: 'Day 3', views: Math.floor(baseViews * 0.75), followers: 115 },
  { name: 'Day 4', views: Math.floor(baseViews * 1.1), followers: 130 },
  { name: 'Day 5', views: Math.floor(baseViews * 0.95), followers: 135 },
  { name: 'Day 6', views: Math.floor(baseViews * 1.2), followers: 150 },
  { name: 'Day 7', views: Math.floor(baseViews * 1.4), followers: 180 },
];

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

export default function Dashboard({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Daily Log State
  const [logFollowers, setLogFollowers] = useState('');
  const [logViews, setLogViews] = useState('');
  
  // Manual Setup State
  const [manualUsername, setManualUsername] = useState('');
  const [manualFollowers, setManualFollowers] = useState('');
  const [manualAvgViews, setManualAvgViews] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      const data = doc.data();
      setProfile(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const logsQuery = query(
      collection(db, 'users', user.uid, 'daily_logs'),
      orderBy('date', 'asc'),
      limit(30)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDailyLogs(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/daily_logs`);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeLogs();
    };
  }, [user]);

  const handleDailyLogSubmit = async () => {
    if (!logFollowers || !logViews) {
      toast.error('Bhai, aaj ka data toh dalo!');
      return;
    }

    setIsSyncing(true);
    try {
      if (!user) return;

      const followers = parseInt(logFollowers);
      const views = parseInt(logViews);
      const today = new Date().toISOString().split('T')[0];

      await setDoc(doc(db, 'users', user.uid, 'daily_logs', today), {
        uid: user.uid,
        date: today,
        followers,
        views,
        createdAt: serverTimestamp()
      });

      const updatedStats = {
        followers,
        avgViews: views,
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), {
        currentStats: updatedStats,
        "syncedData.followers": String(followers),
        "syncedData.avgReach": String(views),
        "syncedData.lastSync": new Date().toISOString()
      });

      // LocalStorage Persistence
      localStorage.setItem(`astrax_stats_${user.uid}`, JSON.stringify(updatedStats));

      setShowLogModal(false);
      setLogFollowers('');
      setLogViews('');
      toast.success('Daily Log Updated! Keep Growing.');
    } catch (error: any) {
      toast.error('Error updating log: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSetup = async () => {
    if (!manualUsername || !manualFollowers || !manualAvgViews) {
      toast.error('Bhai, saari details dalo!');
      return;
    }

    setIsSyncing(true);
    try {
      if (!user) return;

      const fCount = parseInt(manualFollowers);
      const vCount = parseInt(manualAvgViews);
      const handle = manualUsername.replace('@', '');

      const initialStats = {
        followers: fCount,
        avgViews: vCount,
        username: handle,
        createdAt: new Date().toISOString()
      };

      const currentStats = {
        followers: fCount,
        avgViews: vCount,
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), {
        initialStats,
        currentStats,
        onboardingCompleted: true,
        syncedData: {
          username: handle,
          followers: String(fCount),
          avgReach: String(vCount),
          health: vCount > fCount ? 'Viral Potential' : fCount < 100 ? 'Newbie' : 'Good',
          growthProb: Math.min(99, Math.floor((vCount / (fCount || 1)) * 10 + 20)),
          lastSync: new Date().toISOString()
        }
      });

      // LocalStorage Persistence
      localStorage.setItem(`astrax_initial_${user.uid}`, JSON.stringify(initialStats));
      localStorage.setItem(`astrax_stats_${user.uid}`, JSON.stringify(currentStats));

      toast.success('Shubh Aarambh! Your journey starts now.');
    } catch (error: any) {
      toast.error('Error saving stats: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = useMemo(() => {
    if (profile?.syncedData) return profile.syncedData;
    return {
      followers: '0',
      avgReach: '0',
      health: 'N/A',
      growthProb: 0
    };
  }, [profile]);

  const chartData = useMemo(() => {
    if (dailyLogs.length > 0) {
      return dailyLogs.map(log => ({
        name: log.date.split('-').slice(1).join('/'),
        views: log.views,
        followers: log.followers
      }));
    }
    return getDemoData(1000);
  }, [dailyLogs]);

  const growthProof = useMemo(() => {
    if (!profile?.initialStats || !profile?.currentStats) return null;
    const start = profile.initialStats.followers;
    const current = profile.currentStats.followers;
    const growth = current - start;
    const percent = start > 0 ? ((growth / start) * 100).toFixed(0) : '0';
    return { start, current, growth, percent };
  }, [profile]);

  const hasLoggedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyLogs.some(log => log.date === today);
  }, [dailyLogs]);

  const isTrendUp = useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1].views >= chartData[0].views;
  }, [chartData]);

  const engagementScore = useMemo(() => {
    const followers = parseInt(stats.followers) || 1;
    const views = parseInt(stats.avgReach) || 0;
    const er = (views / followers) * 10; // Simplified ER for manual mode
    return Math.min(100, Math.floor(er * 5));
  }, [stats]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {!profile?.initialStats ? (
        <div className="max-w-2xl mx-auto py-12">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass p-12 border-orange-500/50 bg-orange-500/5 space-y-10 relative overflow-hidden"
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full" />
            
            <div className="text-center space-y-4 relative z-10">
              <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-500/30 shadow-lg shadow-orange-500/20">
                <Instagram className="text-orange-500 w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-white">Shubh Aarambh</h2>
              <p className="text-white/60 font-medium">Enter your current Instagram stats to begin your growth journey.</p>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 ml-2">Instagram Username</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-bold">@</span>
                  <input 
                    type="text"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                    placeholder="username"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-5 focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 ml-2">Current Followers</label>
                  <input 
                    type="number"
                    value={manualFollowers}
                    onChange={(e) => setManualFollowers(e.target.value)}
                    placeholder="e.g. 1250"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 ml-2">Avg Views (Last 15 Reels)</label>
                  <input 
                    type="number"
                    value={manualAvgViews}
                    onChange={(e) => setManualAvgViews(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleManualSetup}
              disabled={isSyncing}
              className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 group"
            >
              {isSyncing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Jai Shri Ram</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      ) : (
        <>
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
            AstraX Dashboard
            {profile?.initialStats && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Tracking</span>
              </div>
            )}
          </h2>
          <p className="text-white/50 font-medium">Manual input mode enabled. Track your growth journey daily.</p>
        </div>

        {profile?.initialStats && (
          <button 
            onClick={() => setShowLogModal(true)}
            className="btn-primary px-8 py-4 flex items-center gap-3 group relative overflow-hidden"
          >
            <RefreshCw className={`w-5 h-5 relative z-10 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="relative z-10 font-black uppercase tracking-widest text-sm">
              Daily Check-in
            </span>
          </button>
        )}
      </header>

      {/* Daily Check-in Alert */}
      {profile?.initialStats && !hasLoggedToday && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 border-accent/40 bg-accent/10 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-xl text-accent animate-bounce">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black uppercase tracking-tight">Daily Check-in Required!</h4>
              <p className="text-white/60 text-sm">Bhai, aaj kitne followers badhe? Aur kal ki reel pe kitne views aaye?</p>
            </div>
          </div>
          <button 
            onClick={() => setShowLogModal(true)}
            className="btn-primary bg-accent hover:bg-accent/80 border-accent/50 px-8 py-3 text-xs font-black uppercase tracking-widest"
          >
            Log Today's Stats
          </button>
        </motion.div>
      )}

      {/* Proof Dashboard Card */}
      {growthProof && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass p-8 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Success Proof</h3>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Started At</p>
                  <p className="text-3xl font-black">{growthProof.start}</p>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2 mb-2" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Currently At</p>
                  <p className="text-5xl font-black text-primary">{growthProof.current}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <span className="text-xs font-black text-green-400">+{growthProof.percent}% Growth</span>
                </div>
                <p className="text-xs text-white/40 font-medium italic">Verified by AstraX Engine</p>
              </div>
            </div>
          </div>

          <div className="glass p-8 border-white/10 bg-white/5 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-white/40" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Growth Journey</h3>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="followers" stroke="#00f2ff" fillOpacity={1} fill="url(#colorFollowers)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-8 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-primary/20 rounded-2xl text-primary group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Current Followers</p>
          <h4 className="text-4xl font-black tracking-tight relative z-10">{stats.followers}</h4>
        </div>

        <div className="glass p-8 border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent/5 blur-3xl rounded-full group-hover:bg-accent/10 transition-all" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-accent/20 rounded-2xl text-accent group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Avg Reel Reach</p>
          <h4 className="text-4xl font-black tracking-tight relative z-10">{stats.avgReach}</h4>
        </div>

        <div className="glass p-8 border-white/10 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/10 rounded-2xl text-white/60 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              stats.health === 'Good' ? 'bg-green-500 shadow-green-500/50' : stats.health === 'Dead' ? 'bg-red-500 shadow-red-500/50' : 'bg-yellow-500 shadow-yellow-500/50'
            }`} />
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Profile Health</p>
          <h4 className="text-4xl font-black tracking-tight relative z-10">{stats.health}</h4>
        </div>

        <div className="glass p-8 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-primary/20 rounded-2xl text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <BarChart3 className="w-6 h-6 text-white/10" />
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Growth Prob.</p>
          <h4 className="text-4xl font-black tracking-tight relative z-10">{stats.growthProb}%</h4>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-10 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight">View Trend</h3>
              <p className="text-xs text-white/40 font-medium mt-1">Tracking your viral momentum over time.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00ff00] shadow-[0_0_10px_#00ff00]" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Growth</span>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.1)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={15}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.1)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-15}
                  fontFamily="monospace"
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(5, 7, 10, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    fontSize: '12px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: isTrendUp ? '#00ff00' : '#ff0000', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke={isTrendUp ? "#00ff00" : "#ff0000"} 
                  strokeWidth={5}
                  dot={{ r: 4, fill: isTrendUp ? '#00ff00' : '#ff0000' }}
                  activeDot={{ r: 8, fill: isTrendUp ? '#00ff00' : '#ff0000', strokeWidth: 4, stroke: '#05070a' }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-10 border-primary/20 bg-primary/5 h-full flex flex-col justify-between group">
            <div className="relative">
              <div className="flex items-center gap-2 mb-8">
                <div className="bg-primary/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Viral Insight</h3>
              </div>
              <p className="text-2xl font-black text-white leading-tight mb-6">
                Your momentum is <span className={isTrendUp ? "text-green-400" : "text-red-400"}>
                  {isTrendUp ? "Accelerating" : "Slowing Down"}
                </span>.
              </p>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                {isTrendUp 
                  ? "The algorithm is picking up your recent content. Maintain this consistency to trigger a viral breakout."
                  : "Engagement has dipped slightly. Try a 'Controversial' or 'Opinionated' reel to force a reaction and reset the algorithm."}
              </p>
            </div>
            
            <div className="pt-10 border-t border-white/5">
              <div className="flex items-center gap-3 text-white/40 mb-6">
                <Heart className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Engagement Quality</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <p className="text-4xl font-black tracking-tight text-white">{engagementScore}<span className="text-sm text-white/20">/100</span></p>
                  <p className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md inline-block ${
                    engagementScore > 80 ? 'bg-green-400/10 text-green-400' : engagementScore > 50 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'
                  }`}>
                    {engagementScore > 80 ? 'Excellent' : engagementScore > 50 ? 'Average' : 'Low'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass p-10 space-y-8 border-accent/20 bg-black/40"
            >
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black tracking-tight">Daily Check-in</h3>
                <p className="text-white/60">Update your stats for today.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Total Followers Today</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 512"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent/50 transition-all"
                    value={logFollowers}
                    onChange={e => setLogFollowers(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Yesterday's Reel Views</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 2400"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent/50 transition-all"
                    value={logViews}
                    onChange={e => setLogViews(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDailyLogSubmit}
                  disabled={isSyncing}
                  className="btn-primary bg-accent hover:bg-accent/80 border-accent/50 py-5 font-black uppercase tracking-widest text-sm shadow-2xl shadow-accent/20"
                >
                  {isSyncing ? 'Saving...' : 'Save Today\'s Stats'}
                </button>
                <button 
                  onClick={() => setShowLogModal(false)}
                  className="py-4 rounded-xl font-bold text-white/20 hover:text-white/40 transition-all text-xs uppercase tracking-widest"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass p-8 flex items-start gap-6 bg-primary/5 border-primary/20 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <div className="p-3 bg-primary/20 rounded-2xl">
          <Info className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h4 className="text-lg font-black uppercase tracking-widest mb-2">Manual Mode Active</h4>
          <p className="text-sm text-white/50 leading-relaxed font-medium">
            You are currently in manual tracking mode. For best results, update your followers and reel views every 24 hours. AstraX will use this data to adapt your 30-day growth plan.
          </p>
        </div>
      </div>
      </>
      )}
    </motion.div>
  );
}
