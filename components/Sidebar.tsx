
import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onClose?: () => void;
  logoUrl?: string;
  companyName?: string;
  syncState?: {
    status: string;
    lastSync: Date | null;
    enabled: boolean;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onClose, logoUrl, companyName, syncState }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'invoices', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'quotations', label: 'Quotations', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'clients', label: 'Clients', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  const getStatusColor = () => {
    if (!syncState?.enabled) return 'bg-orange-400';
    if (syncState.status === 'error') return 'bg-red-500 animate-ping';
    if (syncState.status === 'syncing') return 'bg-indigo-400 animate-bounce';
    return 'bg-emerald-400';
  };

  const getStatusText = () => {
    if (!syncState?.enabled) return 'Local Mode';
    if (syncState.status === 'error') return 'Sync Error';
    if (syncState.status === 'syncing') return 'Syncing...';
    return 'Cloud Live';
  };

  return (
    <aside className="w-72 lg:w-64 h-full bg-[#5c2c90] text-white flex flex-col no-print border-r border-white/10 shadow-2xl lg:shadow-none">
      <div className="p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1 w-full overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg flex-shrink-0">
               {logoUrl ? (
                 <img src={logoUrl} className="h-10 w-auto object-contain max-w-[150px]" alt={`${companyName} Logo`} />
               ) : (
                 <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 font-black">
                   {companyName?.charAt(0) || 'B'}
                 </div>
               )}
            </div>
            <div className="flex flex-col min-w-0">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Storage</span>
               <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full shadow-lg ${getStatusColor()}`}></div>
                  <span className="text-[10px] font-bold truncate">{getStatusText()}</span>
               </div>
               {syncState?.lastSync && (
                 <span className="text-[8px] text-white/40 font-medium">Last: {syncState.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               )}
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-white/50 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-4 lg:py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-white/20 text-white shadow-lg translate-x-1 backdrop-blur-sm' 
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <img src={logoUrl || "https://picsum.photos/40/40"} className="w-10 h-10 rounded-full border border-white/20 object-cover bg-white" alt="Avatar" />
            <div className="text-sm overflow-hidden">
              <p className="font-bold text-white truncate">{companyName || 'Administrator'}</p>
              <p className="text-white/60 text-[10px] uppercase font-black tracking-widest truncate">Enterprise Panel</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
