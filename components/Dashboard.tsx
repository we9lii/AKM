import React, { useState, useRef, useEffect } from 'react';
import { User, UploadedFile } from '../types';
import { UploadCloud, File as FileIcon, Image as ImageIcon, Film, X, ShieldCheck, LogOut, Wifi, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

// ==========================================
// SYSTEM CONFIGURATION
// ==========================================
const CLOUD_NAME = 'dgmstaaly'; 
const UPLOAD_PRESET = 'ml_default'; 
// Connected to the live Render Backend
const BACKEND_URL = 'https://akm-kz8a.onrender.com'; 
// ==========================================

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [serverStatus, setServerStatus] = useState<'offline' | 'online'>('offline');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 0. SERVER MONITORING HOOK
  useEffect(() => {
    const pingServer = async () => {
        try {
            // Get basic platform info securely
            const platform = navigator.platform;
            
            // Send heartbeat to backend
            await fetch(`${BACKEND_URL}/api/monitor/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    userId: user.email, // using email as ID for now
                    action: 'DASHBOARD_ACCESS',
                    platform: platform
                })
            });
            setServerStatus('online');
        } catch (error) {
            console.warn("Backend server connection failed:", error);
            setServerStatus('offline');
        }
    };

    pingServer();
  }, [user]);

  // 1. Fetch files from Supabase on load
  useEffect(() => {
    const fetchFiles = async () => {
      if (!supabase) return;
      
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const loadedFiles: UploadedFile[] = data.map(f => ({
            id: f.id,
            name: f.file_name,
            size: f.file_size,
            type: f.file_type || 'unknown',
            previewUrl: f.file_url, // For Cloudinary images, the URL is the preview
            secureUrl: f.file_url,
            progress: 100,
            status: 'completed'
          }));
          setFiles(loadedFiles);
        }
      } catch (err) {
        console.error("Error fetching files:", err);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchFiles();
  }, []);

  // 2. Save file metadata to Supabase
  const saveFileToDatabase = async (fileData: any) => {
    if (!supabase) return;

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('files').insert({
      user_id: user.id,
      file_name: fileData.name,
      file_url: fileData.secureUrl,
      file_type: fileData.type,
      file_size: fileData.size
    });

    if (error) console.error("Error saving to DB:", error);
  };

  // 3. Delete file from Supabase
  const removeFile = async (id: string) => {
    // Optimistic UI update
    setFiles(prev => prev.filter(f => f.id !== id));

    if (supabase) {
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) {
        console.error("Error deleting from DB:", error);
        // Optionally revert UI if needed, but for now we keep it simple
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadFileToCloudinary = (file: File, tempId: string) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.error("System Error: Cloudinary configuration missing.");
      setFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: 'error', progress: 0 } : f));
      return;
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress: percentComplete } : f));
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        
        // Update local state
        setFiles(prev => prev.map(f => 
          f.id === tempId ? { 
            ...f, 
            status: 'completed', 
            progress: 100, 
            secureUrl: response.secure_url,
            publicId: response.public_id,
            previewUrl: response.secure_url
          } : f
        ));

        // SAVE TO DATABASE
        await saveFileToDatabase({
          name: file.name,
          secureUrl: response.secure_url,
          type: file.type,
          size: file.size
        });
        
        // Notify backend of upload action
        fetch(`${BACKEND_URL}/api/monitor/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user.username,
                userId: user.email,
                action: `UPLOADED_FILE: ${file.name}`,
                platform: navigator.platform
            })
        }).catch(() => {});

      } else {
        console.error('Upload Error:', xhr.responseText);
        const errorMsg = xhr.status === 400 || xhr.status === 401 
          ? "Upload Failed. Check presets." 
          : "Connection Error";
        
        console.warn(errorMsg);
        setFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: 'error', progress: 0 } : f));
      }
    };

    xhr.onerror = () => {
      setFiles(prev => prev.map(f => f.id === tempId ? { ...f, status: 'error', progress: 0 } : f));
    };

    xhr.send(formData);
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = Array.from(fileList).map(file => {
      // Create a temporary ID for the UI
      const tempId = Math.random().toString(36).substr(2, 9);
      return {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: 'uploading'
      };
    });

    setFiles(prev => [...newFiles, ...prev]);

    // Trigger upload for each file
    Array.from(fileList).forEach((file, index) => {
      uploadFileToCloudinary(file, newFiles[index].id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const formatSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return 'Unknown';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (!type) return <FileIcon className="w-6 h-6 text-cyan-400" />;
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-purple-400" />;
    if (type.startsWith('video/')) return <Film className="w-6 h-6 text-red-400" />;
    return <FileIcon className="w-6 h-6 text-cyan-400" />;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20 relative">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">
            مرحباً، <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{user.name}</span> 👋
          </h2>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
             <span>ID: {user.username}</span>
             <span className="text-gray-700">|</span>
             <div className="flex items-center gap-1.5">
               <span className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                 <Wifi className="w-3 h-3" /> LINKED: {CLOUD_NAME.toUpperCase()}
               </span>
               <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-mono transition-colors ${serverStatus === 'online' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}>
                 SERVER: {serverStatus === 'online' ? 'CONNECTED' : 'DISCONNECTED'}
               </span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={onLogout}
             className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-gray-400 transition-all"
             title="Logout"
           >
             <LogOut className="w-5 h-5" />
           </button>
           <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl text-white shadow-lg border-2 border-gray-800">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats/Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm">
             <p className="text-gray-400 text-xs mb-1 font-mono">CLOUD_STORAGE</p>
             <p className="text-xl font-bold text-white">
               ACTIVE
               <span className="text-xs text-gray-500 font-normal ml-2">/ {CLOUD_NAME}</span>
             </p>
             <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-cyan-500 h-full w-[2%] shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
             </div>
          </div>
          <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm">
             <p className="text-gray-400 text-xs mb-1 font-mono">TOTAL_NODES</p>
             <p className="text-xl font-bold text-white">{files.length} <span className="text-xs text-gray-500 font-normal">FILES</span></p>
          </div>
          <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm flex items-center justify-between">
             <div>
                <p className="text-gray-400 text-xs mb-1 font-mono">ENCRYPTION</p>
                <p className="text-xl font-bold text-emerald-400">AES-256</p>
             </div>
             <ShieldCheck className="w-10 h-10 text-emerald-500/20" />
          </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 group
          ${isDragging 
            ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01] shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]' 
            : 'border-gray-700 hover:border-indigo-400 hover:bg-gray-800/50 bg-gray-900/40'
          }
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={handleFileInputChange} 
        />
        
        <div className="flex flex-col items-center gap-5">
          <div className={`
            p-5 rounded-full bg-gray-800 text-indigo-400 mb-2 transition-transform duration-300 border border-gray-700
            ${isDragging ? 'scale-110 text-cyan-400 border-cyan-500' : 'group-hover:scale-110 group-hover:text-indigo-300'}
          `}>
            <UploadCloud className="w-12 h-12" />
          </div>
          <div>
             <h3 className="text-2xl font-semibold text-gray-200 mb-2">INITIALIZE DATA UPLOAD</h3>
             <p className="text-gray-500 text-sm">Drag & drop files or click to browse system</p>
          </div>
          <div className="flex gap-3 mt-2">
            <span className="px-3 py-1 bg-gray-800 rounded text-[10px] font-mono text-gray-400 border border-gray-700">PNG</span>
            <span className="px-3 py-1 bg-gray-800 rounded text-[10px] font-mono text-gray-400 border border-gray-700">MP4</span>
            <span className="px-3 py-1 bg-gray-800 rounded text-[10px] font-mono text-gray-400 border border-gray-700">RAW</span>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
             <span className="w-2 h-6 bg-cyan-500 rounded-sm"></span>
             DATA STREAM
           </h3>
           {isLoadingFiles && (
             <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                FETCHING DATA...
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div 
              key={file.id} 
              className={`group relative bg-gray-800/60 backdrop-blur-md rounded-2xl p-4 shadow-sm border transition-all duration-300 overflow-hidden ${file.status === 'error' ? 'border-red-500/50' : 'border-gray-700/50 hover:border-indigo-500/50'}`}
            >
              {/* Status Badges */}
              {file.status === 'completed' && (
                <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono px-2 py-1 rounded-bl-lg border-b border-l border-emerald-500/30">
                  CLOUD_SECURE
                </div>
              )}
              {file.status === 'error' && (
                <div className="absolute top-0 right-0 bg-red-500/20 text-red-300 text-[9px] font-mono px-2 py-1 rounded-bl-lg border-b border-l border-red-500/30">
                  UPLOAD_FAILED
                </div>
              )}
              {file.status === 'uploading' && (
                <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-300 text-[9px] font-mono px-2 py-1 rounded-bl-lg border-b border-l border-indigo-500/30 animate-pulse">
                  TRANSMITTING...
                </div>
              )}

              <div className="absolute top-3 left-3 z-10 flex gap-2">
                <button 
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 rounded-full bg-gray-700/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all backdrop-blur-sm"
                    title="Delete Permanently"
                >
                    <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="h-14 w-14 rounded-xl bg-gray-900/80 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-700 relative">
                  {file.previewUrl && (file.type?.startsWith('image/') || file.type === 'unknown') ? (
                    <img src={file.previewUrl} alt="preview" className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 text-sm truncate group-hover:text-indigo-300 transition-colors">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    {formatSize(file.size)} 
                    {file.status === 'error' && <span className="text-red-400 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Check Presets</span>}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mt-3 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 
                        ${file.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 
                          file.status === 'error' ? 'bg-red-500' : 'bg-indigo-500 relative'}
                      `}
                      style={{ width: `${file.progress}%` }}
                    >
                      {file.status === 'uploading' && (
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] w-full transform -skew-x-12"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!isLoadingFiles && files.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-2xl border-2 border-dashed border-gray-800 bg-gray-900/20">
              <p className="text-gray-500 font-mono text-sm">NO DATA PACKETS FOUND IN SECTOR</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};