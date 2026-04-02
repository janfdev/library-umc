import { Camera, Mail, Phone, MapPin, ShieldCheck, User as UserIcon } from 'lucide-react';
import { type MemberProfile } from '@/services/memberService';

interface ProfileHeaderProps {
  profile: MemberProfile | null;
  onEditClick: () => void;
}

const ProfileHeader = ({ profile, onEditClick }: ProfileHeaderProps) => {
  if (!profile) return null;

  const user = profile.user;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';

  return (
    <div className="relative mb-8 pt-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-red-600/5 to-transparent rounded-[32px] -z-10" />
      
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 px-4">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[40px] shadow-2xl shadow-red-100 flex items-center justify-center border-4 border-white overflow-hidden ring-4 ring-red-50 transition-all group-hover:scale-105 duration-500">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-5xl font-black">
                {initials}
              </div>
            )}
          </div>
          <button 
            className="absolute bottom-2 right-2 bg-slate-900 text-white p-3 rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-90"
            onClick={onEditClick}
          >
            <Camera size={18} />
          </button>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left pt-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck size={12} strokeWidth={3} />
                Verified {profile.memberType}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-y-3 gap-x-6 text-slate-400 font-bold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                <Mail size={14} />
              </div>
              {user?.email}
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 group cursor-default">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                  <Phone size={14} />
                </div>
                {profile.phone}
              </div>
            )}
            {profile.faculty && (
              <div className="flex items-center gap-2 group cursor-default">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                  <MapPin size={14} />
                </div>
                {profile.faculty}
              </div>
            )}
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                <UserIcon size={14} />
              </div>
              ID: {profile.nimNidn || 'NOT SET'}
            </div>
          </div>
          
          <div className="mt-8 flex justify-center md:justify-start gap-4">
            <button 
              onClick={onEditClick}
              className="bg-white border border-slate-200 text-slate-900 px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
            >
              Ubah Profil
            </button>
            <button className="bg-red-50 text-red-700 px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95">
              Ganti Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
