# Mode Selection Implementation Guide

This guide provides comprehensive examples of implementing mode selection functionality in multiple frameworks. The implementation includes:

1. **State Management for Mode Selection:**
   - Defining a state variable (`selectedMode`) to store the identifier of the currently active mode
   - Creating a function `handleModeSelect(modeId)` that updates this state

2. **Event Handling on Mode Cards:**
   - Attaching event listeners to each mode card that calls `handleModeSelect` with the respective mode's identifier
   - Conditionally applying a CSS class to the active mode card based on the state

3. **Using Selected Mode in Investigation:**
   - When the "Investigation" button is clicked, retrieving the current value from the input field and the selected mode
   - Making an API call that includes both the query and the selected mode in the request payload

## Table of Contents

- [React Implementation](#react-implementation)
- [Vue Implementation](#vue-implementation)
- [Angular Implementation](#angular-implementation)
- [Vanilla JavaScript Implementation](#vanilla-javascript-implementation)
- [CSS Styling](#css-styling)

## React Implementation

```jsx
// React Implementation Example for Mode Selection

import React, { useState } from 'react';
import './styles.css'; // You would create this CSS file for styling

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
```

## Vue Implementation

```vue
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
      
      // Example API call
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
    }
  }
};
</script>

<style scoped>
/* CSS styles would be included here or imported from a separate file */
</style>
```

## Angular Implementation

### TypeScript Component

```typescript
// mode-selection.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Mode {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-mode-selection',
  templateUrl: './mode-selection.component.html',
  styleUrls: ['./mode-selection.component.css']
})
export class ModeSelectionComponent {
  // 1. State Management for Mode Selection
  selectedMode: string = 'diy_planner'; // Default selected mode
  query: string = '';
  
  modes: Mode[] = [
    { id: 'diy_planner', name: 'DIY Planner', description: 'Assists with planning and researching DIY projects and tutorials.' },
    { id: 'nutritionist', name: 'Nutritionist', description: 'Acts as a Nutritionist to guide interactions and research on dietary topics.' },
    { id: 'financial_analyst', name: 'Financial Analyst', description: 'Guides research related to finance, markets, and investments.' },
    { id: 'problem_solver', name: 'Problem Solver', description: 'Helps identify and research information related to solving problems.' },
  ];
  
  constructor(private http: HttpClient) {}
  
  // 2. Event Handler for Mode Selection
  handleModeSelect(modeId: string): void {
    this.selectedMode = modeId;
    console.log(`Selected mode: ${modeId}`);
  }
  
  // 3. Handler for Investigation Button
  handleInvestigation(): void {
    // This would typically make an API call with the query and selected mode
    console.log(`Investigating query: "${this.query}" with mode: ${this.selectedMode}`);
    
    // Example API call
    this.http.post('/api/investigate', {
      query: this.query,
      mode: this.selectedMode
    }).subscribe(
      (data) => {
        console.log('Investigation results:', data);
        // Handle the response data here
      },
      (error) => {
        console.error('Error during investigation:', error);
      }
    );
  }
  
  get currentModeName(): string {
    const mode = this.modes.find(m => m.id === this.selectedMode);
    return mode ? mode.name : '';
  }
  
  get isQueryEmpty(): boolean {
    return !this.query.trim();
  }
}
```

### HTML Template

```html
<!-- mode-selection.component.html -->
<div class="app-container">
  <h1>Mode Selection Example (Angular)</h1>
  
  <!-- Mode Selection Cards -->
  <div class="mode-cards-container">
    <div 
      *ngFor="let mode of modes" 
      class="mode-card"
      [ngClass]="{'selected': selectedMode === mode.id}"
      (click)="handleModeSelect(mode.id)"
    >
      <h3>{{ mode.name }}</h3>
      <p>{{ mode.description }}</p>
    </div>
  </div>
  
  <!-- Query Input and Investigation Button -->
  <div class="query-container">
    <input
      type="text"
      [(ngModel)]="query"
      placeholder="Enter your query here..."
      class="query-input"
    />
    <button 
      (click)="handleInvestigation()"
      class="investigation-button"
      [disabled]="isQueryEmpty"
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
```

## Vanilla JavaScript Implementation

### JavaScript

```javascript
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
```

### HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mode Selection Example (Vanilla JS)</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app-container">
    <h1>Mode Selection Example (Vanilla JS)</h1>
    
    <!-- Mode Selection Cards -->
    <div id="mode-cards-container" class="mode-cards-container">
      <!-- Cards will be dynamically inserted here by JavaScript -->
    </div>
    
    <!-- Query Input and Investigation Button -->
    <div class="query-container">
      <input
        id="query-input"
        type="text"
        placeholder="Enter your query here..."
        class="query-input"
        oninput="updateCurrentState()"
      />
      <button 
        id="investigation-button"
        class="investigation-button"
      >
        Investigation
      </button>
    </div>
    
    <!-- Display current state (for demonstration) -->
    <div class="current-state">
      <p><strong>Current Mode:</strong> <span id="current-mode"></span></p>
      <p><strong>Current Query:</strong> <span id="current-query">(empty)</span></p>
    </div>
  </div>
  
  <script src="vanilla-js-example.js"></script>
</body>
</html>
```

## CSS Styling

```css
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
```

## How to Use

Choose the implementation that matches your project's technology stack and integrate it into your application. Each example demonstrates the same functionality but with framework-specific patterns and best practices.

### Integration with Existing Codebase

1. Copy the relevant code snippets for your framework
2. Adapt the mode data to match your application's needs
3. Implement the actual API call in the `handleInvestigation` function
4. Style the components to match your application's design

### Customization

You can customize these examples by:

1. Modifying the `modes` array to include your own mode options
2. Changing the CSS styles to match your application's design
3. Adding additional features like mode filtering, search, or animations
4. Implementing more complex state management for larger applications

