// mode-selection.component.ts
import { Component } from '@angular/core';

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
  
  // 2. Event Handler for Mode Selection
  handleModeSelect(modeId: string): void {
    this.selectedMode = modeId;
    console.log(`Selected mode: ${modeId}`);
  }
  
  // 3. Handler for Investigation Button
  handleInvestigation(): void {
    // This would typically make an API call with the query and selected mode
    console.log(`Investigating query: "${this.query}" with mode: ${this.selectedMode}`);
    
    // Example API call (commented out)
    /*
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
    */
  }
  
  get currentModeName(): string {
    const mode = this.modes.find(m => m.id === this.selectedMode);
    return mode ? mode.name : '';
  }
  
  get isQueryEmpty(): boolean {
    return !this.query.trim();
  }
}

