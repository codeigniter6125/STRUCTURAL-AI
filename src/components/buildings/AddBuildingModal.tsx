import React, { useState, useRef } from 'react';
import { Building, BuildingType, BuildingKeyElement } from '../../types';
import { SHAHADRA_BUILDING_PRESETS } from '../../data/mockData';
import { uploadStructuralImage } from '../../lib/supabaseData';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  X,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  User,
  Phone,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBuilding: (building: Building) => void;
}

const BUILDING_TYPES: { type: BuildingType; label: string; description: string }[] = [
  { type: 'Residential', label: 'Residential', description: 'Apartment societies, builder floors, multi-family housing' },
  { type: 'Commercial', label: 'Commercial', description: 'Retail markets, office complexes, shopping arcades' },
  { type: 'Industrial', label: 'Industrial', description: 'Manufacturing plants, flatted factories, workshops' },
  { type: 'Hospital', label: 'Hospital', description: 'Public clinics, super-specialty hospitals, trauma centers' },
  { type: 'School', label: 'School', description: 'Government/private educational campuses, colleges' },
  { type: 'Government', label: 'Government', description: 'Administrative secretariats, public municipal facilities' },
  { type: 'Other', label: 'Other / Custom', description: 'Infrastructure bridges, viaducts, custom facilities' },
];

export const AddBuildingModal: React.FC<AddBuildingModalProps> = ({
  isOpen,
  onClose,
  onAddBuilding,
}) => {
  const { user } = useAuth();

  // Form states
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<BuildingType>('Residential');
  const [customType, setCustomType] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [locality, setLocality] = useState<string>('Shyam Enclave, Shahdara');
  const [city, setCity] = useState<string>('Shahdara');
  const [state, setState] = useState<string>('Delhi NCR');
  const [yearBuilt, setYearBuilt] = useState<number>(2020);
  const [totalFloors, setTotalFloors] = useState<string>('G+4 Floors');
  const [buildingUse, setBuildingUse] = useState<string>('Multi-Family Residential Housing');
  const [ownerName, setOwnerName] = useState<string>('East Delhi Municipal Corporation (EDMC)');
  const [contactName, setContactName] = useState<string>(user?.fullName || 'Er. Sandeep Mittal');
  const [contactPhone, setContactPhone] = useState<string>('+91 11 2234 5678');
  const [contactAgency, setContactAgency] = useState<string>('EDMC / Shahdara Civil Division');

  // Image states
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80'
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80'
  );
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Preset selection
  const handleApplyPreset = (preset: typeof SHAHADRA_BUILDING_PRESETS[0]) => {
    setName(preset.name);
    setType(preset.type as BuildingType);
    setAddress(preset.address);
    setLocality(preset.locality);
    setCity(preset.city);
    setState(preset.state);
    setYearBuilt(preset.yearBuilt);
    setTotalFloors(preset.totalFloorsOrSpans);
    setBuildingUse(preset.buildingUse);
    setOwnerName(preset.ownerName);
    setImageUrl(preset.image);
    setImagePreview(preset.image);
  };

  // Handle Image File Upload to Supabase Storage
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setIsUploadingImage(true);
    setErrorMsg(null);

    try {
      const result = await uploadStructuralImage(file, user?.id || 'anon', 'buildings');
      if (result.url) {
        setImageUrl(result.url);
        setImagePreview(result.url);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setErrorMsg('Could not upload image to storage. Using fallback preview.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a building name.');
      return;
    }

    setIsSubmitting(true);

    const generatedCode = `BLD-${city.substring(0, 3).toUpperCase()}-${type.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveType = type === 'Other' && customType.trim() ? customType.trim() : type;

    // Default structural key elements for new building
    const defaultElements: BuildingKeyElement[] = [
      { code: 'C-01', name: 'Ground Floor Primary Column C-01', type: 'Column', condition: 'Unassessed' },
      { code: 'B-01', name: 'Plinth Tie Beam B-01', type: 'Beam', condition: 'Unassessed' },
      { code: 'S-01', name: 'First Floor Suspended Slab S-01', type: 'Slab', condition: 'Unassessed' },
      { code: 'F-01', name: 'Isolated Raft/Pad Foundation F-01', type: 'Foundation', condition: 'Unassessed' },
    ];

    const newBuilding: Building = {
      id: `bld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user?.id || 'default_user',
      code: generatedCode,
      name: name.trim(),
      type: effectiveType,
      customType: type === 'Other' ? customType.trim() : undefined,
      address: address.trim() || `${locality}, ${city}`,
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      yearBuilt: Number(yearBuilt) || 2020,
      totalFloorsOrSpans: totalFloors.trim() || 'G+4 Floors',
      buildingUse: buildingUse.trim() || `${effectiveType} Facility`,
      ownerName: ownerName.trim() || 'Private / Municipal Authority',
      structuralSystem: 'Cast-in-situ Reinforced Concrete (RCC) Moment Resisting Frame',
      // Strict requirement: New building is NOT ASSESSED / UNASSESSED / 0 defects
      totalInspections: 0,
      healthIndex: 100,
      riskStatus: 'Unassessed',
      criticalDefectsCount: 0,
      activeRemediations: 0,
      thumbnail: imageUrl,
      contactOfficer: {
        name: contactName.trim() || 'Executive Engineer',
        title: 'Divisional Engineer',
        phone: contactPhone.trim() || '+91 11 2233 4455',
        agency: contactAgency.trim() || 'Municipal Civil Works',
      },
      keyElements: defaultElements,
      createdAt: new Date().toISOString(),
    };

    onAddBuilding(newBuilding);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">+ Register New Infrastructure Asset</h2>
              <p className="text-xs text-slate-400">
                Enroll building in Shahdara / East Delhi regional structural audit registry (IS 456 compliant)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Shahdara / East Delhi Presets */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Fill from Shahdara & East Delhi Presets</span>
              </div>
              <span className="text-[11px] text-slate-500">Click to autofill sample Indian building</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SHAHADRA_BUILDING_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-900 truncate group-hover:text-blue-700">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium text-slate-700 text-[10px]">
                      {preset.type}
                    </span>
                    <span className="truncate">{preset.locality}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span>1. Building Identification & Type</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Building / Complex Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shyam Enclave Heights (Block C)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Building Category / Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as BuildingType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900 bg-white font-medium"
                >
                  {BUILDING_TYPES.map((bt) => (
                    <option key={bt.type} value={bt.type}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Type when 'Other' selected */}
              {type === 'Other' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Custom Category Name *</label>
                  <input
                    type="text"
                    required
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="e.g. Highway Flyover / Transit Viaduct"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Primary Usage / Occupancy</label>
                  <input
                    type="text"
                    value={buildingUse}
                    onChange={(e) => setBuildingUse(e.target.value)}
                    placeholder="e.g. Multi-Family Housing / Outpatient Clinic"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Location & Specifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span>2. Geographic Locality & Dimensions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Address / Street */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Address / Street Location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 12, Main Vikas Marg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>

              {/* Locality */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Locality / Sector</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Shyam Enclave, Shahdara"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">City / District</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Shahdara / East Delhi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">State / Region</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Delhi NCR"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>

              {/* Year Built */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Year Built</label>
                <input
                  type="number"
                  min="1950"
                  max="2026"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>

              {/* Total Floors */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Total Floors / Spans</label>
                <input
                  type="text"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                  placeholder="e.g. G+4 Floors, Basement + G+6"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>

              {/* Owner */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Building Owner / Authority</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. East Delhi Municipal Corporation (EDMC) / Private Society"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 3. Image Upload & Supabase Storage */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span>3. Building Facade Photographic Record (Supabase Storage)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="p-3 rounded-full bg-white shadow-xs border border-slate-200 text-blue-600 mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {isUploadingImage ? 'Uploading to Supabase Storage...' : 'Upload Building Photo'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Drag & drop or browse image (JPEG, PNG). Uploads to Supabase Storage.
                </p>
              </div>

              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 h-[160px] flex items-center justify-center">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Building Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-[10px] text-white font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Ready</span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-xs flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                    <span>No image selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New Building Initial Status Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Initial Asset Audit Status: </span>
              Newly registered buildings start as <strong className="underline">NOT ASSESSED / UNASSESSED</strong> with 0 critical defects. You can launch forensic scans from the "New Inspection" tab at any time.
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Asset...' : 'Save & Register Building'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
