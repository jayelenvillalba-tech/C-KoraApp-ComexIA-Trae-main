import { useState } from "react";
import { X, Package, MapPin, Calendar, FileText, DollarSign, Ship, Leaf, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/use-language";
import PhotoUpload from "./photo-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PostFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const INCOTERMS = ['FOB', 'CIF', 'EXW', 'DDP', 'FCA', 'CPT', 'DAP'];
const SECTORS = ['Agriculture', 'Technology', 'Transport', 'Manufacturing', 'Services', 'Other'];

export default function PostForm({ onClose, onSubmit }: PostFormProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [postCategory, setPostCategory] = useState<'trade' | 'social'>('trade');
  const [photos, setPhotos] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    postType: "buy" as "buy" | "sell" | "social_post" | "social_event",
    hsCode: "",
    productName: "",
    quantity: "",
    originCountry: "",
    destinationCountry: "",
    deadlineDays: "",
    requirements: "",
    certifications: "",
    // Smart Fields
    sector: "",
    subcategory: "",
    incoterm: "",
    price: "",
    currency: "USD",
    isEcological: false
  });

  const handleCategorySelect = (category: 'trade' | 'social') => {
    setPostCategory(category);
    if (category === 'trade') {
      setFormData({ ...formData, postType: 'buy' });
    } else {
      setFormData({ ...formData, postType: 'social_post' });
    }
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let uploadedPhotoUrls: string[] = [];

      // Upload photos if any
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => {
          formData.append('photos', photo);
        });

        const uploadRes = await fetch('/api/marketplace/upload-photos', {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedPhotoUrls = uploadData.urls;
        }
      }
      
      const postData = {
        ...formData,
        requirements: formData.requirements.split(',').map(r => r.trim()).filter(Boolean),
        certifications: formData.certifications.split(',').map(c => c.trim()).filter(Boolean),
        deadlineDays: formData.deadlineDays ? parseInt(formData.deadlineDays) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        createdAt: new Date(),
        status: "active",
        photos: uploadedPhotoUrls
      };
      
      onSubmit(postData);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // ... (useTemplate function remains same)

  // ... (Step 1 remains same)
  
  // Step 2 starts here in original file, but I need to target the JSX inside the return
  // Since replace_file_content works on lines, I will target the handleSubmit block first
  // and then a separate call for JSX insertion.
  
  // WAIT, I can't do multiple replace blocks easily if I don't know exact lines for JSX.
  // I'll stick to replacing handleSubmit first.


  const useTemplate = (template: 'soy' | 'beef' | 'tech') => {
    const templates = {
      soy: {
        hsCode: "120190",
        productName: language === 'es' ? "Porotos de Soja Orgánica" : "Organic Soybeans",
        quantity: "10 toneladas",
        sector: "Agriculture",
        subcategory: "Soybeans",
        incoterm: "FOB",
        price: "450",
        currency: "USD",
        isEcological: true,
        certifications: language === 'es' 
          ? "SENASA, Orgánico Certificado, Contenido Regional 60% MERCOSUR"
          : "SENASA, Certified Organic, 60% Regional Content MERCOSUR"
      },
      beef: {
        hsCode: "0202",
        productName: language === 'es' ? "Carne Bovina Premium" : "Premium Beef",
        quantity: "200 toneladas",
        sector: "Agriculture",
        subcategory: "Beef",
        incoterm: "CIF",
        price: "3500",
        currency: "USD",
        certifications: "SENASA, Halal, Trazabilidad Blockchain"
      },
      tech: {
        hsCode: "8471",
        productName: language === 'es' ? "Computadoras Portátiles" : "Laptop Computers",
        quantity: "500 unidades",
        sector: "Technology",
        incoterm: "DDP",
        price: "800",
        currency: "USD"
      }
    };
    
    setFormData({ ...formData, ...templates[template] });
  };

  // Step 1: Category Selection
  if (step === 'type') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-slate-900 to-purple-900 border-white/20 max-w-2xl w-full">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl">
                {language === 'es' ? '📝 Tipo de Publicación' : '📝 Post Type'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trade Post */}
              <button
                onClick={() => handleCategorySelect('trade')}
                className="group p-6 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/30 rounded-lg hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
              >
                <div className="text-center space-y-3">
                  <div className="text-5xl">💼</div>
                  <h3 className="text-xl font-bold text-white">
                    {language === 'es' ? 'Negocio' : 'Trade'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {language === 'es' 
                      ? 'Compra/Venta de bienes o servicios' 
                      : 'Buy/Sell goods or services'}
                  </p>
                  <div className="text-xs text-cyan-400">
                    {language === 'es' ? 'Incluye: HS Code, Incoterms, Precio' : 'Includes: HS Code, Incoterms, Price'}
                  </div>
                </div>
              </button>

              {/* Social Post */}
              <button
                onClick={() => handleCategorySelect('social')}
                className="group p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/30 rounded-lg hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                <div className="text-center space-y-3">
                  <div className="text-5xl">📢</div>
                  <h3 className="text-xl font-bold text-white">
                    {language === 'es' ? 'Social' : 'Social'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {language === 'es' 
                      ? 'Eventos, noticias, anuncios' 
                      : 'Events, news, announcements'}
                  </p>
                  <div className="text-xs text-purple-400">
                    {language === 'es' ? 'Formato simple: Título + Descripción' : 'Simple format: Title + Description'}
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Form
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-slate-900 to-purple-900 border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">
                {postCategory === 'trade' 
                  ? (language === 'es' ? '💼 Nueva Oportunidad Comercial' : '💼 New Trade Opportunity')
                  : (language === 'es' ? '📢 Nueva Publicación Social' : '📢 New Social Post')
                }
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('type')}
                className="text-xs text-gray-400 hover:text-white mt-1 h-auto p-0"
              >
                ← {language === 'es' ? 'Cambiar tipo' : 'Change type'}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {postCategory === 'trade' ? (
              <>
                {/* Templates */}
                <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300 font-semibold">
                      {language === 'es' ? 'Plantillas Rápidas' : 'Quick Templates'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => useTemplate('soy')}
                      className="text-xs bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      🌾 {language === 'es' ? 'Soja' : 'Soybeans'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => useTemplate('beef')}
                      className="text-xs bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      🥩 {language === 'es' ? 'Carne' : 'Beef'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => useTemplate('tech')}
                      className="text-xs bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      💻 Tech
                    </Button>
                  </div>
                </div>

                {/* Buy/Sell Toggle */}
                <div>
                  <label className="text-white font-semibold mb-3 block">
                    {language === 'es' ? 'Operación' : 'Operation'}
                  </label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={formData.postType === "buy" ? "default" : "outline"}
                      onClick={() => updateField("postType", "buy")}
                      className={formData.postType === "buy"
                        ? "flex-1 bg-green-600 hover:bg-green-700"
                        : "flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      }
                    >
                      🟢 {language === 'es' ? 'BUSCO Comprar' : 'BUYING'}
                    </Button>
                    <Button
                      type="button"
                      variant={formData.postType === "sell" ? "default" : "outline"}
                      onClick={() => updateField("postType", "sell")}
                      className={formData.postType === "sell"
                        ? "flex-1 bg-red-600 hover:bg-red-700"
                        : "flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      }
                    >
                      🔴 {language === 'es' ? 'VENDO' : 'SELLING'}
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      <Package className="w-4 h-4 inline mr-2" />
                      {language === 'es' ? 'Código HS *' : 'HS Code *'}
                    </label>
                    <Input
                      type="text"
                      placeholder="120190"
                      value={formData.hsCode}
                      onChange={(e) => updateField("hsCode", e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      {language === 'es' ? 'Sector' : 'Sector'}
                    </label>
                    <Select value={formData.sector} onValueChange={(val) => updateField("sector", val)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-white font-semibold mb-2 block">
                    {language === 'es' ? 'Nombre del Producto *' : 'Product Name *'}
                  </label>
                  <Input
                    type="text"
                    placeholder={language === 'es' ? 'Ej: Porotos de Soja Orgánica' : 'Ex: Organic Soybeans'}
                    value={formData.productName}
                    onChange={(e) => updateField("productName", e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      {language === 'es' ? 'Cantidad' : 'Quantity'}
                    </label>
                    <Input
                      type="text"
                      placeholder="500 tons"
                      value={formData.quantity}
                      onChange={(e) => updateField("quantity", e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      <Ship className="w-4 h-4 inline mr-2" />
                      Incoterm
                    </label>
                    <Select value={formData.incoterm} onValueChange={(val) => updateField("incoterm", val)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="FOB" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOTERMS.map(term => (
                          <SelectItem key={term} value={term}>{term}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      {language === 'es' ? 'Precio/Unidad' : 'Price/Unit'}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="450"
                        value={formData.price}
                        onChange={(e) => updateField("price", e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                      <Select value={formData.currency} onValueChange={(val) => updateField("currency", val)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="ARS">ARS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {language === 'es' ? 'País Origen' : 'Origin Country'}
                    </label>
                    <Input
                      type="text"
                      placeholder="AR"
                      value={formData.originCountry}
                      onChange={(e) => updateField("originCountry", e.target.value.toUpperCase())}
                      maxLength={2}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-white font-semibold mb-2 block">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {language === 'es' ? 'País Destino' : 'Destination Country'}
                    </label>
                    <Input
                      type="text"
                      placeholder="CN"
                      value={formData.destinationCountry}
                      onChange={(e) => updateField("destinationCountry", e.target.value.toUpperCase())}
                      maxLength={2}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Ecological */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="ecological"
                    checked={formData.isEcological}
                    onChange={(e) => updateField("isEcological", e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10"
                  />
                  <label htmlFor="ecological" className="text-white flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-400" />
                    {language === 'es' ? 'Producto Ecológico/Orgánico' : 'Ecological/Organic Product'}
                  </label>
                </div>

                {/* Certifications */}
                <div>
                  <label className="text-white font-semibold mb-2 block">
                    <FileText className="w-4 h-4 inline mr-2" />
                    {language === 'es' ? 'Certificaciones (separadas por coma)' : 'Certifications (comma separated)'}
                  </label>
                  <Textarea
                    placeholder={language === 'es' 
                      ? 'Ej: SENASA, Orgánico, ISO 9001'
                      : 'Ex: SENASA, Organic, ISO 9001'}
                    value={formData.certifications}
                    onChange={(e) => updateField("certifications", e.target.value)}
                    rows={2}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Social Post Form */}
                <div>
                  <label className="text-white font-semibold mb-3 block">
                    {language === 'es' ? 'Tipo de Publicación Social' : 'Social Post Type'}
                  </label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={formData.postType === "social_post" ? "default" : "outline"}
                      onClick={() => updateField("postType", "social_post")}
                      className={formData.postType === "social_post"
                        ? "flex-1 bg-purple-600 hover:bg-purple-700"
                        : "flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      }
                    >
                      📝 {language === 'es' ? 'Publicación' : 'Post'}
                    </Button>
                    <Button
                      type="button"
                      variant={formData.postType === "social_event" ? "default" : "outline"}
                      onClick={() => updateField("postType", "social_event")}
                      className={formData.postType === "social_event"
                        ? "flex-1 bg-pink-600 hover:bg-pink-700"
                        : "flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      }
                    >
                      📅 {language === 'es' ? 'Evento' : 'Event'}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-white font-semibold mb-2 block">
                    {language === 'es' ? 'Título *' : 'Title *'}
                  </label>
                  <Input
                    type="text"
                    placeholder={language === 'es' ? 'Ej: Webinar: Exportar a China' : 'Ex: Webinar: Exporting to China'}
                    value={formData.productName}
                    onChange={(e) => updateField("productName", e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Photo Upload */}
                <div className="mb-6">
                  <PhotoUpload 
                    photos={photos} 
                    onPhotosChange={setPhotos} 
                    maxPhotos={5} 
                  />
                </div>

                <div>
                  <label className="text-white font-semibold mb-2 block">
                    {language === 'es' ? 'Descripción *' : 'Description *'}
                  </label>
                  <Textarea
                    placeholder={language === 'es' 
                      ? 'Describe tu evento o anuncio...'
                      : 'Describe your event or announcement...'}
                    value={formData.requirements}
                    onChange={(e) => updateField("requirements", e.target.value)}
                    rows={5}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {language === 'es' ? 'Publicar' : 'Publish'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
