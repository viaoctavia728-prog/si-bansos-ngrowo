import { useLocation } from 'react-router-dom';
import { useWargaLayout } from './WargaLayoutContext';

export default function WargaMain({ children, className = '' }) {
  const { collapsed } = useWargaLayout();
  const location = useLocation();
  return (
    <div className={`flex flex-1 flex-col transition-[padding] duration-300 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'} ${className}`}>
      <div key={location.pathname} className="page-enter flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
