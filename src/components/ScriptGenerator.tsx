import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Loader2, Copy, Check, Zap } from 'lucide-react';
import { generateContent } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function ScriptGenerator() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Hype');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');
  const [viralScore, setViralScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setViralScore(null);
    try {
      const systemPrompt = `You are a professional content strategist and scriptwriter for YouTube and TikTok. 
      Create a high-engagement video script based on the topic and tone provided. 
      Include a hook, core content, and a call to action. 
      Format the output using Markdown.`;
      
      const userPrompt = `Generate a video script for the topic: "${topic}". The tone should be "${tone}".`;
      
      const result = await generateContent(userPrompt, systemPrompt);
      setScript(result);
      setViralScore(Math.floor(Math.random() * 40) + 60); // 60-100 range
    } catch (error) {
      console.error(error);
      setScript("Failed to generate script. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold mb-2">AI Script Generator</h2>
        <p className="text-white/50">Craft viral scripts in seconds with advanced AI.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Video Topic</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input-field w-full min-h-[120px] resize-none"
                placeholder="e.g. 10 Life Hacks for Productivity"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Tone</label>
              <div className="grid grid-cols-1 gap-2">
                {['Hype', 'Informative', 'Sarcastic', 'Emotional'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between ${
                      tone === t 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t}
                    {tone === t && <Sparkles className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Script
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass h-full min-h-[500px] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white/40 uppercase tracking-widest">Output</span>
                {viralScore && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 shadow-lg shadow-accent/5"
                  >
                    <Zap className="w-4 h-4 text-accent fill-current animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em] leading-none mb-0.5">Viral Meter</span>
                      <span className="text-lg font-black text-white leading-none">{viralScore}%</span>
                    </div>
                  </motion.div>
                )}
              </div>
              {script && (
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/60 hover:text-white"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="flex-1 p-8 overflow-y-auto prose prose-invert max-w-none">
              <AnimatePresence mode="wait">
                {script ? (
                  <motion.div
                    key="script"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ReactMarkdown>{script}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center text-white/20 space-y-4"
                  >
                    <div className="p-6 rounded-full bg-white/2 border border-white/5">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <p className="max-w-xs">Enter a topic and select a tone to generate your next viral script.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
