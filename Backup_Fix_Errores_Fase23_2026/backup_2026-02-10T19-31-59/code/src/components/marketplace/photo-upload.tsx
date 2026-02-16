import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';

interface PhotoUploadProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5 }: PhotoUploadProps) {
  const { language } = useLanguage();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [photos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Filter valid images
    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isImage && isValidSize;
    });

    // Limit to maxPhotos
    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      onPhotosChange([...photos, ...filesToAdd]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div>
      <label className="text-white font-semibold mb-2 block">
        {language === 'es' ? 'Fotos del Producto' : 'Product Photos'} 
        <span className="text-gray-400 text-sm ml-2">
          ({language === 'es' ? 'Máx' : 'Max'} {maxPhotos}, 5MB {language === 'es' ? 'c/u' : 'each'})
        </span>
      </label>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-cyan-500 bg-cyan-900/20' 
            : 'border-white/20 bg-white/5'
        } ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-500/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleChange}
          disabled={photos.length >= maxPhotos}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="photo-upload-input"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-10 h-10 text-gray-400 mb-2" />
          <p className="text-white text-sm mb-1">
            {language === 'es' 
              ? 'Arrastra fotos aquí o haz click para seleccionar' 
              : 'Drag photos here or click to select'}
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG • {language === 'es' ? 'Máximo' : 'Maximum'} 5MB
          </p>
        </div>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-white/20"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}/{photos.length}
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length >= maxPhotos && (
        <p className="text-xs text-yellow-400 mt-2">
          {language === 'es' 
            ? `Límite alcanzado (${maxPhotos} fotos)` 
            : `Limit reached (${maxPhotos} photos)`}
        </p>
      )}
    </div>
  );
}
