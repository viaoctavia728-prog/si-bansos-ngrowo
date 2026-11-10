import { createContext, useContext, useState } from 'react';

const WargaLayoutContext = createContext({ collapsed: false, toggle: () => {}, openMobile: false, setOpenMobile: () => {} });

export function useWargaLayout() {
  return useContext(WargaLayoutContext);
}

export function WargaLayoutProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('warga_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [openMobile, setOpenMobile] = useState(false);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('warga_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <WargaLayoutContext.Provider value={{ collapsed, toggle, openMobile, setOpenMobile }}>
      {children}
    </WargaLayoutContext.Provider>
  );
}
