import { useNavigate } from "react-router";
import { Home, ArrowLeft, BookOpen, Search, Ghost } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Premium Background: Dot Grid & Gradients */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-red-100 rounded-full blur-[120px] opacity-40 animate-pulse" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-slate-200 rounded-full blur-[120px] opacity-40" />

      {/* 404 Giant Watermark */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none select-none"
      >
        <h1 className="text-[25rem] font-black text-slate-900 tracking-tighter">404</h1>
      </motion.div>

      {/* Main Content Card with Glass effect */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full text-center relative z-10 backdrop-blur-sm bg-white/30 border border-white/50 p-12 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]"
      >
        
        {/* Animated Icon Section */}
        <div className="relative mb-10 flex justify-center">
           <motion.div 
             animate={{ y: [0, -15, 0] }}
             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
             className="w-48 h-48 bg-card rounded-[40px] flex items-center justify-center relative shadow-2xl shadow-red-100/50"
           >
              {/* Spinning Ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-2 border-2 border-dashed border-red-200 rounded-[35px]"
              />
              
              <div className="relative">
                 <BookOpen size={92} className="text-primary" strokeWidth={1.5} />
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-4 -right-4 p-4 bg-primary shadow-xl shadow-red-200 rounded-3xl"
                 >
                    <Search size={22} className="text-white" />
                 </motion.div>
                 
                 <motion.div 
                    animate={{ rotate: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -bottom-2 -left-8"
                 >
                    <Ghost size={40} className="text-slate-300 opacity-40" />
                 </motion.div>
              </div>
           </motion.div>
        </div>

        {/* Text Typography */}
        <div className="space-y-4 mb-12">
           <motion.h2 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight"
           >
             Halaman<br/>Tersesat Di Rak
           </motion.h2>
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: "80px" }}
             transition={{ delay: 0.5, duration: 1 }}
              className="h-1.5 bg-primary mx-auto rounded-full" 
           />
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6 }}
             className="text-slate-500 font-bold text-base leading-relaxed max-w-sm mx-auto"
           >
             Mohon maaf, sepertinya halaman yang Anda cari tidak tersedia dalam database perpustakaan kami saat ini. 
           </motion.p>
        </div>

        {/* Actions Buttons with Premium Style */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(185, 28, 28, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-200 transition-all group"
          >
            <Home size={18} className="transition-transform group-hover:-translate-y-1" />
            Home
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "var(--muted)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-3 bg-card border-2 border-slate-100 text-slate-900 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all"
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>
        </div>
      </motion.div>

      {/* Footer Branding - Floating Minimalist */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 flex flex-col items-center gap-4 group"
      >
        <div className="w-12 h-12 bg-card shadow-xl rounded-2xl flex items-center justify-center text-foreground text-[10px] font-black italic border border-slate-50 group-hover:rotate-[360deg] transition-transform duration-700">UMC</div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground group-hover:text-primary transition-colors">Digital Library</p>
      </motion.div>

    </div>
  );
};

export default NotFound;
