import * as vscode from 'vscode';
import { SavedPrompt, PromptManagerAction, VSCodeIcon } from './types';
import { StorageManager } from './storage';
import { MultiLineInputBox } from './multiLineInput';

export class UIManager {
    static async showPromptManager(): Promise<void> {
        const prompts = await StorageManager.getSavedPrompts();
        const items = Object.values(prompts).map(prompt => ({
            label: `${VSCodeIcon.Prompt} ${prompt.name}`,
            action: prompt,
        }));

        const selection = await vscode.window.showQuickPick([
            { 
                label: `${VSCodeIcon.Add} Add New Prompt`, 
                action: PromptManagerAction.AddNew 
            },
            { 
                label: `${VSCodeIcon.ClearAll} Clear All Prompts`, 
                action: PromptManagerAction.ClearAll 
            },
            ...items
        ], {
            placeHolder: 'Manage Prompts'
        });

        if (!selection) return;

        switch (selection.action) {
            case PromptManagerAction.AddNew:
                await this.addNewPrompt();
                break;
            case PromptManagerAction.ClearAll:
                await vscode.commands.executeCommand('prompt-memory.clearAllPrompts');
                break;
            default:
                if (typeof selection.action === 'object') {
                    await this.editPrompt(selection.action as SavedPrompt);
                }
                break;
        }
    }

    private static async addNewPrompt(): Promise<void> {
        const name = await vscode.window.showInputBox({
            placeHolder: 'Enter prompt name',
            validateInput: text => text ? null : 'Name is required'
        });
        if (!name) return;

        const prompt = await MultiLineInputBox.show(
            'Enter Prompt',
            'Type your prompt here. Use Cmd+Enter (or Ctrl+Enter) to save, Escape to cancel.'
        );
        if (!prompt) return;

        const newPrompt: SavedPrompt = {
            id: prompt
                .split(/\s+/)
                .filter(word => word.length > 2)
                .slice(0, 5)
                .join('-'),
            name,
            prompt,
        };

        await StorageManager.savePrompt(newPrompt);
        vscode.window.showInformationMessage(`Prompt "${name}" saved successfully`);
    }

    private static async editPrompt(prompt: SavedPrompt): Promise<void> {
        const name = await vscode.window.showInputBox({
            value: prompt.name,
            placeHolder: 'Enter prompt name',
            validateInput: text => text ? null : 'Name is required'
        });
        if (!name) return;

        const promptText = await MultiLineInputBox.show(
            'Edit Prompt',
            'Type your prompt here. Use Cmd+Enter (or Ctrl+Enter) to save, Escape to cancel.',
            prompt.prompt
        );

        if (!promptText) return;

        const updatedPrompt: SavedPrompt = {
            ...prompt,
            name,
            prompt: promptText,
        };

        await StorageManager.savePrompt(updatedPrompt);
        vscode.window.showInformationMessage(`Prompt "${name}" updated successfully`);
    }
} 