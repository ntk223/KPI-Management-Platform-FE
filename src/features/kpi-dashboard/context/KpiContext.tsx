import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useAuth } from '../../auth';
import {
  Cycle,
  Department,
  Position,
  KpiTemplate,
  PositionBundle,
  KpiDocument,
  UserRole,
  CycleStatus,
  initialCycles,
  initialDepartments,
  initialPositions,
  initialKpiTemplates,
  initialPositionBundles,
  initialKpiDocuments
} from '../data/mockData';

export type ViewMode = 'MANAGER_VIEW' | 'PERSONAL_VIEW';

export interface ProgressLog {
  id: number;
  docId: number;
  docTitle: string;
  employeeName: string;
  valueDelta: number;
  justificationText: string;
  fileName?: string;
  timestamp: string;
}

interface KpiContextType {
  // Authentication & View Switching Role System
  currentUserRole: UserRole;
  managerViewMode: ViewMode;
  setManagerViewMode: (mode: ViewMode) => void;

  // Master Data
  cycles: Cycle[];
  departments: Department[];
  positions: Position[];
  kpiTemplates: KpiTemplate[];
  positionBundles: PositionBundle[];
  kpiDocuments: KpiDocument[];
  progressLogs: ProgressLog[];

  // Cycle Actions
  transitionCycleState: (cycleId: number, nextStatus: CycleStatus) => void;

  // Bundle Settings
  savePositionBundle: (positionId: number, templates: { templateId: number; defaultWeight: number }[]) => void;

  // Document Operations
  addKpiDocument: (doc: KpiDocument) => void;
  updateKpiDocumentProgress: (docId: number, valueDelta: number, justificationText: string, fileName?: string) => void;
  submitSelfEvaluation: (docId: number, selfScore: number, proofText: string) => void;
  evaluateEmployee: (docId: number, managerScore: number, finalScore: number) => void;
  applyPositionBundleToEmployee: (employeeId: number, employeeName: string, positionId: number, cycleId: number, parentDocId: number) => void;
  loadDocumentsForCycle?: (cycleId: number) => void;
}

const KpiContext = createContext<KpiContextType | undefined>(undefined);

export const KpiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const currentUserRole = useMemo<UserRole>(() => {
    if (!user || !user.roles || user.roles.length === 0) return 'EMPLOYEE';
    if (user.roles.includes('ADMIN')) return 'ADMIN';
    if (user.roles.includes('DIRECTOR')) return 'DIRECTOR';
    if (user.roles.includes('MANAGER')) return 'MANAGER';
    return 'EMPLOYEE';
  }, [user]);

  const [managerViewMode, setManagerViewMode] = useState<ViewMode>('MANAGER_VIEW');

  // Application Data States
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [kpiDocuments, setKpiDocuments] = useState<KpiDocument[]>(initialKpiDocuments);
  const [positionBundles, setPositionBundles] = useState<PositionBundle[]>(initialPositionBundles);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([
    {
      id: 1,
      docId: 302,
      docTitle: 'Doanh số bán hàng cá nhân Q3',
      employeeName: 'Lê Thị Sales',
      valueDelta: 700000000,
      justificationText: 'Ký kết thành công hợp đồng cung cấp phần mềm giai đoạn 1.',
      fileName: 'VinGroup_Contract_Signed.pdf',
      timestamp: '2026-06-15T09:30:00+07:00'
    },
    {
      id: 2,
      docId: 302,
      docTitle: 'Doanh số bán hàng cá nhân Q3',
      employeeName: 'Lê Thị Sales',
      valueDelta: 400000000,
      justificationText: 'Nhận tạm ứng đợt 2 và cập nhật doanh số ghi nhận thực tế.',
      fileName: 'VinGroup_Addendum_V2.pdf',
      timestamp: '2026-06-20T14:45:00+07:00'
    },
    {
      id: 3,
      docId: 300,
      docTitle: 'Phát triển mô hình LLM & API tối ưu hóa',
      employeeName: 'Nguyễn Văn AI',
      valueDelta: 2,
      justificationText: 'Submit thành công 2 bài báo nháp lên EasyChair của hội nghị.',
      fileName: 'LLM_Optimization_Draft.pdf',
      timestamp: '2026-06-18T10:15:00+07:00'
    }
  ]);

  // Read-only static references
  const departments = initialDepartments;
  const positions = initialPositions;
  const kpiTemplates = initialKpiTemplates;

  // Cycle Phase transitions
  const transitionCycleState = (cycleId: number, nextStatus: CycleStatus) => {
    setCycles(prev =>
      prev.map(c => (c.id === cycleId ? { ...c, status: nextStatus } : c))
    );
  };

  // Matrix Position Bundle assignments
  const savePositionBundle = (positionId: number, templates: { templateId: number; defaultWeight: number }[]) => {
    setPositionBundles(prev => {
      // Clear old bundle assignments for this position and append new ones
      const filtered = prev.filter(pb => pb.positionId !== positionId);
      const newBundles = templates.map(t => ({
        positionId,
        templateId: t.templateId,
        defaultWeight: t.defaultWeight,
      }));
      return [...filtered, ...newBundles];
    });
  };

  // Add Document
  const addKpiDocument = (doc: KpiDocument) => {
    setKpiDocuments(prev => [...prev, doc]);
  };

  // incremental update (log progress)
  const updateKpiDocumentProgress = (docId: number, valueDelta: number, justificationText: string, fileName?: string) => {
    let targetDocTitle = '';
    let targetEmployeeName = '';
    
    setKpiDocuments(prev => {
      return prev.map(doc => {
        if (doc.id === docId) {
          targetDocTitle = doc.title;
          targetEmployeeName = doc.employeeName || user?.fullName || 'Nhân viên';
          const newVal = doc.currentValue + valueDelta;
          return {
            ...doc,
            currentValue: newVal,
            proofText: justificationText,
            proofFile: fileName || doc.proofFile,
            status: doc.status === 'DRAFT' ? 'IN_PROGRESS' : doc.status
          };
        }
        return doc;
      });
    });

    const doc = kpiDocuments.find(d => d.id === docId);
    const title = doc?.title || targetDocTitle || 'Cập nhật tiến độ';
    const empName = doc?.employeeName || targetEmployeeName || user?.fullName || 'Nhân viên';

    const logEntry: ProgressLog = {
      id: Date.now(),
      docId,
      docTitle: title,
      employeeName: empName,
      valueDelta,
      justificationText,
      fileName,
      timestamp: new Date().toISOString()
    };
    setProgressLogs(prevLogs => [logEntry, ...prevLogs]);
  };

  // Self Score Submit
  const submitSelfEvaluation = (docId: number, selfScore: number, proofText: string) => {
    setKpiDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            selfScore,
            proofText: proofText || doc.proofText,
            status: 'SELF_EVALUATED' as const
          };
        }
        return doc;
      })
    );
  };

  // Manager final evaluation score
  const evaluateEmployee = (docId: number, managerScore: number, finalScore: number) => {
    setKpiDocuments(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            managerScore,
            finalScore,
            status: 'EVALUATED' as const
          };
        }
        return doc;
      })
    );
  };

  // Form Setup: One-click "Apply Job Position Bundle Template"
  const applyPositionBundleToEmployee = (
    employeeId: number,
    employeeName: string,
    positionId: number,
    cycleId: number,
    parentDocId: number
  ) => {
    const position = positions.find(p => p.id === positionId);
    const positionName = position ? position.name : 'Nhân viên';

    // Find templates assigned to this position in bundles
    const bundles = positionBundles.filter(pb => pb.positionId === positionId);
    if (bundles.length === 0) return;

    // Create a new KpiDocument for each template bundle
    const newDocs: KpiDocument[] = bundles.map((b, idx) => {
      const template = kpiTemplates.find(kt => kt.id === b.templateId);
      const title = template ? template.name : 'Tiêu chí KPI';
      const unit = template ? template.unit : '';

      return {
        id: Date.now() + idx,
        title,
        type: 'EMPLOYEE',
        cycleId,
        targetId: employeeId,
        parentDocId,
        weight: b.defaultWeight,
        targetValue: 100, // default target value
        currentValue: 0,
        unit,
        selfScore: null,
        managerScore: null,
        finalScore: null,
        status: 'DRAFT',
        employeeName,
        positionName
      };
    });

    setKpiDocuments(prev => {
      // Remove previous draft/in-progress documents of this employee for this cycle to avoid duplicating
      const filtered = prev.filter(doc => !(doc.type === 'EMPLOYEE' && doc.targetId === employeeId && doc.cycleId === cycleId));
      return [...filtered, ...newDocs];
    });
  };

  return (
    <KpiContext.Provider value={{
      currentUserRole,
      managerViewMode,
      setManagerViewMode,
      cycles,
      departments,
      positions,
      kpiTemplates,
      positionBundles,
      kpiDocuments,
      progressLogs,
      transitionCycleState,
      savePositionBundle,
      addKpiDocument,
      updateKpiDocumentProgress,
      submitSelfEvaluation,
      evaluateEmployee,
      applyPositionBundleToEmployee
    }}>
      {children}
    </KpiContext.Provider>
  );
};

export const useKpi = () => {
  const context = useContext(KpiContext);
  if (context === undefined) {
    throw new Error('useKpi must be used within a KpiProvider');
  }
  return context;
};
