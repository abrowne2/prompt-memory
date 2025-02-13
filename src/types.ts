export interface SavedPrompt {
    id: string;
    name: string;
    prompt: string;
    action: PromptManagerAction;
}

export interface PromptStorage {
    [id: string]: SavedPrompt;
} 

export enum CursorCommands {
    OpenNonComposerModal = 'aipopup.action.modal.generate',
    FocusAiPopup = 'aipopup.action.focusEdit',
    AcceptPromptBarPopup = 'aipopup.action.acceptPromptBar',
    SubmitEdit = 'workbench.action.edits.submit',
    SubmitUnifiedChatAction = 'aichat.internal.submitUnifiedChatAction',
    OpenComposerModal = 'composer.openAsBar',
    Execute = 'cursorai.action.executeInterpreterAction',
}

export enum EditorCommands {
    Paste = 'editor.action.clipboardPasteAction',
}

/**
 * Actions available in the prompt manager quick pick menu
 */
export enum PromptManagerAction {
    AddNewQuick = 'Add New Quick Prompt',
    AddNewComposer = 'Add New Composer Prompt',
    ClearAll = 'Clear All',
    Edit = 'Edit'
}

/**
 * VSCode Codicons used in the UI
 * @see https://microsoft.github.io/vscode-codicons/dist/codicon.html
 */
export enum VSCodeIcon {
    Add = '$(add)',
    ClearAll = '$(clear-all)',
    Prompt = '$(symbol-keyword)'
}

