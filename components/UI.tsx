import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'purple' | 'pink';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', fullWidth = false, className = '', ...props 
}) => {
  const baseStyles = "py-3 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-secondary",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-danger text-white hover:bg-red-700",
    accent: "bg-accent text-white hover:bg-orange-600",
    purple: "bg-purple-600 text-white hover:bg-purple-700",
    pink: "bg-pink-500 text-white hover:bg-pink-600",
  };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => (
  <div className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(80,180,82,0.1)] p-6 md:p-8 ${className}`}>
    {(title || actions) && (
      <div className="flex justify-between items-center mb-6">
        {title && <h2 className="text-2xl md:text-3xl font-bold text-secondary text-center">{title}</h2>}
        {actions && <div>{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-gray-700 font-medium mb-2 text-right">{label}</label>
    <input 
      className={`w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-right ${className}`} 
      {...props} 
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export const Select: React.FC<SelectProps> = ({ label, children, ...props }) => (
  <div className="mb-4">
    <label className="block text-gray-700 font-medium mb-2 text-right">{label}</label>
    <select className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-right bg-white" {...props}>
      {children}
    </select>
  </div>
);

interface StatCardProps {
  label: string;
  value: number | string;
  colorClass?: string;
  icon?: LucideIcon;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, colorClass = "text-primary", icon: Icon }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
    {Icon && <Icon className={`w-8 h-8 mb-2 ${colorClass}`} />}
    <div className="text-gray-500 text-sm mb-1">{label}</div>
    <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
  </div>
);
