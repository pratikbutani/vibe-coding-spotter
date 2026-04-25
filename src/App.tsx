/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Dumbbell, Activity, CheckCircle2, Copy, History, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
// We use the non-null assertion or fallback for safety, though AI Studio injects it
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface AnalysisResult {
  vibe_score: number;
  trainer_reaction: string;
  missing_weights: string[];
  the_perfect_rep: string;
}

interface HistoryItem {
  id: string;
  prompt: string;
  score: number;
  timestamp: number;
}

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_spotter_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('vibe_spotter_history', JSON.stringify(history));
  }, [history]);

  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Target Challenge: Evaluate this user prompt.\n\n"${prompt}"`,
        config: {
          systemInstruction: `Role: You are the "Senior Vibe-Coding Spotter," an elite Software Architect who acts like a highly motivational, slightly aggressive desi gym trainer.

Task: Your job is to grade and correct the "prompts" that junior developers write to generate code (e.g., for Flutter MVPs or Web Apps). You are NOT generating the code for them; you are grading their prompt.

Evaluation Criteria: A perfect prompt (100/100) must include:
Tech Stack: (e.g., "Use Flutter and Dart")
Architecture/State: (e.g., "Use Provider for state management")
UI/UX Details: (e.g., "Responsive layout, dark mode, Material 3")
Data: (e.g., "Use dummy JSON data for the list")

Tone: Speak in a high-energy mix of English and Hindi (Hinglish). Use gym metaphors mixed with developer terminology (e.g., "Lifting boilerplate," "Mental deadlifting," "Form check," "Adding plates to the server"). Be harsh on lazy, one-sentence prompts. Praise structured, architectural thinking.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vibe_score: { type: Type.INTEGER, description: "Integer between 0 and 100" },
              trainer_reaction: { type: Type.STRING, description: "A quick 1-2 sentence Hinglish reaction to their prompt quality." },
              missing_weights: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of 2-3 technical constraints they forgot to mention (e.g., State management, responsiveness)"
              },
              the_perfect_rep: { type: Type.STRING, description: "Rewrite their prompt into a highly structured, professional-grade prompt that an AI agent could actually use to build production-ready code." }
            },
            required: ["vibe_score", "trainer_reaction", "missing_weights", "the_perfect_rep"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim()) as AnalysisResult;
        setResult(parsed);
        
        // Add to history
        setHistory(prev => {
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            prompt: prompt,
            score: parsed.vibe_score,
            timestamp: Date.now()
          };
          // Keep only the latest 20 items to avoid bloating
          const updated = [newItem, ...prev.filter(item => item.prompt !== prompt)].slice(0, 20);
          return updated;
        });
      } else {
        throw new Error("No response from AI trainer.");
      }

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Bhai, server thak gaya. Phir se try kar!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-neon selection:text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-12 xl:gap-20">
        
        {/* Left Column: Input area */}
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="font-display uppercase text-5xl md:text-7xl leading-none tracking-tight flex flex-col">
              <span className="text-neon block drop-shadow-[0_0_15px_rgba(204,255,0,0.3)]">Senior</span> 
              <span className="text-white">Vibe-Coding</span> 
              <span className="text-white">Spotter</span>
            </h1>
            <p className="mt-6 text-neutral-400 text-lg leading-relaxed max-w-md">
              Drop your weak, single-sentence prompt below and let the desi architect grade your form. No half-reps allowed.
            </p>
          </div>

          <div className="relative group mt-4">
            <div className="absolute -inset-0.5 bg-neon/20 rounded-xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-300"></div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Make a profile app with a picture in the middle and a list of friends below."
              className="relative w-full h-56 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-neon focus:border-transparent resize-none placeholder:text-neutral-600 shadow-2xl transition-all"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !prompt.trim()}
            className="w-full sm:w-auto relative overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-5 bg-neon text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#b0d900] disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all text-lg"
          >
            {isAnalyzing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Activity className="w-6 h-6" />
                </motion.div>
                Spotting...
              </>
            ) : (
              <>
                <Dumbbell className="w-6 h-6" />
                Grade My Form!
              </>
            )}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 rounded-xl text-sm font-medium"
            >
              <span className="font-bold mr-2">Error:</span> {error}
            </motion.div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-8 space-y-4 border-t border-neutral-800/80 mt-4"
            >
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-xl font-display uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Sets
                </h3>
                <button 
                  onClick={() => setHistory([])}
                  className="p-2 text-neutral-600 hover:text-red-400 hover:bg-neutral-800/50 rounded-lg transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        setPrompt(item.prompt);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group p-4 bg-neutral-900/30 hover:bg-neutral-800/60 border border-neutral-800 hover:border-neutral-700/80 rounded-xl cursor-pointer transition-all flex items-start gap-4"
                    >
                      <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-display text-lg
                        ${item.score >= 80 ? 'bg-neon/10 text-neon' : item.score >= 40 ? 'bg-yellow-400/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                        {item.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-300 text-sm line-clamp-2 leading-relaxed group-hover:text-white transition-colors">{item.prompt}</p>
                        <p className="text-neutral-600 text-xs mt-1.5 flex items-center gap-2">
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </p>
                      </div>
                      <ArrowRight className="shrink-0 w-5 h-5 text-neutral-600 opacity-0 group-hover:opacity-100 transition-all rotate-0 group-hover:-rotate-45" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }`}</style>
            </motion.div>
          )}

        </div>

        {/* Right Column: Result area */}
        <div className="mt-16 lg:mt-0 relative">
          {result ? (
            <ResultCard result={result} />
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-neutral-500 bg-neutral-900/20">
              <Dumbbell className="w-16 h-16 mb-6 opacity-20" />
              <h3 className="font-display uppercase text-2xl mb-2 text-neutral-400">Waiting for your set</h3>
              <p className="text-base max-w-[250px]">Paste your prompt to see if you survive the form check.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const ResultCard = ({ result }: { result: AnalysisResult }) => {
  const [copied, setCopied] = useState(false);
  const isGood = result.vibe_score >= 80;
  const isMid = result.vibe_score >= 40 && result.vibe_score < 80;
  const colorClass = isGood ? 'text-neon' : isMid ? 'text-yellow-400' : 'text-red-500';
  const bgColorClass = isGood ? 'bg-neon/10' : isMid ? 'bg-yellow-400/10' : 'bg-red-500/10';
  const borderColorClass = isGood ? 'border-neon/30' : isMid ? 'border-yellow-400/30' : 'border-red-500/30';
  const scoreIcon = isGood ? '🚀' : isMid ? '💪' : '🤡';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.the_perfect_rep);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col space-y-6"
    >
      {/* Top Banner: Score & Reaction */}
      <div className={`p-6 md:p-8 rounded-2xl border ${borderColorClass} ${bgColorClass} relative overflow-hidden backdrop-blur-sm shadow-xl`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10 text-center sm:text-left">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative">
              <span className={`font-display text-8xl md:text-[110px] leading-none ${colorClass} drop-shadow-md`}>
                {result.vibe_score}
              </span>
              <span className="absolute -top-4 -right-8 text-4xl">{scoreIcon}</span>
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-neutral-400 mt-2">Score</span>
          </div>
          
          <div className="flex-1 sm:pt-2">
            <h3 className="font-display text-2xl uppercase tracking-wider text-white mb-3 opacity-90">
               Trainer Reaction
            </h3>
            <p className="text-xl text-neutral-200 leading-relaxed font-medium italic">
              "{result.trainer_reaction}"
            </p>
          </div>
        </div>
      </div>

      {/* Missing Weights */}
      {result.missing_weights.length > 0 && (
        <div className="p-6 md:p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg">
          <h3 className="font-display text-2xl uppercase tracking-wide text-neon mb-6 flex items-center gap-3">
            <Activity className="w-6 h-6 text-neon" />
            Missing Weights
          </h3>
          <ul className="space-y-4">
            {result.missing_weights.map((weight, i) => (
              <li key={i} className="flex gap-4 text-neutral-300 items-start">
                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-500 mt-0.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <span className="block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </span>
                <span className="text-lg leading-relaxed">{weight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The Perfect Rep */}
      <div className="p-6 md:p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg flex flex-col relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="font-display text-2xl uppercase tracking-wide text-white flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-neon" />
            The Perfect Rep
          </h3>
          <button 
            onClick={copyToClipboard}
            className="p-2.5 hover:bg-neutral-800 hover:text-neon text-neutral-400 rounded-xl transition-colors active:scale-95 border border-transparent hover:border-neutral-700"
            title="Copy to clipboard"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-neon" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="p-6 bg-black rounded-xl border border-neutral-800 font-mono text-neutral-300 text-[15px] md:text-base leading-relaxed relative z-10 whitespace-pre-wrap break-words">
          {result.the_perfect_rep}
        </div>
      </div>
    </motion.div>
  );
}
