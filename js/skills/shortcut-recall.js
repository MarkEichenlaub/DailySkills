import { InterleavedSkill, choiceInput, choice, shuffled } from './base.js';

// Shortcut recall — the shortcuts that can't be practiced by doing.
//
// Text-navigation chords can be pressed live in a textarea, because AutoHotkey
// turns them into ordinary keys the browser handles. These can't: pressing
// Ctrl+Win+H would really snap the window, Ctrl+0 would really switch tabs, and
// CapsLock+K would really launch EigenNode. So the drill runs the other way -
// here is what you want to happen, name the keys.
//
// All of it comes from default.ahk. Nothing generic.

// Window, tab and navigation chords that act on the system rather than on text.
const SYSTEM = [
    { keys: 'Ctrl+9', does: 'go to the previous browser tab' },
    { keys: 'Ctrl+0', does: 'go to the next browser tab' },
    { keys: 'Ctrl+Shift+9', does: 'move the current tab one place left' },
    { keys: 'Ctrl+Shift+0', does: 'move the current tab one place right' },
    { keys: 'Ctrl+Alt+Z', does: 'go back' },
    { keys: 'Ctrl+Alt+Y', does: 'go forward (outside EigenNode)' },
    { keys: 'Ctrl+Win+H', does: 'snap the window to the left half of the screen' },
    { keys: 'Ctrl+Win+L', does: 'snap the window to the right half of the screen' },
    { keys: 'Ctrl+Win+I', does: 'maximize the window' },
    { keys: 'Ctrl+Win+M', does: 'minimize the window' },
    { keys: 'Ctrl+Alt+J', does: 'scroll down' },
    { keys: 'Ctrl+Alt+K', does: 'scroll up' },
    { keys: "Ctrl+Alt+'", does: 'select from the cursor to the end of the line' },
    { keys: 'Alt+Shift+J', does: 'jump to the next sibling in an outline' },
    { keys: 'Alt+Shift+K', does: 'jump to the previous sibling in an outline' },
    { keys: 'Ctrl+Alt+E', does: 'drag a window back on screen after unplugging a monitor' },
    { keys: 'Ctrl+Alt+V', does: 'paste by typing the clipboard out character by character' },
    { keys: 'Ctrl+Alt+O', does: 'open the shared graphing calculator' },
    { keys: 'Ctrl+Alt+S', does: 'open the shared scientific calculator' },
    { keys: 'Ctrl+Alt+N', does: 'reset the AoPS VPN' },
    { keys: 'Ctrl+Win+N', does: 'toggle the AoPS VPN on or off' },
    { keys: 'Ctrl+Win+R', does: 'save and reload the AutoHotkey script' },
    { keys: 'Ctrl+Win+E', does: 'open the AutoHotkey script for editing' },
    { keys: 'Ctrl+Win+X', does: 'launch ShareX' },
    { keys: 'Win+Space', does: 'click the left mouse button' },
];

// The CapsLock launcher layer.
const LAUNCHER = [
    { keys: 'CapsLock+G', does: 'open the github folder' },
    { keys: 'CapsLock+B', does: 'open Google Drive' },
    { keys: 'CapsLock+S', does: 'open the screenshots folder' },
    { keys: 'CapsLock+D', does: 'open Downloads' },
    { keys: 'CapsLock+R', does: 'open the references folder' },
    { keys: 'CapsLock+L', does: 'open Documents' },
    { keys: 'CapsLock+C', does: 'open the C: drive' },
    { keys: 'CapsLock+P', does: 'open PowerShell' },
    { keys: 'CapsLock+A', does: 'open the game arcade' },
    { keys: 'CapsLock+K', does: 'open EigenNode' },
    { keys: 'CapsLock+H', does: 'open HiTeXeR' },
    { keys: 'CapsLock+V', does: 'open the blink comparator' },
    { keys: 'CapsLock+F', does: 'open the GIF editor' },
    { keys: 'CapsLock+I', does: 'quick-add something to Dynalist' },
    { keys: 'CapsLock+N', does: 'show the Dynalist next actions' },
    { keys: 'CapsLock+E', does: 'capture something to the calendar' },
    { keys: 'CapsLock+W', does: 'send the current page to Claude' },
    { keys: 'CapsLock+U', does: 'run the AoPS sync' },
    { keys: 'CapsLock+Y', does: 'convert a GeoGebra figure to Asymptote' },
    { keys: 'CapsLock+/', does: 'show the shortcut cheat sheet' },
    { keys: 'CapsLock', does: 'press Escape' },
];

const ALL_KEYS = [...SYSTEM, ...LAUNCHER].map(s => s.keys);

// Wrong answers are drawn from the same pool, so every option is a real
// shortcut and the right one can't be spotted by shape alone.
function makeFrom(pool, label) {
    return () => {
        const s = choice(pool);
        const wrongs = shuffled(ALL_KEYS.filter(k => k !== s.keys)).slice(0, 3);
        const options = shuffled([s.keys, ...wrongs]);
        return {
            question: `Which keys ${s.does}?`,
            inputHTML: choiceInput(options),
            correctAnswer: options.indexOf(s.keys),
            _options: options,
        };
    };
}

function check(trial, answer) {
    const picked = parseInt(answer, 10);
    const isCorrect = picked === trial.correctAnswer;
    const right = trial._options[trial.correctAnswer];
    return {
        score: isCorrect ? 1 : 0,
        correct: isCorrect,
        feedback: isCorrect ? right : `Answer: ${right}`,
    };
}

export class ShortcutRecallSkill extends InterleavedSkill {
    constructor() {
        super('shortcut-recall', 'Shortcut Recall', [
            { tag: 'system', name: 'Windows and tabs', make: makeFrom(SYSTEM), check },
            { tag: 'launcher', name: 'CapsLock launcher', make: makeFrom(LAUNCHER), check },
        ]);
    }
}
