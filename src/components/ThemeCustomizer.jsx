import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Type, 
  Moon, 
  Sun, 
  Monitor,
  Settings,
  RotateCcw
} from 'lucide-react';

const ThemeCustomizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState({
    mode: 'system',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'normal',
    borderRadius: 8,
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-customization');
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      setTheme(parsedTheme);
      applyTheme(parsedTheme);
    }
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    // Apply color scheme
    if (newTheme.mode === 'dark') {
      root.classList.add('dark');
    } else if (newTheme.mode === 'light') {
      root.classList.remove('dark');
    } else {
      // System mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Convert font weight to numeric value
    const getFontWeightValue = (weight) => {
      const weightMap = {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700'
      };
      return weightMap[weight] || weight;
    };

    // Apply custom properties
    root.style.setProperty('--primary', newTheme.primaryColor);
    root.style.setProperty('--secondary', newTheme.secondaryColor);
    root.style.setProperty('--accent', newTheme.accentColor);
    root.style.setProperty('--font-family', `'${newTheme.fontFamily}', sans-serif`);
    root.style.setProperty('--font-size', `${newTheme.fontSize}px`);
    root.style.setProperty('--font-weight', getFontWeightValue(newTheme.fontWeight));
    root.style.setProperty('--border-radius', `${newTheme.borderRadius}px`);
  };

  // Save theme to localStorage
  const saveTheme = (newTheme) => {
    localStorage.setItem('theme-customization', JSON.stringify(newTheme));
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Handle theme mode change
  const handleModeChange = (mode) => {
    const newTheme = { ...theme, mode };
    saveTheme(newTheme);
  };

  // Handle color change
  const handleColorChange = (colorType, color) => {
    const newTheme = { ...theme, [colorType]: color };
    saveTheme(newTheme);
  };

  // Handle font change
  const handleFontChange = (fontType, value) => {
    const newTheme = { ...theme, [fontType]: value };
    saveTheme(newTheme);
  };

  // Reset to default theme
  const resetTheme = () => {
    const defaultTheme = {
      mode: 'system',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 'normal',
      borderRadius: 8,
    };
    saveTheme(defaultTheme);
  };

  // Color presets
  const colorPresets = [
    { name: 'Blue', primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Green', primary: '#10b981', secondary: '#6b7280', accent: '#f59e0b' },
    { name: 'Purple', primary: '#8b5cf6', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Red', primary: '#ef4444', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Orange', primary: '#f97316', secondary: '#64748b', accent: '#3b82f6' },
    { name: 'Pink', primary: '#ec4899', secondary: '#64748b', accent: '#f59e0b' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Theme Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Customizer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-4 w-4" />
                Theme Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={theme.mode === 'light' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme.mode === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme.mode === 'system' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Color Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-4 w-4" />
                Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const newTheme = {
                          ...theme,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                          accentColor: preset.accent,
                        };
                        saveTheme(newTheme);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md border flex items-center gap-1.5 transition-colors ${
                        theme.primaryColor === preset.primary
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: preset.primary }} />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      id="primary-color"
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-12 h-8 rounded border"
                    />
                    <input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      id="secondary-color"
                      type="color"
                      value={theme.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="w-12 h-8 rounded border"
                    />
                    <input
                      type="text"
                      value={theme.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      id="accent-color"
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="w-12 h-8 rounded border"
                    />
                    <input
                      type="text"
                      value={theme.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="h-4 w-4" />
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            

              <div>
                <Label htmlFor="font-size">Font Size: {theme.fontSize}px</Label>
                <Slider
                  id="font-size"
                  min={12}
                  max={20}
                  step={1}
                  value={[theme.fontSize]}
                  onValueChange={([value]) => handleFontChange('fontSize', value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="border-radius">Border Radius: {theme.borderRadius}px</Label>
                <Slider
                  id="border-radius"
                  min={0}
                  max={20}
                  step={1}
                  value={[theme.borderRadius]}
                  onValueChange={([value]) => handleFontChange('borderRadius', value)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetTheme} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeCustomizer;
