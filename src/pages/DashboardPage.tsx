import React, { useState, useEffect } from 'react';
import {
  KpiProvider,
  useKpi,
  AdminDashboard,
  DirectorDashboard,
  ManagerDashboard,
  EmployeeDashboard
} from '../features/kpi-dashboard';
import { useAuth } from '../features/auth';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { kpiDocumentService, kpiTrackingService } from '../features/kpi-document';

function DashboardInner() {
  const { currentUserRole } = useKpi();
  const { user } = useAuth();
  
  // Real database states
  const [cycles, setCycles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [kpiDocuments, setKpiDocuments] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Fetch Cycles & Departments
  const initData = async () => {
    try {
      const [cyclesRes, deptsRes] = await Promise.all([
        catalogService.fetchAllForDropdown<any>('/kpi-cycles'),
        catalogService.fetchAllForDropdown<any>('/departments')
      ]);
      setCycles(cyclesRes);
      setDepartments(deptsRes);
      if (cyclesRes.length > 0) {
        const activeCycle = cyclesRes.find((c: any) => c.status === 'ACTIVE') || cyclesRes[0];
        setSelectedCycleId(activeCycle.id);
      }
    } catch (err) {
      console.error('Error fetching dashboard init data:', err);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // 2. Fetch KPI Documents & Recent Logs
  const loadDashboardData = async () => {
    if (!selectedCycleId) return;
    setIsLoading(true);
    try {
      // Fetch all KPI documents in this cycle
      const docsRes = await kpiDocumentService.search({ cycleId: Number(selectedCycleId) });
      if (docsRes.success && docsRes.data) {
        setKpiDocuments(docsRes.data);
      }

      // Fetch recent logs
      let logsRes;
      if (currentUserRole === 'EMPLOYEE' && user?.employeeId) {
        logsRes = await kpiTrackingService.getRecentLogs(user.employeeId, undefined, 5);
      } else if (currentUserRole === 'MANAGER' && user?.department?.id) {
        logsRes = await kpiTrackingService.getRecentLogs(undefined, user.department.id, 5);
      } else {
        logsRes = await kpiTrackingService.getRecentLogs(undefined, undefined, 5);
      }

      if (logsRes && logsRes.success && logsRes.data) {
        setRecentLogs(logsRes.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedCycleId, user, currentUserRole]);

  // Route to the appropriate sub-dashboard based on currentUserRole
  const renderDashboard = () => {
    const props = {
      user,
      cycles,
      departments,
      currentDocs: kpiDocuments,
      recentLogs,
      selectedCycleId,
      setSelectedCycleId,
      isLoading,
      loadDashboardData
    };

    switch (currentUserRole) {
      case 'ADMIN':
        return <AdminDashboard {...props} />;
      case 'DIRECTOR':
        return <DirectorDashboard {...props} />;
      case 'MANAGER':
        return <ManagerDashboard {...props} />;
      case 'EMPLOYEE':
      default:
        return <EmployeeDashboard {...props} />;
    }
  };

  return (
    <div className="p-1 sm:p-2">
      {renderDashboard()}
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  return (
    <KpiProvider>
      <DashboardInner />
    </KpiProvider>
  );
};

export default DashboardPage;
