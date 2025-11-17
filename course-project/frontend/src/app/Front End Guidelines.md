# Front End Guidelines
---
## Styling
- All styles must be specified in a separate CSS file
- All components must inheret the `global.css` file
- Only the colours defined in `global.css` or `colors.js` can be used
- Only the symbols in `public/` can be used
    - **Note:** There is a special component called `Symbol` which can load these images, always use this

## Components
- Always implement base components in the `components/` directory for use in views
- There are lots of components already available for use in the directory, do not create duplicates

## Fetching from API
- There are lots of hooks available for use in the `useFetch.js` file for authenticated/unauthenticated requests.
- Only use these hooks, if you need different functionality, enhance an existing one or add a new one to this file for everyone to use
