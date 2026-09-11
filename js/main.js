import { SkillPracticeApp } from './app.js';

// The inline onclick handlers in index.html call into `app`, so it has to be
// reachable from the global scope even though everything else is a module.
const app = new SkillPracticeApp();
window.app = app;
