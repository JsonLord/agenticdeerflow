// React Implementation Example for Mode Selection

import React, { useState } from 'react';
import './mode-selection.css'; // You would create this CSS file for styling

// Sample mode data
const modes = [
  { id: 'diy_planner', name: 'DIY Planner', description: 'Assists with planning and researching DIY projects and tutorials.' },
  { id: 'nutritionist', name: 'Nutritionist', description: 'Acts as a Nutritionist to guide interactions and research on dietary topics.' },
  { id: 'financial_analyst', name: 'Financial Analyst', description: 'Guides research related to finance, markets, and investments.' },
  { id: 'problem_solver', name: 'Problem Solver', description: 'Helps identify and research information related to solving problems.' },
];

function ModeSelectionApp() {
  // 1. State Management for Mode Selection
  const [selectedMode, setSelectedMode] = useState('diy_planner'); // Default selected mode
  const [query, setQuery] = useState('');
  
  // 2. Event Handler for Mode Selection
  const handleModeSelect = (modeId) => {
    setSelectedMode(modeId);
    console.log(`Selected mode: ${modeId}`);
  };
  
  // 3. Handler for Investigation Button
  const handleInvestigation = () => {
    // This would typically make an API call with the query and selected mode
    console.log(`Investigating query: "${query}" with mode: ${selectedMode}`);
    
    // Example API call (commented out)
    /*
    fetch('/api/investigate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        mode: selectedMode
      }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Investigation results:', data);
        // Handle the response data here
      })
      .catch(error => {
        console.error('Error during investigation:', error);
      });
    */
  };

  return (
    <div className="app-container">
      <h1>Mode Selection Example</h1>
      
      {/* Mode Selection Cards */}
      <div className="mode-cards-container">
        {modes.map((mode) => (
          <div 
            key={mode.id}
            className={`mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
            onClick={() => handleModeSelect(mode.id)}
          >
            <h3>{mode.name}</h3>
            <p>{mode.description}</p>
          </div>
        ))}
      </div>
      
      {/* Query Input and Investigation Button */}
      <div className="query-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here..."
          className="query-input"
        />
        <button 
          onClick={handleInvestigation}
          className="investigation-button"
          disabled={!query.trim()}
        >
          Investigation
        </button>
      </div>
      
      {/* Display current state (for demonstration) */}
      <div className="current-state">
        <p><strong>Current Mode:</strong> {modes.find(m => m.id === selectedMode)?.name}</p>
        <p><strong>Current Query:</strong> {query || '(empty)'}</p>
      </div>
    </div>
  );
}

export default ModeSelectionApp;

