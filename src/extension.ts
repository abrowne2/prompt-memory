import * as vscode from 'vscode';

import { UIManager } from './ui';
import { StorageManager } from './storage';
import { CursorCommands, EditorCommands, PromptManagerAction } from './types';

/**
 * Executes a prompt in the Cursor executePromptInQuickModal bar using clipboard as intermediary
 */
async function executePromptInModal(promptText: string, action: PromptManagerAction): Promise<void> {
	// Store the original clipboard content
	const originalClipboard = await vscode.env.clipboard.readText();

	const modalToOpen: CursorCommands = action === PromptManagerAction.AddNewQuick 
		? CursorCommands.OpenNonComposerModal 
		: CursorCommands.OpenComposerModal;
	
	try {
		await vscode.env.clipboard.writeText(promptText);
		await vscode.commands.executeCommand(modalToOpen.valueOf());
		await vscode.commands.executeCommand(CursorCommands.FocusAiPopup.valueOf());
		await new Promise(resolve => setTimeout(resolve, 50));
		await vscode.commands.executeCommand(EditorCommands.Paste.valueOf());
	} finally {
		// Restore original clipboard content
		await vscode.env.clipboard.writeText(originalClipboard);
	}
}

/**
 * Extension activation handler that sets up commands and configuration listeners
 * 
 * # Arguments
 * * `context` - The extension context provided by VS Code
 * 
 * # Commands Registered
 * - `prompt-memory.openShortcutManager` - Opens the prompt management UI
 * - `prompt-memory.executePrompt` - Executes a saved prompt
 * - `prompt-memory.clearAllPrompts` - Clears all saved prompts
 * 
 * # Features
 * - Manages prompt shortcuts through configuration
 * - Provides quick access to saved prompts
 * - Supports dynamic keyboard shortcuts
 * - Clipboard-based prompt execution
 */
export async function activate(context: vscode.ExtensionContext) {
	registerShortcutManagerCommand(context);
	registerExecutePromptCommand(context); 
	registerClearPromptsCommand(context);
	await setupPromptHistoryCommands(context);
	setupConfigurationListener(context);
}

function registerShortcutManagerCommand(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('prompt-memory.openShortcutManager', async () => {
		await UIManager.showPromptManager();
	});
	context.subscriptions.push(disposable);
}

async function registerExecutePromptCommand(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('prompt-memory.executePrompt', async () => {
		if (!validateActiveEditor()) {
			return;
		}

		const selection = await showPromptQuickPick();
		if (selection) {
			await executePromptInModal(selection.prompt, selection.action);
		}
	});
	context.subscriptions.push(disposable);
}

function validateActiveEditor(): boolean {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found');
		return false;
	}
	return true;
}

async function showPromptQuickPick() {
	const prompts = await StorageManager.getSavedPrompts();
	const items = Object.values(prompts).map(prompt => ({
		label: prompt.name,
		description: prompt.name,
		prompt: prompt.prompt,
		action: prompt.action
	}));

	return vscode.window.showQuickPick(items, {
		placeHolder: 'Select a prompt to execute'
	});
}

function registerClearPromptsCommand(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('prompt-memory.clearAllPrompts', async () => {
		const confirmed = await showClearConfirmation();
		if (confirmed) {
			await StorageManager.clearAllPrompts();
			vscode.window.showInformationMessage('All prompts have been cleared successfully');
		}
	});
	context.subscriptions.push(disposable);
}

async function showClearConfirmation(): Promise<boolean> {
	const confirmation = await vscode.window.showWarningMessage(
		'Are you sure you want to clear all saved prompts? This action cannot be undone.',
		{ modal: true },
		'Yes, Clear All',
		'Cancel'
	);
	return confirmation === 'Yes, Clear All';
}

async function setupPromptHistoryCommands(context: vscode.ExtensionContext) {
	const prompts = await StorageManager.getSavedPrompts();
	
	for (const prompt of Object.values(prompts)) {
		await registerPromptCommand(context, prompt);
	}
}

async function registerPromptCommand(context: vscode.ExtensionContext, prompt: any) {
	const properPromptID = generatePromptId(prompt.prompt);
	const commandId = `prompt-memory.execute.${properPromptID}`;
	
	const exists = await checkCommandExists(commandId);
	if (!exists) {
		const disposable = vscode.commands.registerCommand(
			commandId,
			async () => {
				await executePromptInModal(prompt.prompt, prompt.action);
			}
		);
		context.subscriptions.push(disposable);
	}
}

function generatePromptId(promptText: string): string {
	return promptText
		.split(/\s+/)
		.filter(word => word.length > 2)
		.slice(0, 5)
		.join('-');
}

async function checkCommandExists(commandId: string): Promise<boolean> {
	const commands = await vscode.commands.getCommands();
	return commands.includes(commandId);
}

function setupConfigurationListener(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async e => {
			if (e.affectsConfiguration('prompt-memory.savedPrompts')) {
				await setupPromptHistoryCommands(context);
			}
		})
	);
}

export function deactivate() {}