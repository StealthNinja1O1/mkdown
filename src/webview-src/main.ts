import EasyMDE from 'easymde';
import 'codemirror/mode/python/python';
import * as CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';

// VS Code webview setup
declare const acquireVsCodeApi: () => {
    postMessage(message: any): void;
    getState(): any;
    setState(newState: any): void;
};
const vscode = acquireVsCodeApi();
let isUpdatingFromExtension = false;

// Editor setup
const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
const easyMDE = new EasyMDE({
    element: textarea,
    toolbar: false,
    status: false,
    spellChecker: false,
    maxHeight: "none",
});

// A variable to hold our timer
let debounceTimeout: NodeJS.Timeout | undefined;

// Post changes to VS Code
easyMDE.codemirror.on("change", () => {
    if (isUpdatingFromExtension) {
        return;
    }

    // 1. Clear any existing timer
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }

    // 2. Set a new timer to send the update after 250ms
    debounceTimeout = setTimeout(() => {
        console.log("Debounced: Sending update to VS Code");
        vscode.postMessage({ type: 'edit', text: easyMDE.value() });
    }, 250); // 250ms is a good starting point
});

// Receive updates from VS Code
window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'update') {
        const receivedText = message.text.replace(/\r\n/g, '\n');
        const currentText = easyMDE.value().replace(/\r\n/g, '\n');

        if (receivedText !== currentText) {
            isUpdatingFromExtension = true;
            const cursor = easyMDE.codemirror.getCursor();
            easyMDE.value(message.text);
            easyMDE.codemirror.setCursor(cursor);
            isUpdatingFromExtension = false;
        }
    }
});

// --- Fenced code block syntax highlighting ---
const cm = easyMDE.codemirror;

function highlightFencedBlocks() {
    const totalLines = cm.lineCount();
    let insideFencedBlock = false;
    let blockLanguage: string | null = null;

    for (let i = 0; i < totalLines; i++) {
        const lineText = cm.getLine(i);
        const match = lineText.match(/^```(\w+)?/);

        if (match) {
            insideFencedBlock = !insideFencedBlock;
            blockLanguage = insideFencedBlock ? match[1] || null : null;
            // Style the opening/closing fence
            cm.addLineClass(i, 'text', 'cm-formatting cm-formatting-code-block');
            continue;
        }

        if (insideFencedBlock && blockLanguage) {
            // Apply the correct CodeMirror mode
            const mode = CodeMirror.getMode({}, blockLanguage);
            const state = CodeMirror.startState(mode);
            const stream = new CodeMirror.StringStream(lineText);
            while (!stream.eol()) {
                mode.token!(stream, state);
            }
            // Add a line class for syntax styling (optional)
            cm.addLineClass(i, 'text', `cm-${blockLanguage}`);
        }
    }
}

// Run initially
highlightFencedBlocks();

// Run on every change
cm.on('change', () => {
    highlightFencedBlocks();
});
