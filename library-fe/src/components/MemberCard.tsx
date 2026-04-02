import { Download, Printer } from 'lucide-react';
import { type MemberProfile } from '@/services/memberService';

interface MemberCardProps {
  profile: MemberProfile | null;
}

const MemberCard = ({ profile }: MemberCardProps) => {
  if (!profile) return null;

  const user = profile.user;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';

  return (
    <div className="flex flex-col items-center gap-10 py-10">
      {/* Front of the card as shown in mockup */}
      <div className="w-[450px] aspect-[1.6/1] bg-white rounded-[24px] shadow-2xl relative overflow-hidden border border-slate-100 animate-slide-up">
        
        {/* Card Header (Red) */}
        <div className="bg-[#9c1b1b] p-4 flex items-center gap-3">
           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#9c1b1b] font-bold text-xs italic border border-white/20 shadow-inner">UMC</div>
           <div className="leading-tight">
              <h3 className="text-white font-bold text-[11px] uppercase tracking-[0.15em]">UMC Library</h3>
              <p className="text-white/60 text-[8px] font-black uppercase tracking-tighter">Digital Library System</p>
           </div>
        </div>

        {/* Card Content Area */}
        <div className="p-8 flex gap-6">
           {/* Member Info */}
           <div className="shrink-0 w-24 h-32 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-50">
              {user?.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-3xl">
                   {initials}
                </div>
              )}
           </div>

           {/* User Meta */}
           <div className="flex-1 flex flex-col justify-center pt-2">
              <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-0.5">{user?.name}</h4>
              <p className="text-red-700 text-[10px] font-black uppercase tracking-widest">{profile.memberType}</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{profile.faculty || "Teknik Informatika"}</p>
           </div>
        </div>

        {/* Barcode Section as in mockup */}
        <div className="mx-6 mb-6">
           <div className="w-full h-12 bg-slate-900 rounded-xl relative shadow-inner shadow-black/20 overflow-hidden">
              <div 
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 4px)`
                }}
              />
           </div>
        </div>
      </div>

      {/* Buttons and Footer */}
      <div className="flex flex-col items-center gap-6">
         <div className="flex gap-4">
            <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
               <Download size={14} className="text-red-500" />
               Simpan Gambar
            </button>
            <button className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
               <Printer size={14} className="text-red-500" />
               Cetak Kartu
            </button>
         </div>
         <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest max-w-[400px] text-center leading-relaxed italic">
            *Tunjukan kartu-barcode di atas kepada petugas perpustakaan saat melakukan peminjaman buku
         </p>
      </div>
    </div>
  );
};

export default MemberCard;