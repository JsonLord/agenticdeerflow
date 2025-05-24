<template>
  <div class="app-container">
    <h1>Mode Selection Example (Vue)</h1>
    
    <!-- Mode Selection Cards -->
    <div class="mode-cards-container">
      <div 
        v-for="mode in modes" 
        :key="mode.id"
        class="mode-card"
        :class="{ 'selected': selectedMode === mode.id }"
        @click="handleModeSelect(mode.id)"
      >
        <h3>{{ mode.name }}</h3>
        <p>{{ mode.description }}</p>
      </div>
    </div>
    
    <!-- Query Input and Investigation Button -->
    <div class="query-container">
      <input
        type="text"
        v-model="query"
        placeholder="Enter your query here..."
        class="query-input"
      />
      <button 
        @click="handleInvestigation"
        class="investigation-button"
        :disabled="!query.trim()"
      >
        Investigation
      </button>
    </div>
    
    <!-- Display current state (for demonstration) -->
    <div class="current-state">
      <p><strong>Current Mode:</strong> {{ currentModeName }}</p>
      <p><strong>Current Query:</strong> {{ query || '(empty)' }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModeSelectionApp',
  data() {
    return {
      // 1. State Management for Mode Selection
      selectedMode: 'diy_planner', // Default selected mode
      query: '',
      modes: [
        { id: 'diy_planner', name: 'DIY Planner', description: 'Assists with planning and researching DIY projects and tutorials.' },
        { id: 'nutritionist', name: 'Nutritionist', description: 'Acts as a Nutritionist to guide interactions and research on dietary topics.' },
        { id: 'financial_analyst', name: 'Financial Analyst', description: 'Guides research related to finance, markets, and investments.' },
        { id: 'problem_solver', name: 'Problem Solver', description: 'Helps identify and research information related to solving problems.' },
      ]
    };
  },
  computed: {
    currentModeName() {
      const mode = this.modes.find(m => m.id === this.selectedMode);
      return mode ? mode.name : '';
    }
  },
  methods: {
    // 2. Event Handler for Mode Selection
    handleModeSelect(modeId) {
      this.selectedMode = modeId;
      console.log(`Selected mode: ${modeId}`);
    },
    
    // 3. Handler for Investigation Button
    handleInvestigation() {
      // This would typically make an API call with the query and selected mode
      console.log(`Investigating query: "${this.query}" with mode: ${this.selectedMode}`);
      
      // Example API call (commented out)
      /*
      fetch('/api/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: this.query,
          mode: this.selectedMode
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
    }
  }
};
</script>

<style scoped>
/* CSS for Mode Selection Example */
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* Mode Cards Styling */
.mode-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.mode-card {
  flex: 1 1 200px;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
}

.mode-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.mode-card.selected {
  border-color: #4a90e2;
  background-color: #f0f7ff;
  box-shadow: 0 5px 15px rgba(74, 144, 226, 0.2);
}

.mode-card h3 {
  margin-top: 0;
  color: #333;
}

.mode-card p {
  color: #666;
  font-size: 14px;
}

/* Query Input and Button Styling */
.query-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.query-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.investigation-button {
  padding: 10px 20px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.investigation-button:hover {
  background-color: #3a7bc8;
}

.investigation-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Current State Display */
.current-state {
  margin-top: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.current-state p {
  margin: 5px 0;
}
</style>

