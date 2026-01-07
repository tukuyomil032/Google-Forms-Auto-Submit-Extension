import React, { useState } from 'react';
import { type AppTheme } from '../interface';
import { IconThemeSunMoon } from './Icons';

interface Props {
  theme: AppTheme;
  onThemeChange: (newTheme: AppTheme) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const ThemeToggle: React.FC<Props> = ({ theme, onThemeChange }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const cycleTheme = () => {
    const order: AppTheme[] = ['light', 'darkBlue', 'dark', 'system'];
    const currentIndex = order.indexOf(theme);
    const nextTheme = order[(currentIndex + 1) % order.length];

    triggerAnimation(nextTheme);
    onThemeChange(nextTheme);
  };

  const triggerAnimation = (nextTheme: AppTheme) => {
    let color = '#fff';
    if (nextTheme === 'light') {
      color = '#cbd5e1';
    }
    if (nextTheme === 'dark') {
      color = '#4b5563';
    }
    if (nextTheme === 'darkBlue') {
      color = '#3b82f6';
    }

    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 30 + Math.random() * 20;
      newParticles.push({
        id: Date.now() + i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        color
      });
    }

    setParticles(newParticles);

    setTimeout(() => {
      setParticles([]);
    }, 600);
  };

  return (
    <div className="relative">
      <button
        onClick={cycleTheme}
        className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors relative z-10"
        title={`テーマ切り替え: ${theme}`}
      >
        <IconThemeSunMoon />
      </button>

      {particles.map(p => (
        <span
          key={p.id}
          className="animate-particle"
          style={{
            backgroundColor: p.color,
            '--tx': `${p.x}px`,
            '--ty': `${p.y}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};