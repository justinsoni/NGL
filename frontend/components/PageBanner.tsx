

import React from 'react';

interface PageBannerProps {
  title: string;
  subtitle?: string;
}

const PageBanner: React.FC<PageBannerProps> = ({ title, subtitle }) => {
  return (
    <div className="w-full h-32 md:h-40 bg-theme-light flex items-center justify-center border-b-2 border-theme-border">
      <div className="container mx-auto px-4 md:px-6 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-theme-dark tracking-tight">{title}</h1>
        {subtitle && <p className="text-theme-dark text-xl mt-1 opacity-90">{subtitle}</p>}
      </div>
    </div>
  );
};

export default PageBanner;