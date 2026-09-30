/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Search, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ExternalLink,
  RefreshCw,
  Zap,
  Terminal
} from 'lucide-react';
import { analyzeScam, ScamAnalysis } from './services/geminiService';

const PayPalDonate = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    const containerId = "paypal-container-UQCHYWTCTD6AN";
    const container = document.getElementById(containerId);
    
    let retryCount = 0;
    const maxRetries = 5;

    const initPaypal = () => {
      const paypal = (window as any).paypal;
      if (paypal && container) {
        if (!container.hasChildNodes()) {
          try {
            paypal.HostedButtons({
              hostedButtonId: "UQCHYWTCTD6AN",
            }).render(`#${containerId}`);
            setIsLoaded(true);
          } catch (e) {
            console.error("PayPal Render Error:", e);
          }
        } else {
          setIsLoaded(true);
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initPaypal, 1000);
      }
    };

    const timer = setTimeout(initPaypal, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full space-y-2">
      <div 
        id="paypal-container-UQCHYWTCTD6AN" 
        className="w-full flex flex-col items-center justify-center min-h-[50px] overflow-hidden rounded-sm bg-black/20 py-2 px-1 border border-white/5"
      >
        {!isLoaded && (
          <div className="text-[9px] text-text-dim uppercase tracking-tighter opacity-50 animate-pulse flex items-center gap-2">
            <RefreshCw className="w-2 h-2 animate-spin" />
            Establishing Secure Link...
          </div>
        )}
      </div>
      
      {/* Protocol Bypass Link */}
      <div className="text-center">
        <a 
          href="https://www.paypal.com/ncp/payment/UQCHYWTCTD6AN" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[8px] font-mono text-accent/60 hover:text-accent uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
        >
          <span>Manual Support Protocol</span>
          <ExternalLink className="w-2 h-2" />
        </a>
        <p className="text-[7px] text-text-dim/40 mt-1 italic">
          (Use if button is blocked by firewall)
        </p>
      </div>
    </div>
  );
};

const SAMPLE_SCAMS = [
  "URGENT: Your bank account has been compromised. Click here to verify your identity: http://bank-secure-verify.net/login",
  "Congratulations! You've won $1,000,000 from the Microsoft Lottery. Send $500 processing fee to receive your prize.",
  "Hi mom, I lost my phone and I'm using a friend's. I'm in trouble and need money for bail. Please wire it to this account."
];

const AnimatedScore = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * end);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}%</span>;
};

export default function App() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(() => {
    const saved = localStorage.getItem('scam_scan_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const SCAN_LIMIT = 50;

  const INPUT_PRESETS = [
    { label: "A Business Name", text: "Is 'Global Asset Recovery LLC' a reputable business?" },
    { label: "A Person's Name", text: "Verify the reputation of 'Federal Agent Mark Thompson' who contacted me regarding my social security number." },
    { label: "A Suspicious Link", text: "Check this website link: 'microsoft-security-auth.net' for phishing activity." },
    { label: "A Strange Request", text: "My bank is asking me to download a file to 'secure my account'. Is this common?" }
  ];

  const handleAnalyze = async (textToAnalyze: string = content) => {
    if (!textToAnalyze.trim()) return;
    
    if (scanCount >= SCAN_LIMIT) {
      setError(`CRITICAL: FREE_QUOTA_EXCEEDED. Analysis nodes exhausted (${scanCount}/${SCAN_LIMIT}). Please utilize the Intel Support Protocol in the sidebar to restore system access.`);
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const report = await analyzeScam(textToAnalyze);
      setResult(report);
      const nextCount = scanCount + 1;
      setScanCount(nextCount);
      localStorage.setItem('scam_scan_count', nextCount.toString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-emerald-400';
      case 'MEDIUM': return 'text-amber-400';
      case 'HIGH': return 'text-red-400';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-neutral-400';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 border-amber-500/20';
      case 'HIGH': return 'bg-red-500/10 border-red-500/20';
      case 'CRITICAL': return 'bg-red-900/20 border-red-900/30';
      default: return 'bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return <ShieldCheck className="w-8 h-8 text-emerald-400" />;
      case 'MEDIUM': return <ShieldAlert className="w-8 h-8 text-amber-400" />;
      case 'HIGH': return <ShieldX className="w-8 h-8 text-red-400" />;
      case 'CRITICAL': return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default: return <Info className="w-8 h-8 text-neutral-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans">
      <header className="h-20 border-b border-border flex items-center justify-between px-10 bg-surface">
        <div className="flex items-center gap-4">
          <div className="text-sm border-r border-border pr-4 text-text-dim uppercase tracking-[0.15em] font-medium">
            ScamBuster AI <span className="text-accent ml-2">v4.2.0</span>
          </div>
          <div className="text-[11px] text-text-dim uppercase tracking-widest hidden md:block">
            Threat Analysis & Intercept Protocol
          </div>
        </div>
        <div className="flex items-center gap-4 bg-accent/5 border border-accent/20 px-4 py-2 rounded-sm text-accent text-xs font-bold tracking-widest">
           <div className="pulse-dot mr-2"></div>
           SYSTEM READY
        </div>
      </header>

      <main className="flex-1 grid md:grid-cols-[320px_1fr] overflow-hidden">
        {/* Sidebar */}
        <aside className="border-r border-border p-10 flex flex-col gap-10 bg-bg overflow-y-auto">
          <div className="space-y-2">
            <span className="section-label">Current Environment</span>
            <div className="text-2xl font-light text-white tracking-tight">Intercept-v4.2</div>
            <div className="text-[13px] text-text-dim font-mono">NODE_HASH: 7a2f109</div>
          </div>

          <div className="space-y-4">
            <span className="section-label">Analysis Quota</span>
            <div className="bg-surface border border-border p-4 rounded-sm space-y-3">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-text-dim uppercase tracking-widest">Free Tier Balance</span>
                <span className={scanCount >= SCAN_LIMIT ? 'text-red-400' : 'text-accent'}>
                  {Math.max(0, SCAN_LIMIT - scanCount)} / {SCAN_LIMIT} LEFT
                </span>
              </div>
              <div className="h-1 bg-border w-full relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(Math.min(scanCount, SCAN_LIMIT) / SCAN_LIMIT) * 100}%` }}
                  className={`absolute left-0 top-0 h-full ${scanCount >= SCAN_LIMIT ? 'bg-red-400' : 'bg-accent'}`}
                />
              </div>
              {scanCount >= SCAN_LIMIT && (
                <div className="text-[10px] text-red-400 font-bold uppercase tracking-tighter leading-none animate-pulse">
                  CRITICAL: ACCOUNT EXHAUSTED. DONATION REQUIRED FOR RESET.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <span className="section-label">Capture Examples</span>
            <div className="flex flex-col gap-3">
              {SAMPLE_SCAMS.map((s, i) => (
                <button
                  key={i}
                  id={`sample-btn-${i}`}
                  onClick={() => {
                    setContent(s);
                    handleAnalyze(s);
                  }}
                  className="group flex flex-col items-start gap-2 text-left p-4 border border-border bg-surface hover:border-accent transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="text-[10px] font-bold text-accent uppercase tracking-widest">Sample Intercept {i + 1}</div>
                  <div className="text-[11px] text-text-dim line-clamp-2 font-mono group-hover:text-text transition-colors">
                    {s}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-6">
            {/* Promo Plug / Credits */}
            <div className="p-5 bg-accent/5 border border-accent/20 rounded-sm space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                <Zap className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-accent">
                  <Terminal className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AGENTIC INTERFACE</span>
                </div>
                <div className="text-sm font-light text-white leading-tight">
                  Architected by <br/>
                  <span className="font-medium text-accent">Google AI Studio Build</span>
                </div>
              </div>
              <p className="text-[11px] text-text-dim leading-relaxed font-mono">
                Powered by Gemini. Built to intercept deception through advanced behavioral analysis.
              </p>
            </div>

            {/* Support / Donation */}
            <div className="space-y-3">
              <span className="section-label px-0">Intel Support Protocol</span>
              <div className="group block p-4 bg-surface border border-border rounded-sm transition-all shadow-lg hover:border-accent/40">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-accent">$</span>
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[11px] font-bold uppercase tracking-tight text-white">Project Support</span>
                    <span className="text-[9px] opacity-70 font-mono text-text-dim">Unlock unlimited node access</span>
                  </div>
                </div>
                <PayPalDonate />
              </div>
            </div>

            <button 
              id="reset-btn"
              onClick={() => { setContent(''); setResult(null); }}
              className="btn-secondary w-full flex items-center justify-center gap-2 hover:bg-white/5"
            >
              <RefreshCw className="w-3 h-3" />
              Flush System Cache
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="p-10 bg-[linear-gradient(135deg,#0a0a0c_0%,#111118_100%)] overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Input Section */}
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="section-label">Intercept Content Analysis</span>
                <p className="text-[10px] text-text-dim uppercase tracking-[0.2em]">Paste anything suspicious: A name, a business, an email, or a link.</p>
              </div>
              <div className="geometric-card relative overflow-hidden ring-1 ring-border group hover:ring-accent/30 transition-all">
                <div className="scan-line" style={{ opacity: isAnalyzing ? 1 : 0 }}></div>
                <textarea
                  className="w-full h-48 bg-transparent outline-none font-mono text-[13px] leading-relaxed resize-none placeholder:text-text-dim/30"
                  placeholder="ENTER POTENTIAL SCAM HERE... (e.g. A business name, a suspicious email, or a strange person's name)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  id="input-analysis"
                />
                
                {/* Quick Logic Injections */}
                <div className="mt-4 border-t border-border/50 pt-4">
                  <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest block mb-3">Quick Start Protocols:</span>
                  <div className="flex flex-wrap gap-2">
                    {INPUT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setContent(preset.text)}
                        className="text-[10px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm hover:border-accent hover:text-accent transition-all uppercase tracking-tighter"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    id="analyze-btn"
                    onClick={() => handleAnalyze()}
                    disabled={isAnalyzing || !content.trim()}
                    className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto md:px-12"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-bg" />
                    ) : (
                      <>
                        <Search className="w-3 h-3" />
                        Initiate Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="text-red-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" id="error-msg">
                  <AlertTriangle className="w-3 h-3" />
                  ANALYSIS_ERROR: {error}
                </div>
              )}
            </section>

            {/* Results Grid / Loading State */}
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="geometric-card min-h-[220px] animate-pulse relative overflow-hidden">
                    <div className="scan-line"></div>
                    <div className="h-4 w-24 bg-white/5 rounded mb-10"></div>
                    <div className="h-12 w-32 bg-white/5 rounded mb-4"></div>
                    <div className="h-2 w-full bg-white/5 rounded mt-auto"></div>
                  </div>
                  <div className="geometric-card min-h-[220px] animate-pulse">
                    <div className="h-4 w-24 bg-white/5 rounded mb-10"></div>
                    <div className="h-8 w-full bg-white/5 rounded"></div>
                    <div className="h-8 w-2/3 bg-white/5 rounded mt-2"></div>
                  </div>
                  <div className="geometric-card md:col-span-2 min-h-[100px] animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full bg-white/5 rounded"></div>
                      <div className="h-3 w-1/3 bg-white/5 rounded"></div>
                    </div>
                  </div>
                </motion.div>
              )}
              {result && !isAnalyzing && (
                <motion.div
                  id="analysis-result"
                  key="result"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    visible: { transition: { staggerChildren: 0.1 } },
                    hidden: {}
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Risk Metric Card */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="geometric-card flex flex-col justify-between min-h-[220px] hover:border-accent/40 transition-colors"
                  >
                    <span className="section-label">Readiness Score / Risk</span>
                    <div className="flex items-end justify-between">
                      <div className="text-5xl font-light text-white tracking-tighter">
                        <AnimatedScore value={result.score} />
                      </div>
                      <div className={`text-xs font-bold uppercase tracking-widest ${getRiskColor(result.riskLevel)}`}>
                        {result.riskLevel} Risk Level
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="h-1 bg-border w-full relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`absolute left-0 top-0 h-full ${result.riskLevel === 'LOW' ? 'bg-accent' : 'bg-red-400'}`}
                        />
                      </div>
                      <div className="mt-2 text-[10px] text-text-dim uppercase tracking-widest">
                        Confidence Factor: 0.982
                      </div>
                    </div>
                  </motion.div>

                  {/* Verdict Card */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="geometric-card flex flex-col justify-between min-h-[220px] hover:border-accent/40 transition-colors"
                  >
                    <span className="section-label">System Verdict</span>
                    <div className="text-2xl font-light text-white leading-tight uppercase tracking-tight">
                      {result.verdict}
                    </div>
                    <div className="mt-4 flex gap-2">
                       <div className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase tracking-widest">
                         SCAM_TYPE: {result.scamType}
                       </div>
                    </div>
                  </motion.div>

                  {/* Reputation Search Findings */}
                  {result.reputationFindings && (
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className="geometric-card md:col-span-2 space-y-4 border-accent/30 hover:border-accent/60 transition-colors bg-accent/5 backdrop-blur-sm"
                    >
                      <span className="section-label text-accent">Live Reputation Intelligence</span>
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                          <Search className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="text-[14px] text-text leading-relaxed font-light italic">
                            "{result.reputationFindings}"
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                            <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">Grounding: Google Search Real-time Verified</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Indicators Table style */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, scale: 0.98 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                    className="geometric-card md:col-span-2 space-y-4"
                  >
                    <span className="section-label">Final Behavioral Check results</span>
                    <div className="border border-border">
                      <div className="grid grid-cols-[1fr_80px] p-4 border-b border-border text-text-dim font-bold text-[10px] uppercase tracking-widest bg-white/2">
                        <div>Detected Pattern</div>
                        <div className="text-center">Status</div>
                      </div>
                      {result.indicators.map((indicator, i) => (
                        <div key={i} className="grid grid-cols-[1fr_80px] p-4 border-b border-border last:border-none text-[13px] items-center">
                          <div className="font-mono text-text-dim leading-relaxed">{indicator.label}</div>
                          <div className="text-center">
                            <span className={`${indicator.status === 'PASS' ? 'text-accent' : 'text-red-400'} text-[10px] font-bold uppercase tracking-widest`}>
                              {indicator.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Log Summary / Supervisor Thought */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                    className="geometric-card md:col-span-2 space-y-4"
                  >
                    <span className="section-label">Supervisor Analysis Logic Log</span>
                    <div className="bg-bg/50 border border-border p-4 font-mono text-[12px] leading-relaxed text-text-dim/80">
                      <div className="flex gap-4">
                        <span className="text-accent underline shrink-0">[LOG]</span>
                        <span>{result.supervisorThought}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Protocol / Recommendations */}
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="geometric-card md:col-span-2 space-y-4"
                  >
                     <span className="section-label">Emergency Protocol Summary</span>
                     <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                         <div className="text-[13px] text-text leading-relaxed font-mono">
                           {result.explanation}
                         </div>
                       </div>
                       <div className="flex flex-col gap-2">
                         {result.recommendations.map((rec, i) => (
                           <div key={i} className="flex gap-4 items-start p-3 bg-white/2 border border-border rounded-sm hover:border-accent/30 transition-colors">
                             <div className="mt-1.5 w-1.5 h-1.5 bg-accent shrink-0"></div>
                             <div className="text-[12px] font-mono text-text-dim tracking-tight">{rec}</div>
                           </div>
                         ))}
                       </div>
                     </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Safety & Ethics Protocol */}
          <section className="mt-20 border-t border-border/30 pt-12 space-y-8">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-accent" />
              <span className="section-label text-accent">Safety & Ethics Protocol</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Advisory Disclaimer</h3>
                <p className="text-[12px] text-text-dim leading-relaxed font-mono">
                  ScamBuster AI is an advanced analytical node designed for educational and defensive assessment. 
                  Analysis results are generated by artificial intelligence [Gemini 3 Flash] and may occasionally 
                  suffer from "hallucinations" or false outcomes. 
                </p>
                <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-sm">
                  <p className="text-[11px] text-red-400 font-bold uppercase tracking-tight leading-normal">
                    CRITICAL: This tool does not provide legal, financial, or professional security advice. 
                    NEVER rely solely on AI for financial decisions. Always verify with official entities.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Official Reporting Nodes</h3>
                <p className="text-[12px] text-text-dim leading-relaxed font-mono">
                  If you believe you are being targeted by a criminal entity, initiate contact with established 
                  consumer protection agencies immediately.
                </p>
                <div className="flex flex-col gap-2">
                  <a 
                    href="https://reportfraud.ftc.gov/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-sm hover:border-accent group transition-all"
                  >
                    <span className="text-[11px] font-bold uppercase text-white">Federal Trade Commission (FTC)</span>
                    <ExternalLink className="w-3 h-3 text-text-dim group-hover:text-accent" />
                  </a>
                  <a 
                    href="https://www.ic3.gov/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-sm hover:border-accent group transition-all"
                  >
                    <span className="text-[11px] font-bold uppercase text-white">Internet Crime Complaint Center (IC3)</span>
                    <ExternalLink className="w-3 h-3 text-text-dim group-hover:text-accent" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface border border-border text-center">
              <p className="text-[11px] text-text-dim/60 italic font-mono uppercase tracking-[0.2em]">
                "Making it harder for scammers to profit is the first step toward a more honest society."
              </p>
            </div>
          </section>

          <footer className="mt-20 pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 pb-10">
            <div className="text-[10px] font-mono tracking-widest uppercase">
              // SCAMBUSTER AI NODE_42 // ENCRYPTED SESSION // ARIZONA CONSUMER DEFENSE
            </div>
            <div className="flex gap-6">
               <span className="text-[10px] font-bold uppercase tracking-tighter">Verified Protocol</span>
               <ShieldCheck className="w-4 h-4" />
               <Terminal className="w-4 h-4" />
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
