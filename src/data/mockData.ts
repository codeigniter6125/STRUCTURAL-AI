import { Building, Inspection, SampleStructuralImage, TelemetryRecord, AuditReport } from '../types';

export const SHAHADRA_BUILDING_PRESETS = [
  {
    name: 'Navkranti Apartments (Block C)',
    type: 'Residential',
    address: 'Plot 12, Shyam Enclave, Near GT Road',
    locality: 'Shyam Enclave, Shahdara',
    city: 'Shahdara',
    state: 'Delhi NCR',
    yearBuilt: 2017,
    totalFloorsOrSpans: 'G+6 Floors',
    buildingUse: 'Multi-Family Residential Housing Society',
    ownerName: 'Shyam Enclave RWA & Housing Cooperative',
    image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Jhilmil Industrial Flatted Factory Complex (Zone-IV)',
    type: 'Industrial',
    address: 'Block A, Jhilmil Industrial Area',
    locality: 'Jhilmil, Shahdara',
    city: 'Shahdara',
    state: 'Delhi NCR',
    yearBuilt: 2012,
    totalFloorsOrSpans: 'G+3 Floors Heavy RCC',
    buildingUse: 'Precision Tooling & Light Engineering Workshop',
    ownerName: 'DSIIDC / Private Industrial Allottees',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Guru Teg Bahadur (GTB) Hospital - Super Specialty Block E',
    type: 'Hospital',
    address: 'Tahirpur Road, Dilshad Garden',
    locality: 'Dilshad Garden / Shahdara Border',
    city: 'East Delhi',
    state: 'Delhi NCR',
    yearBuilt: 2008,
    totalFloorsOrSpans: 'Basement + G+7 Floors',
    buildingUse: 'Trauma Care & Critical Inpatient Ward',
    ownerName: 'Directorate of Health Services, GNCTD',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sarvodaya Co-ed Senior Secondary School Campus',
    type: 'School',
    address: 'Main Road, Kanti Nagar',
    locality: 'Kanti Nagar, Shahdara',
    city: 'Shahdara',
    state: 'Delhi NCR',
    yearBuilt: 2005,
    totalFloorsOrSpans: 'G+3 Floors RCC Frame',
    buildingUse: 'Senior Secondary Education (1,400 Students)',
    ownerName: 'Directorate of Education, Govt. of Delhi',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Chhota Bazaar Commercial Plaza & Wholesale Hub',
    type: 'Commercial',
    address: 'Main Market, Chhota Bazaar',
    locality: 'Shahdara Old Market',
    city: 'Shahdara',
    state: 'Delhi NCR',
    yearBuilt: 2011,
    totalFloorsOrSpans: 'G+4 Floors Mercantile',
    buildingUse: 'Retail Wholesale & Multi-Level Commerce',
    ownerName: 'Shahdara Traders Association & Freehold Owners',
    image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80',
  },
];

export const SAMPLE_IMAGES: SampleStructuralImage[] = [
  {
    id: 'sample_shear_crack',
    title: 'Diagonal Shear Crack (45° in RC Beam)',
    category: 'Shear Failure Hazard',
    element: 'Beam B-12 (Transfer Girder)',
    description: '45-degree tensile diagonal shear cracking propagating under cyclic floor loading. Exceeds IS 456 permissible limits.',
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1000&q=80',
    defaultBuildingCode: 'B-203',
  },
  {
    id: 'sample_spalling_rebar',
    title: 'Severe Rebar Corrosion & Concrete Spalling',
    category: 'Corrosion Distress',
    element: 'Column C-04 (Basement B2)',
    description: 'Longitudinal rebar corrosion expansion causing extensive cover spalling, delamination, and cross-section loss.',
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80',
    defaultBuildingCode: 'B-203',
  },
  {
    id: 'sample_honeycomb',
    title: 'Concrete Honeycombing & Voids',
    category: 'Workmanship / Compaction Defect',
    element: 'Pier P-42 (Metro Viaduct)',
    description: 'Severe aggregate segregation and void entrapment due to inadequate vibratory compaction during pour.',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80',
    defaultBuildingCode: 'DMRC-V04',
  },
  {
    id: 'sample_efflorescence_moisture',
    title: 'Efflorescence & Active Water Ingress',
    category: 'Waterproofing Failure',
    element: 'Slab S-08 (Basement Retaining Wall)',
    description: 'Calcium salt crystallization from chronic water percolation through cold joints and micro-fissures.',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    defaultBuildingCode: 'B-203',
  },
  {
    id: 'sample_masonry_step_crack',
    title: 'Stepped Diagonal Settlement Crack',
    category: 'Foundation Distress',
    element: 'Tie Beam TB-02 (Jhilmil Industrial)',
    description: 'Differential sub-base settlement causing stepped diagonal shear separation across masonry infill and plinth beam.',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80',
    defaultBuildingCode: 'C-301',
  },
];

export const SAMPLE_STRUCTURAL_IMAGES = SAMPLE_IMAGES;

export const INITIAL_BUILDINGS: Building[] = [];

export const INITIAL_INSPECTIONS: Inspection[] = [];

export const INITIAL_TELEMETRY: TelemetryRecord[] = [];

export const INITIAL_REPORTS: AuditReport[] = [];

export const MOCK_BUILDINGS = INITIAL_BUILDINGS;
export const MOCK_INSPECTIONS = INITIAL_INSPECTIONS;
