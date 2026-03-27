import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Send, Loader2, Copy, Check, DollarSign, Target, Building2 } from 'lucide-react';
import { generateContent } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function EmailWriter() {
  const [brandName, setBrandName] = useState('');
  const [amount, setAmount] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!brandName || !amount || !goal) return;
    setLoading(true);
    try {
      const systemPrompt = `You are a professional influencer manager and negotiation expert. 
      Write a professional, persuasive, and negotiation-heavy email reply to a brand deal offer. 
      The goal is to secure a better deal or confirm a high-value partnership. 
      Use a confident yet respectful tone. Format with Markdown.`;
      
      const userPrompt = `Generate a brand deal negotiation email for:
      Brand: ${brandName}
      Offered Amount: ${amount}
      Campaign Goal: ${goal}
      
      Make sure to emphasize the creator's value and ask for a higher budget or better terms.`;
      
      const result = await generateContent(userPrompt, systemPrompt);
      setEmail(result);
    } catch (error) {
      console.error(error);
      setEmail("Failed to generate email. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
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
        <h2 className="text-3xl font-bold mb-2">Auto-Email Writer</h2>
        <p className="text-white/50">Secure high-paying brand deals with AI-powered negotiations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Brand Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input 
                    type="text" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="input-field w-full pl-12"
                    placeholder="e.g. Nike"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Offered Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input 
                    type="text" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field w-full pl-12"
                    placeholder="e.g. $500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Campaign Goal</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input 
                    type="text" 
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="input-field w-full pl-12"
                    placeholder="e.g. Brand Awareness"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !brandName || !amount || !goal}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Generate Reply
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass h-full min-h-[500px] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
              <span className="text-sm font-medium text-white/40 uppercase tracking-widest">Email Draft</span>
              {email && (
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
                {email ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ReactMarkdown>{email}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center text-white/20 space-y-4"
                  >
                    <div className="p-6 rounded-full bg-white/2 border border-white/5">
                      <Mail className="w-12 h-12" />
                    </div>
                    <p className="max-w-xs">Fill in the brand details to generate a professional negotiation email.</p>
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
