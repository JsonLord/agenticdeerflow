// Vanilla JavaScript Implementation for Mode Selection

// Sample mode data
const modes = [
  { id: 'diy_planner', name: 'DIY Planner', description: 'Assists with planning and researching DIY projects and tutorials.' },
  { id: 'nutritionist', name: 'Nutritionist', description: 'Acts as a Nutritionist to guide interactions and research on dietary topics.' },
  { id: 'financial_analyst', name: 'Financial Analyst', description: 'Guides research related to finance, markets, and investments.' },
  { id: 'problem_solver', name: 'Problem Solver', description: 'Helps identify and research information related to solving problems.' },
];

// 1. State Management for Mode Selection
let selectedMode = 'diy_planner'; // Default selected mode

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Render the mode cards
  renderModeCards();
  
  // Add event listener to the investigation button
  document.getElementById('investigation-button').addEventListener('click', handleInvestigation);
  
  // Update the current state display
  updateCurrentState();
});

// 2. Event Handler for Mode Selection
function handleModeSelect(modeId) {
  // Update the selected mode
  selectedMode = modeId;
  console.log(`Selected mode: ${modeId}`);
  
  // Update the UI to reflect the selection
  document.querySelectorAll('.mode-card').forEach(card => {
    if (card.dataset.modeId === modeId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
  
  // Update the current state display
  updateCurrentState();
}

// 3. Handler for Investigation Button
function handleInvestigation() {
  // Get the query from the input field
  const query = document.getElementById('query-input').value.trim();
  
  if (!query) {
    alert('Please enter a query first.');
    return;
  }
  
  // This would typically make an API call with the query and selected mode
  console.log(`Investigating query: "${query}" with mode: ${selectedMode}`);
  
  // Example API call
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
}

// Helper function to render the mode cards
function renderModeCards() {
  const container = document.getElementById('mode-cards-container');
  
  modes.forEach(mode => {
    const card = document.createElement('div');
    card.className = `mode-card ${mode.id === selectedMode ? 'selected' : ''}`;
    card.dataset.modeId = mode.id;
    
    card.innerHTML = `
      <h3>${mode.name}</h3>
      <p>${mode.description}</p>
    `;
    
    card.addEventListener('click', () => handleModeSelect(mode.id));
    container.appendChild(card);
  });
}

// Helper function to update the current state display
function updateCurrentState() {
  const currentMode = modes.find(m => m.id === selectedMode);
  const query = document.getElementById('query-input').value.trim();
  
  document.getElementById('current-mode').textContent = currentMode ? currentMode.name : '';
  document.getElementById('current-query').textContent = query || '(empty)';
}

