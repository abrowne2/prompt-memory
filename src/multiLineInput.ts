import * as vscode from 'vscode';

/**
 * A custom input box that supports multi-line text input
 * 
 */
export class MultiLineInputBox {
    private panel: vscode.WebviewPanel;
    private value: string;
    private resolvePromise?: (value: string | undefined) => void;

    constructor(
        private title: string,
        private placeholder: string = '',
        initialValue: string = ''
    ) {
        this.value = initialValue;
        this.panel = vscode.window.createWebviewPanel(
            'multiLineInput',
            title,
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'save':
                        this.value = message.text;
                        this.resolvePromise?.(this.value);
                        this.panel.dispose();
                        break;
                    case 'cancel':
                        this.resolvePromise?.(undefined);
                        this.panel.dispose();
                        break;
                }
            }
        );

        // Update the webview content
        this.updateContent();
    }

    private updateContent() {
        this.panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        padding: 15px;
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                        box-sizing: border-box;
                        margin: 0;
                    }
                    textarea {
                        flex: 1;
                        resize: none;
                        padding: 10px;
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        margin-bottom: 15px;
                    }
                    textarea:focus {
                        outline: none;
                        border-color: var(--vscode-focusBorder);
                    }
                    .buttons {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }
                    button {
                        padding: 8px 16px;
                        border: none;
                        cursor: pointer;
                        font-size: var(--vscode-font-size);
                        border-radius: 2px;
                    }
                    .save-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    .save-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .cancel-button {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .cancel-button:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                </style>
            </head>
            <body>
                <textarea 
                    placeholder="${this.placeholder}"
                    id="mainTextarea"
                >${this.value}</textarea>
                <div class="buttons">
                    <button class="cancel-button" onclick="cancel()">Cancel</button>
                    <button class="save-button" onclick="save()">Save</button>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const textarea = document.querySelector('textarea');

                    function save() {
                        vscode.postMessage({
                            command: 'save',
                            text: textarea.value
                        });
                    }

                    function cancel() {
                        vscode.postMessage({
                            command: 'cancel'
                        });
                    }

                    // Handle Cmd+Enter or Ctrl+Enter to save
                    textarea.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            save();
                        }
                        if (e.key === 'Escape') {
                            cancel();
                        }
                    });

                    // Focus textarea on load
                    document.addEventListener('DOMContentLoaded', () => {
                        document.getElementById('mainTextarea').focus();
                    });
                    // Backup focus in case DOMContentLoaded already fired
                    document.getElementById('mainTextarea').focus();
                </script>
            </body>
            </html>
        `;
    }

    /**
     * Shows the multi-line input box and returns a promise that resolves with the input value
     * 
     * # Returns
     * - The entered text if saved
     * - undefined if cancelled
     * 
     * # Example
     * ```typescript
     * const text = await MultiLineInputBox.show('Enter Prompt', 'Type your prompt here');
     * if (text) {
     *    // Handle the input
     * }
     * ```
     */
    show(): Promise<string | undefined> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    /**
     * Static helper to create and show a multi-line input box
     */
    static async show(
        title: string,
        placeholder: string = '',
        initialValue: string = ''
    ): Promise<string | undefined> {
        const input = new MultiLineInputBox(title, placeholder, initialValue);
        return input.show();
    }
} 