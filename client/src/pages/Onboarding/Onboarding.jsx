import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Shield, Sparkles, Utensils, Activity, Lock, ArrowRight } from 'lucide-react';

/* ────────────────────────────────────────────────────────────
   Google "G" logo SVG
──────────────────────────────────────────────────────────── */
const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

/* ────────────────────────────────────────────────────────────
   Floating ambient particle
──────────────────────────────────────────────────────────── */
const Particle = ({ style }) => <div className="absolute rounded-full pointer-events-none" style={style} />;

/* ════════════════════════════════════════════════════════════
   ONBOARDING
════════════════════════════════════════════════════════════ */
const Onboarding = () => {
  const navigate = useNavigate();
  const { googleLogin, isLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  /* preload hero image */
  useEffect(() => {
    const img = new Image();
    img.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&q=80&auto=format&fit=crop';
    img.onload = () => setImgLoaded(true);
  }, []);

  /* Google OAuth success handler - PRESERVED ORIGINAL FUNCTION */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoggingIn(true);
      const result = await googleLogin(credentialResponse.credential);
      
      if (result.isNewUser) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      showError('Failed to authenticate with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  /* Google OAuth error handler */
  const handleGoogleError = () => {
    showError('Google authentication failed. Please try again.');
  };

  /* ambient particles */
  const particles = [
    { width:3, height:3, background:'rgba(99,102,241,.4)',   top:'15%', left:'8%',   animation:'pfloat1 10s ease-in-out infinite' },
    { width:2, height:2, background:'rgba(165,180,252,.3)',  top:'40%', left:'5%',   animation:'pfloat2 13s ease-in-out infinite 2s' },
    { width:4, height:4, background:'rgba(99,102,241,.2)',   top:'70%', left:'12%',  animation:'pfloat1 9s  ease-in-out infinite 1s' },
    { width:2, height:2, background:'rgba(165,180,252,.25)', top:'22%', right:'9%',  animation:'pfloat2 11s ease-in-out infinite 3s' },
    { width:3, height:3, background:'rgba(99,102,241,.3)',   top:'58%', right:'7%',  animation:'pfloat1 12s ease-in-out infinite 0.5s' },
    { width:2, height:2, background:'rgba(255,255,255,.1)',  top:'84%', right:'15%', animation:'pfloat2 10s ease-in-out infinite 4s' },
  ];

  const busy = isLoading || isLoggingIn;

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily:"'DM Sans', sans-serif" }}>
      {/* ── global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');

        @keyframes pfloat1 {
          0%,100% { transform:translateY(0) translateX(0); }
          35%      { transform:translateY(-16px) translateX(7px); }
          65%      { transform:translateY(9px) translateX(-5px); }
        }
        @keyframes pfloat2 {
          0%,100% { transform:translateY(0) translateX(0); }
          40%      { transform:translateY(13px) translateX(-9px); }
          70%      { transform:translateY(-11px) translateX(6px); }
        }
        @keyframes pring {
          0%   { transform:scale(1);   opacity:.7; }
          100% { transform:scale(1.7); opacity:0; }
        }
        @keyframes gshimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }

        /* grain */
        #onboard-grain {
          position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:0.035;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* custom google button - visible */
        .g-btn-custom {
          position:relative; display:flex; align-items:center; justify-content:center;
          gap:10px; width:100%; padding:14px 22px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.10);
          border-radius:14px;
          color:#e5e7eb; font-size:14px; font-weight:500; letter-spacing:.01em;
          cursor:pointer; outline:none; overflow:hidden;
          transition:background .18s, border-color .18s, box-shadow .18s, transform .12s;
        }
        .g-btn-custom:hover:not(:disabled) {
          background:rgba(255,255,255,0.09);
          border-color:rgba(255,255,255,0.18);
          box-shadow:0 4px 28px rgba(0,0,0,.35), 0 0 0 1px rgba(99,102,241,.18);
          transform:translateY(-1px);
        }
        .g-btn-custom:active { transform:translateY(0); box-shadow:none; }
        .g-btn-custom::after {
          content:'';
          position:absolute; inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);
          background-size:200% 100%;
          opacity:0; transition:opacity .2s;
        }
        .g-btn-custom:hover:not(:disabled)::after { opacity:1; animation:gshimmer 1.6s ease infinite; }
        .g-btn-custom:disabled { opacity:.4; cursor:not-allowed; transform:none !important; }

        /* invisible google button - positioned over custom button */
        .g-btn-invisible {
          position: absolute !important;
          top: 0;
          left: 0;
          width: 100% !important;
          height: 100% !important;
          opacity: 0.01 !important; /* Nearly invisible but still clickable */
          cursor: pointer !important;
          z-index: 10 !important;
          overflow: hidden !important;
        }

        /* Hide any inner content of the Google button */
        .g-btn-invisible > div,
        .g-btn-invisible iframe,
        .g-btn-invisible span {
          opacity: 0 !important;
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
      `}</style>

      <div id="onboard-grain" />

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — hero image
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block lg:w-[56%] relative overflow-hidden flex-shrink-0">

        {/* placeholder while image loads */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />

        {/* hero photo */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage:`url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&q=80&auto=format&fit=crop')` }}
          initial={{ opacity:0, scale:1.06 }}
          animate={{ opacity: imgLoaded ? 1 : 0, scale:1 }}
          transition={{ duration:1.4, ease:[.16,1,.3,1] }}
        />

        {/* overlays — subtle vignette, not heavy tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-[#080808]/70" />

        {/* particles */}
        {particles.map((p, i) => <Particle key={i} style={p} />)}

        {/* brand mark */}
        <div className="absolute top-8 left-8 z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center">
            <Utensils className="w-4 h-4 text-white/90" />
          </div>
            <span className="text-white text-base sm:text-lg md:text-xl font-semibold tracking-wide drop-shadow-md">
              Fomula
            </span>
        </div>

        {/* bottom copy */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-10 pb-12">
          <motion.div
            initial={{ opacity:0, y:22 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:.7, duration:.8, ease:[.16,1,.3,1] }}
          >
            <p className="text-white/60 text-[11px] uppercase tracking-[.2em] font-semibold mb-3">
              AI-powered meal analysis
            </p>
            <h2 className="text-white text-3xl xl:text-[2.2rem] leading-[1.25] mb-5"
              style={{ fontFamily:"'DM Serif Display', serif" }}>
              Eat smarter,<br/>
              <em className="text-indigo-300 not-italic">feel better</em>
            </h2>

            {/* feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon:<Sparkles className="w-3 h-3"/>, label:'Smart Analysis' },
                { icon:<Shield className="w-3 h-3"/>,   label:'End-to-end Encrypted' },
                { icon:<Activity className="w-3 h-3"/>, label:'Personalised' },
              ].map(({ icon, label }) => (
                <div key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] text-white/80">
                  <span className="text-indigo-300">{icon}</span>{label}
                </div>
              ))}
            </div>

            {/* testimonial strip */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-1.5">
                {['4285F4','34A853','FBBC05'].map(c => (
                  <div key={c} className="w-6 h-6 rounded-full border border-white/20"
                    style={{ background:`#${c}22`, outline:'1px solid rgba(255,255,255,.15)' }} />
                ))}
              </div>
              <p className="text-[11px] text-white/50">
                Trusted by <span className="text-white/80 font-medium">1,000+</span> health-conscious users
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — login form
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 bg-[#080808] relative flex flex-col items-center justify-start sm:justify-center pt-10 sm:pt-0 px-6 sm:p-10 pb-8">

        {/* form container */}
        <motion.div
          initial={{ opacity:0, y:18 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:.6, ease:[.16,1,.3,1] }}
          className="relative w-full max-w-[340px]"
        >
          {/* heading */}
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:.12, duration:.5 }}
            className="mb-8"
          >
            <span className="block text-[10px] font-semibold text-indigo-400/60 pb-5 uppercase tracking-widest mb-3">
              Get started free
            </span>
            <h1 className="text-[1.9rem] leading-tight text-white"
              style={{ fontFamily:"'DM Serif Display', serif" }}>
              Your personal<br/>
              <em className="text-indigo-300 not-italic">meal coach</em>
            </h1>
            <p className="text-[12px] text-gray-600 mt-3 leading-relaxed">
              Connect your Google account to receive meal analysis tailored to you!
            </p>
          </motion.div>

          {/* card */}
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:.2, duration:.5 }}
            className="rounded-2xl bg-[#0d0d0d] p-6 relative"
          >
            {/* Container with relative positioning for overlay */}
            <div className="relative">
              {/* Custom visible button */}
              <button
                className="g-btn-custom"
                type="button"
                disabled={busy}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <GoogleG size={18} />
                    <span>Continue with Google</span>
                    <motion.span
                      className="ml-auto text-gray-700"
                      animate={{ x: btnHover ? 3 : 0 }}
                      transition={{ duration:.15 }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </>
                )}
              </button>

              {/* Invisible GoogleLogin overlay */}
              {!busy && (
                <div className="absolute inset-0">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_white"
                    size="large"
                    text="continue_with"
                    shape="pill"
                    locale="en"
                    width="100%"
                    containerProps={{
                      className: "g-btn-invisible"
                    }}
                  />
                </div>
              )}
            </div>

            {/* trust strip */}
            <div className="flex items-center justify-center gap-5 mt-5 pt-5 border-t border-white/[0.05]">
              {[
                { icon:<Lock className="w-3 h-3"/>,   label:'Privacy first' },
                { icon:<Shield className="w-3 h-3"/>, label:'GDPR compliant' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                  <span className="text-indigo-500/50">{icon}</span>{label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* feature trio */}
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:.35 }}
            className="grid grid-cols-3 gap-3 mt-5"
          >
            {[
              { icon:<Sparkles className="w-3.5 h-3.5"/>, label:'AI Analysis' },
              { icon:<Activity className="w-3.5 h-3.5"/>, label:'Personalised' },
              { icon:<Shield className="w-3.5 h-3.5"/>,   label:'Encrypted' },
            ].map(({ icon, label }) => (
              <div key={label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05] text-center">
                <span className="text-indigo-400/70">{icon}</span>
                <span className="text-[10px] text-gray-600">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* terms */}
          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:.45 }}
            className="text-[11px] text-center text-gray-700 mt-6 leading-relaxed"
          >
            By continuing you agree to our{' '}
            <a href="/terms"   className="text-indigo-400/60 hover:text-indigo-400 transition-colors underline underline-offset-2 decoration-indigo-500/25">Terms</a>
            {' & '}
            <a href="/privacy" className="text-indigo-400/60 hover:text-indigo-400 transition-colors underline underline-offset-2 decoration-indigo-500/25">Privacy Policy</a>
          </motion.p>

          <p className="text-center text-[10px] text-gray-800 mt-4">© 2025 Fomula. All rights reserved.</p>
        </motion.div>
      </div>

      {/* ══════════ LOADING OVERLAY ══════════ */}
      <AnimatePresence>
        {busy && (
          <>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity:0, scale:.95, y:6 }}
              animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:.95, y:6 }}
              transition={{ duration:.2, ease:[.16,1,.3,1] }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl px-7 py-5 shadow-2xl flex items-center gap-4 pointer-events-auto">
                <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-indigo-400/25"
                    style={{ animation:'pring 1.5s cubic-bezier(.2,0,0,1) infinite' }} />
                  <div className="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium leading-none mb-1.5">Authenticating</p>
                  <p className="text-[11px] text-gray-600">Verifying your account…</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;