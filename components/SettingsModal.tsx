import React, { useState, useEffect } from 'react';
import { CloudinaryConfig } from '../types';
import { Settings, Save, Server, Database, X } from 'lucide-react';
import { Input } from './ui/Input';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudinaryConfig;
  onSave: (config: CloudinaryConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<CloudinaryConfig>(config);

  useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-md bg-[#0b1121] border border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gray-900/50 p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Server className="w-5 h-5" />
            <h2 className="font-brand tracking-widest text-lg">SERVER NODE CONFIG</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-900/10 border-l-2 border-blue-500 p-3 text-xs text-blue-200 font-mono mb-4">
            <p>To enable remote storage, configure your Cloudinary node credentials.</p>
            <p className="mt-1 opacity-70">Settings > Upload > Upload presets > Mode: Unsigned</p>
          </div>

          <Input
            label="CLOUD NAME"
            name="cloudName"
            value={formData.cloudName}
            onChange={handleChange}
            placeholder="e.g. dyx...123"
            className="font-mono"
          />

          <Input
            label="UPLOAD PRESET (UNSIGNED)"
            name="uploadPreset"
            value={formData.uploadPreset}
            onChange={handleChange}
            placeholder="e.g. ml_default"
            className="font-mono"
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Save className="w-4 h-4" />
              <span>ESTABLISH LINK</span>
            </button>
          </div>
        </form>

        {/* Decor */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-500/10 blur-3xl -z-10"></div>
      </div>
    </div>
  );
};