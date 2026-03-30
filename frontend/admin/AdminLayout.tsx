
import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import SystemMonitor from './SystemMonitor';
import DataManagement from './DataManagement';
import AnalysisDeep from './AnalysisDeep';
import AnalysisRelation from './AnalysisRelation'; 
import AnalysisGeo from './AnalysisGeo'; 
import AnalysisCompare from './AnalysisCompare';
import AnalysisEvolution from './AnalysisEvolution';
import AnalysisSentiment from './AnalysisSentiment';
import MiningKeywords from './MiningKeywords'; 
import MiningClustering from './MiningClustering'; 
import MiningPrediction from './MiningPrediction'; 
import DataCleaning from './DataCleaning'; 
import UserProfile from './UserProfile';
import UserCollections from './UserCollections';
import PersonalReports from './PersonalReports';
import ResumeAnalysis from './ResumeAnalysis';
import TravelPlan from './TravelPlan';
import BusinessStrategy from './BusinessStrategy';
import CrawlerConfig from './CrawlerConfig';
import SystemLogs from './SystemLogs';
import TopicDetail from './TopicDetail'; // New Import
import AdminSidebar, { Page } from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { Construction } from 'lucide-react';
import { User } from '../utils/userStorage';
import { resolveSessionUser } from '../utils/sessionUser';

interface Props {
  onSwitchMode: () => void;
  userRole: 'admin' | 'user' | null;
  onLogout: () => void;
}

// Placeholder for new pages
const ConstructionPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <Construction className="w-16 h-16 mb-4 text-slate-300" />
    <h3 className="text-lg font-medium text-slate-600">{title}</h3>
    <p className="text-sm">该模块正在开发中，敬请期待...</p>
  </div>
);

const AdminLayout: React.FC<Props> = ({ onSwitchMode, userRole, onLogout }) => {
  const [activePage, setActivePage] = useState<Page>('analysis-region');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Topic Detail Navigation State
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  // Load Current User Info
  useEffect(() => {
    setCurrentUser(resolveSessionUser());
  }, []);

  // Handler for navigating to Topic Detail
  const handleNavigateToDetail = (topic: string) => {
    setSelectedTopic(topic);
    setActivePage('analysis-detail');
  };

  // Router Switch Logic
  const renderContent = () => {
    switch (activePage) {
      // === 招聘数据洞察 ===
      case 'analysis-region':
        return <AnalysisGeo />;
      case 'analysis-sentiment':
        return <AnalysisSentiment />;
      case 'analysis-compare':
        return <AnalysisCompare />;
      case 'analysis-evolution':
        return <AnalysisEvolution />;
      case 'analysis-relation':
        return <AnalysisRelation />; 
      
      // === New Detail Page ===
      case 'analysis-detail':
        return (
          <TopicDetail 
            topic={selectedTopic} 
            onBack={() => setActivePage('personal-collections')} // Default back to collections, could be dynamic
          />
        );

      // === 数据挖掘引擎 ===
      case 'mining-keywords':
        return <MiningKeywords />;
      case 'mining-clustering':
        return <MiningClustering />;
      case 'mining-prediction':
        return <MiningPrediction />;

      // === 数据治理 ===
      case 'data-history':
        return userRole === 'admin' ? <DataManagement /> : <ConstructionPage title="无访问权限" />;
      case 'data-cleaning':
        return <DataCleaning />;
      case 'data-sensitive':
        return userRole === 'admin' ? <DataManagement /> : <ConstructionPage title="无访问权限" />;
      case 'data-crawler':
        return userRole === 'admin' ? <CrawlerConfig /> : <ConstructionPage title="无访问权限" />;

      // === 系统运维 ===
      case 'ops-monitor':
        return userRole === 'admin' ? <SystemMonitor /> : <ConstructionPage title="无访问权限" />;
      case 'ops-logs':
        return userRole === 'admin' ? <SystemLogs /> : <ConstructionPage title="无访问权限" />;
      case 'ops-users':
        return userRole === 'admin' ? <UserManagement /> : <ConstructionPage title="无访问权限" />;

      // === 个人中心 ===
      case 'personal-profile':
        return <UserProfile />;
      case 'personal-resume-ai':
        return <ResumeAnalysis />;
      case 'travel-plan':
        return <TravelPlan />;
      case 'business-strategy':
        return <BusinessStrategy />;
      case 'personal-collections':
        return <UserCollections onViewDetail={handleNavigateToDetail} />;
      case 'personal-reports':
        return <PersonalReports />;

      default:
        return <AnalysisRelation />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
      
      <AdminSidebar 
        activePage={activePage}
        sidebarOpen={sidebarOpen}
        userRole={userRole}
        onNavigate={setActivePage}
        onSwitchMode={onSwitchMode}
      />

      <div 
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}
      >
        <AdminHeader 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activePage={activePage}
          currentUser={currentUser} // Pass full object
          onNavigate={(p) => setActivePage(p as Page)}
          onLogout={onLogout}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50 min-h-0">
           {renderContent()}
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
