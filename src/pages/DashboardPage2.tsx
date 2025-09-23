import React from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import EnviroTrace from '../components/Dashboard';
import EnviroTraceResults from '../components/Dashboard';

const EnvironmentResults: React.FC = () => {
  return (
    <div>
      {/* <Header /> */}
      <EnviroTraceResults/>
    </div>
  );
};

export default EnvironmentResults;