# AutoCompleteActions

Simple & customizable auto-complete, written in JS

## Installation

```bash
# yarn or npm
yarn add auto-complete-actions
```

Or direct import in HTML

```html
<!-- Add to head HTML tag -->
<link rel="stylesheet" href="/dist/auto-complete-actions.min.css" />
<!-- Add to the bottom of body HTML tag -->
<script src="/dist/auto-complete-actions.min.js"></script>

<!-- or directly from unpkg -->
<link
  rel="stylesheet"
  href="https://unpkg.com/auto-complete-actions@latest/dist/auto-complete-actions.min.css"
/>
<script src="https://unpkg.com/auto-complete-actions@latest/dist/auto-complete-actions.min.js"></script>
```

## Run

```js
import AutoCompleteActions from "auto-complete-actions";

// Only this lines when included with script HTML tag
const autoCompleteActions = new AutoCompleteActions(
  "#search-container",
  {
    search: async function(term) {
      let result = [
        {
          "id":"a766ef04-bd5c",
          "group":"person",
          "label":"CAMILA REIS MATOS BRITO MOREIRA"
        },
      ];
      return result;
    },
    renderItem: function(item) {
      return `<span class="fa-solid fa-${item.group}"></span> ${item.label}`;
    },
    onSelect: function(item) {
      log(`Selected: ${JSON.stringify(item)}`);
    },
    delay: 500,
    autoFocus: true,
    maxHeight: "300px"
  }
);
```

Example in `index.html`
