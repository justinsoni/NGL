import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl font-extrabold text-theme-dark mb-2">{title}</h2>
      <p className="text-lg text-theme-text-secondary">{subtitle}</p>
      <div className="w-24 h-1 bg-theme-primary mx-auto mt-4"></div>
    </div>
  );
};

export default SectionHeader;