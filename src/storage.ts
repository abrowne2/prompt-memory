import * as vscode from 'vscode';
import { SavedPrompt, PromptStorage } from './types';

export class StorageManager {
    private static readonly STORAGE_KEY = 'prompt-memory.savedPrompts';

    static async getSavedPrompts(): Promise<PromptStorage> {
        const config = vscode.workspace.getConfiguration();
        return config.get<PromptStorage>(this.STORAGE_KEY) || {};
    }

    static async savePrompt(prompt: SavedPrompt): Promise<void> {
        const prompts = await this.getSavedPrompts();
        prompts[prompt.id] = prompt;
        await vscode.workspace.getConfiguration().update(
            this.STORAGE_KEY,
            prompts,
            vscode.ConfigurationTarget.Global
        );
    }

    static async deletePrompt(id: string): Promise<void> {
        const prompts = await this.getSavedPrompts();
        delete prompts[id];
        await vscode.workspace.getConfiguration().update(
            this.STORAGE_KEY,
            prompts,
            vscode.ConfigurationTarget.Global
        );
    }

    /**
     * Clears all saved prompts from storage
     * 
     * # Returns
     * A promise that resolves when the storage has been cleared
     * 
     * # Example
     * ```typescript
     * await StorageManager.clearAllPrompts();
     * ```
     */
    static async clearAllPrompts(): Promise<void> {
        await vscode.workspace.getConfiguration().update(
            this.STORAGE_KEY,
            {},
            vscode.ConfigurationTarget.Global
        );
    }
} 