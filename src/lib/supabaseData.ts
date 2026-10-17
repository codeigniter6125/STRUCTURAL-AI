import { supabase, isSupabaseConfigured } from './supabase';
import { Building, Inspection, Defect, TelemetryRecord, AuditReport, AuthUser } from '../types';
import { INITIAL_BUILDINGS, INITIAL_INSPECTIONS, INITIAL_TELEMETRY, INITIAL_REPORTS } from '../data/mockData';

// User-scoped LocalStorage keys to guarantee multi-account isolation and persistence across reloads
const getStorageKey = (prefix: string, userId: string = 'default') => `structural_ai_${prefix}_${userId}`;

/**
 * Storage API: Upload inspection or building image to Supabase Storage 'structural-images' bucket
 */
export async function uploadStructuralImage(
  file: File,
  userId: string,
  folder: 'buildings' | 'inspections' = 'inspections'
): Promise<{ url: string; error?: string }> {
  try {
    if (isSupabaseConfigured && supabase) {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('structural-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('structural-images')
          .getPublicUrl(fileName);
        
        if (publicUrlData?.publicUrl) {
          return { url: publicUrlData.publicUrl };
        }
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload fallback triggered:', err);
  }

  // Fallback to local Data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({ url: e.target?.result as string });
    };
    reader.onerror = () => {
      resolve({ url: '', error: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * PROFILES: Sync profile to Supabase & Local Cache
 */
export async function syncUserProfile(user: AuthUser): Promise<void> {
  if (!user?.id) return;

  try {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').upsert({
        id: user.id,
        user_id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        organization: user.organization,
        badge_number: user.badgeNumber,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not sync profile to remote table:', err);
  }
}

/**
 * BUILDINGS: Fetch user buildings strictly belonging to the authenticated user
 */
export async function fetchUserBuildings(userId: string): Promise<Building[]> {
  const localKey = getStorageKey('buildings', userId);
  
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: Building[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          code: row.code,
          name: row.name,
          type: row.type,
          customType: row.custom_type,
          address: row.address,
          locality: row.locality,
          city: row.city,
          state: row.state,
          yearBuilt: row.year_built,
          totalFloorsOrSpans: row.total_floors,
          buildingUse: row.building_use,
          ownerName: row.owner_name,
          structuralSystem: row.structural_system,
          totalInspections: row.total_inspections || 0,
          healthIndex: row.health_index ?? 100,
          riskStatus: row.risk_status || 'Unassessed',
          criticalDefectsCount: row.critical_defects_count || 0,
          activeRemediations: row.active_remediations || 0,
          thumbnail: row.thumbnail || 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80',
          contactOfficer: row.contact_officer || {
            name: 'Zonal Engineer',
            title: 'Lead Auditor',
            phone: '+91 11 2345 6789',
            agency: 'CPWD / PWD Delhi',
          },
          keyElements: row.key_elements || [],
          createdAt: row.created_at,
        }));
        
        localStorage.setItem(localKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Remote buildings fetch fallback to user-scoped cache:', err);
    }
  }

  // Load from isolated user-scoped local storage if offline
  const saved = localStorage.getItem(localKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local user buildings', e);
    }
  }

  return [];
}

/**
 * BUILDINGS: Save or add a single building
 */
export async function saveUserBuilding(userId: string, building: Building): Promise<Building> {
  const localKey = getStorageKey('buildings', userId);
  const current = await fetchUserBuildings(userId);
  const updated = [building, ...current.filter((b) => b.id !== building.id)];
  
  localStorage.setItem(localKey, JSON.stringify(updated));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('buildings').upsert({
        id: building.id,
        user_id: userId,
        code: building.code,
        name: building.name,
        type: building.type,
        custom_type: building.customType,
        address: building.address,
        locality: building.locality,
        city: building.city,
        state: building.state,
        year_built: building.yearBuilt,
        total_floors: building.totalFloorsOrSpans,
        building_use: building.buildingUse,
        owner_name: building.ownerName,
        structural_system: building.structuralSystem,
        total_inspections: building.totalInspections,
        health_index: building.healthIndex,
        risk_status: building.riskStatus,
        critical_defects_count: building.criticalDefectsCount,
        active_remediations: building.activeRemediations,
        thumbnail: building.thumbnail,
        contact_officer: building.contactOfficer,
        key_elements: building.keyElements,
        created_at: building.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not write building to Supabase table:', err);
    }
  }

  return building;
}

export async function deleteUserBuilding(userId: string, buildingId: string): Promise<boolean> {
  const localKey = getStorageKey('buildings', userId);
  const current = await fetchUserBuildings(userId);
  const updated = current.filter((b) => b.id !== buildingId);
  localStorage.setItem(localKey, JSON.stringify(updated));

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('buildings').delete().eq('id', buildingId).eq('user_id', userId);
      await supabase.from('inspections').delete().eq('building_id', buildingId).eq('user_id', userId);
      await supabase.from('defects').delete().eq('building_id', buildingId).eq('user_id', userId);
      await supabase.from('reports').delete().eq('building_id', buildingId).eq('user_id', userId);
      await supabase.from('telemetry').delete().eq('building_id', buildingId).eq('user_id', userId);
    } catch (err) {
      console.warn('Failed to delete building from Supabase:', err);
      return false;
    }
  }

  return true;
}

/**
 * INSPECTIONS: Fetch user inspections strictly belonging to the authenticated user
 */
export async function fetchUserInspections(userId: string): Promise<Inspection[]> {
  const localKey = getStorageKey('inspections', userId);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: Inspection[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          inspectionCode: row.inspection_code,
          buildingId: row.building_id,
          buildingName: row.building_name,
          buildingCode: row.building_code,
          element: row.element,
          locationDetails: row.location_details,
          inspectorName: row.inspector_name,
          inspectorBadge: row.inspector_badge,
          inspectorRole: row.inspector_role,
          date: row.date,
          status: row.status,
          structuralHealthIndex: row.structural_health_index,
          riskScore: row.risk_score,
          overallRiskLevel: row.overall_risk_level,
          totalDefectCoveragePercent: row.total_defect_coverage_percent,
          diagnosisSummary: row.diagnosis_summary,
          safetyPrecautions: row.safety_precautions || [],
          defects: row.defects || [],
          originalImage: row.original_image,
          notes: row.notes,
          createdAt: row.created_at,
        }));

        localStorage.setItem(localKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Remote inspections fetch fallback to user-scoped cache:', err);
    }
  }

  const saved = localStorage.getItem(localKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local user inspections', e);
    }
  }

  return [];
}

/**
 * INSPECTIONS: Save a new inspection and its itemized defects + report
 */
export async function saveUserInspection(userId: string, inspection: Inspection): Promise<Inspection> {
  const localKey = getStorageKey('inspections', userId);
  const current = await fetchUserInspections(userId);
  const updated = [inspection, ...current.filter((i) => i.id !== inspection.id)];
  localStorage.setItem(localKey, JSON.stringify(updated));

  // Also update target building's metrics in cache and database
  try {
    const currentBuildings = await fetchUserBuildings(userId);
    const targetBuilding = currentBuildings.find(
      (b) => b.id === inspection.buildingId || b.code === inspection.buildingCode
    );

    if (targetBuilding) {
      const updatedBuilding: Building = {
        ...targetBuilding,
        healthIndex: Math.min(targetBuilding.healthIndex, inspection.structuralHealthIndex),
        riskStatus:
          inspection.overallRiskLevel === 'Critical'
            ? 'Critical'
            : inspection.overallRiskLevel === 'High' && targetBuilding.riskStatus !== 'Critical'
            ? 'High'
            : targetBuilding.riskStatus === 'Unassessed'
            ? inspection.overallRiskLevel
            : targetBuilding.riskStatus,
        totalInspections: (targetBuilding.totalInspections || 0) + 1,
        criticalDefectsCount:
          (targetBuilding.criticalDefectsCount || 0) +
          (inspection.defects?.filter((d) => d.severity === 'Critical' || d.severity === 'High').length || 0),
      };

      // Save updated building to cache & database
      await saveUserBuilding(userId, updatedBuilding);
    }
  } catch (bldErr) {
    console.warn('Could not auto-update building metrics on inspection save:', bldErr);
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      // 1. Insert/Upsert Inspection
      await supabase.from('inspections').upsert({
        id: inspection.id,
        user_id: userId,
        inspection_code: inspection.inspectionCode,
        building_id: inspection.buildingId,
        building_name: inspection.buildingName,
        building_code: inspection.buildingCode,
        element: inspection.element,
        location_details: inspection.locationDetails,
        inspector_name: inspection.inspectorName,
        inspector_badge: inspection.inspectorBadge,
        inspector_role: inspection.inspectorRole,
        date: inspection.date,
        status: inspection.status,
        structural_health_index: inspection.structuralHealthIndex,
        risk_score: inspection.riskScore,
        overall_risk_level: inspection.overallRiskLevel,
        total_defect_coverage_percent: inspection.totalDefectCoveragePercent,
        diagnosis_summary: inspection.diagnosisSummary,
        safety_precautions: inspection.safetyPrecautions,
        defects: inspection.defects,
        original_image: inspection.originalImage,
        notes: inspection.notes,
        created_at: inspection.createdAt || new Date().toISOString(),
      });

      // 2. Insert Itemized Defects to 'defects' table
      if (inspection.defects && inspection.defects.length > 0) {
        for (const def of inspection.defects) {
          await supabase.from('defects').upsert({
            id: def.id || `def_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            user_id: userId,
            inspection_id: inspection.id,
            building_id: inspection.buildingId,
            type: def.type,
            confidence: def.confidence,
            severity: def.severity,
            box2d: def.box2d,
            estimated_length_mm: def.estimatedLengthMm,
            estimated_width_mm: def.estimatedWidthMm,
            coverage_percent: def.coveragePercent,
            technical_description: def.technicalDescription,
            standards_reference: def.standardsReference,
            remediation_protocol: def.remediationProtocol,
            created_at: new Date().toISOString(),
          });
        }
      }

      // 3. Automatically record audit report in 'reports' table
      await supabase.from('reports').upsert({
        id: `rep_${inspection.id}`,
        user_id: userId,
        inspection_id: inspection.id,
        building_id: inspection.buildingId,
        report_number: `CPWD-IS456-${inspection.inspectionCode.replace('INSP-', '')}`,
        title: `IS 456 Forensic Audit Report: ${inspection.element}`,
        audit_standard: 'IS 456:2000 & CPWD Maintenance Manual',
        status: inspection.overallRiskLevel === 'Critical' ? 'Remediation Mandated' : 'Certified',
        certified_by: `${inspection.inspectorName} (${inspection.inspectorBadge})`,
        certificate_hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        summary: inspection.diagnosisSummary,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not write inspection to Supabase table:', err);
    }
  }

  return inspection;
}

/**
 * TELEMETRY: Fetch user telemetry records strictly for the authenticated user
 */
export async function fetchUserTelemetry(userId: string): Promise<TelemetryRecord[]> {
  const localKey = getStorageKey('telemetry', userId);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('telemetry')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          buildingId: row.building_id,
          sensorId: row.sensor_id,
          elementCode: row.element_code,
          metricType: row.metric_type,
          readingValue: row.reading_value,
          unit: row.unit,
          thresholdWarning: row.threshold_warning,
          thresholdCritical: row.threshold_critical,
          status: row.status,
          recordedAt: row.recorded_at,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn('Telemetry remote fetch fallback to user-scoped cache:', err);
    }
  }

  const saved = localStorage.getItem(localKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local user telemetry', e);
    }
  }

  return [];
}

/**
 * REPORTS: Fetch user reports strictly for the authenticated user
 */
export async function fetchUserReports(userId: string): Promise<AuditReport[]> {
  const localKey = getStorageKey('reports', userId);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          inspectionId: row.inspection_id,
          buildingId: row.building_id,
          reportNumber: row.report_number,
          title: row.title,
          auditStandard: row.audit_standard,
          status: row.status,
          certifiedBy: row.certified_by,
          certificateHash: row.certificate_hash,
          summary: row.summary,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn('Reports remote fetch fallback to user-scoped cache:', err);
    }
  }

  const saved = localStorage.getItem(localKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local user reports', e);
    }
  }

  return [];
}
