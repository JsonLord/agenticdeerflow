# Mode Selection Implementation Examples

This repository contains examples of implementing a mode selection UI component with the following features:

1. **State Management for Mode Selection:**
   - Defining a state variable (e.g., `selectedMode`) to store the identifier of the currently active mode.
   - Creating a function `handleModeSelect(modeId)` that updates this `selectedMode` state.

2. **Event Handling on Mode Cards:**
   - Attaching an `onClick` event listener to each mode card that calls `handleModeSelect` with the respective mode's identifier.
   - Conditionally applying a CSS class (e.g., `selected`) to the active mode card based on the `selectedMode` state.

3. **Using Selected Mode in Investigation:**
   - When the "Investigation" button is clicked, retrieving the current value from the input field and the `selectedMode` state.
   - Making an API call that includes both the query and the `selectedMode` in the request payload.

## Examples Included

- **React Implementation**: `mode-selection-example.jsx` and `mode-selection-example.css`
- **Vue Implementation**: `mode-selection-vue-example.vue`
- **Angular Implementation**: `mode-selection-angular-example.ts`, `mode-selection-angular-example.html`, and `mode-selection-angular-example.css`
- **Vanilla JavaScript Implementation**: `mode-selection-vanilla-js-example.js`, `mode-selection-vanilla-js-example.html`, and `mode-selection-vanilla-js-example.css`

## How to Use

Each example demonstrates the same functionality but implemented in different frameworks. Choose the one that matches your project's technology stack.

### React Example

```jsx
// Import the component
import ModeSelectionApp from './ModeSelectionApp';

// Use it in your application
function App() {
  return (
    <div>
      <ModeSelectionApp />
    </div>
  );
}
```

### Vue Example

```javascript
// Import the component
import ModeSelectionApp from './ModeSelectionApp.vue';

// Register it in your Vue application
export default {
  components: {
    ModeSelectionApp
  }
}
```

### Angular Example

```typescript
// Import the component in your module
import { ModeSelectionComponent } from './mode-selection.component';

@NgModule({
  declarations: [
    ModeSelectionComponent
  ],
  // ...
})
export class AppModule { }
```

### Vanilla JavaScript

Simply include the HTML, CSS, and JavaScript files in your project:

```html
<link rel="stylesheet" href="mode-selection-vanilla-js-example.css">
<script src="mode-selection-vanilla-js-example.js"></script>
```

## Customization

You can customize these examples by:

1. Modifying the `modes` array to include your own mode options
2. Changing the CSS styles to match your application's design
3. Implementing the actual API call in the `handleInvestigation` function
4. Adding additional features like mode filtering, search, or animations

