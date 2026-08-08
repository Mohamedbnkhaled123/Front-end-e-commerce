import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'shoPRO_theme';

  // Signal for Reactive Theme State
  currentTheme = signal<ThemeMode>(this.getInitialTheme());
  isDark = signal<boolean>(this.currentTheme() === 'dark');

  constructor() {
    // Automatically apply class on <html> tag when theme signal mutates
    effect(() => {
      const theme = this.currentTheme();
      const isDarkMode = theme === 'dark';
      this.isDark.set(isDarkMode);

      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }

  private getInitialTheme(): ThemeMode {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  setTheme(theme: ThemeMode): void {
    if (theme !== 'light' && theme !== 'dark') return;
    if (this.currentTheme() === theme && document.documentElement.classList.contains(theme)) return;

    const applyTheme = () => {
      this.currentTheme.set(theme);
      const isDarkMode = theme === 'dark';
      this.isDark.set(isDarkMode);

      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(this.STORAGE_KEY, theme);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      (document as any).startViewTransition(() => {
        applyTheme();
      });
    } else {
      applyTheme();
    }
  }
}
