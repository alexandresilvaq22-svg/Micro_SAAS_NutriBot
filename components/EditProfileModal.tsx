import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Camera } from 'lucide-react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState<UserProfile>(user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form data when user prop changes or modal opens
  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'avatarUrl' || name === 'id' ? value : Number(value)
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatarUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Editar Perfil</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-2">
              <div 
                className="relative group cursor-pointer"
                onClick={handleImageClick}
                title="Clique para alterar a foto"
              >
                <img 
                  src={formData?.avatarUrl || "https://via.placeholder.com/200"} 
                  alt="Preview" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-50 shadow-sm group-hover:border-emerald-200 transition-colors"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">Clique na foto para alterar</span>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData?.name || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Idade</label>
                <input 
                  type="number" 
                  name="age"
                  value={formData?.age || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                <input 
                  type="number" 
                  name="weight"
                  step="0.1"
                  value={formData?.weight || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Altura (cm)</label>
                <input 
                  type="number" 
                  name="height"
                  value={formData?.height || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Goals Section */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-emerald-600 mb-3">Suas Metas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meta Calórica</label>
                  <input 
                    type="number" 
                    name="goalCalories"
                    value={formData?.goalCalories || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-emerald-200 bg-emerald-50/30 text-slate-900 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meta Proteica (g)</label>
                  <input 
                    type="number" 
                    name="goalProtein"
                    value={formData?.goalProtein || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-lime-200 bg-lime-50/30 text-slate-900 rounded-lg text-sm focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="profile-form"
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-200 transition-all transform hover:translate-y-px"
          >
            <Save size={16} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;