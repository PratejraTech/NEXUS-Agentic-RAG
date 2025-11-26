import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { GraphExplorer } from './components/GraphExplorer';
import { IngestionPanel } from './components/IngestionPanel';
import { DataSources } from './components/DataSources';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);

  const renderContent = () => {
    switch (currentView) {
      case View.CHAT:
        return <ChatInterface onViewGraph={() => setCurrentView(View.GRAPH)} />;
      case View.GRAPH:
        return <GraphExplorer />;
      case View.INGESTION:
        return <IngestionPanel />;
      case View.DATA_SOURCES:
        return <DataSources />;
      default:
        return <ChatInterface onViewGraph={() => setCurrentView(View.GRAPH)} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;