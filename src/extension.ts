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
	// Register the shortcut manager command
	let disposable = vscode.commands.registerCommand('prompt-memory.openShortcutManager', async () => {
		await UIManager.showPromptManager();
	});
	context.subscriptions.push(disposable);

	// Register the execute prompt command
	disposable = vscode.commands.registerCommand('prompt-memory.executePrompt', async () => {
		// Get active text editor
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found');
			return;
		}

		// Get all prompts and show quick pick
		const prompts = await StorageManager.getSavedPrompts();
		const items = Object.values(prompts).map(prompt => ({
			label: prompt.name,
			description: prompt.name,
			prompt: prompt.prompt,
			action: prompt.action
		}));

		const selection = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a prompt to execute'
		});

		if (selection) {
			await executePromptInModal(selection.prompt, selection.action);
		}
	});
	context.subscriptions.push(disposable);

	// Register clear all prompts command
	disposable = vscode.commands.registerCommand('prompt-memory.clearAllPrompts', async () => {
		const confirmation = await vscode.window.showWarningMessage(
			'Are you sure you want to clear all saved prompts? This action cannot be undone.',
			{ modal: true },
			'Yes, Clear All',
			'Cancel'
		);

		if (confirmation === 'Yes, Clear All') {
			await StorageManager.clearAllPrompts();
			vscode.window.showInformationMessage('All prompts have been cleared successfully');
		}
	});
	context.subscriptions.push(disposable);

	// Setup keyboard shortcuts for saved prompts
	async function setupPromptHistoryCommands() {
		const prompts = await StorageManager.getSavedPrompts();
		
		// Register new shortcuts for each prompt
		for (const prompt of Object.values(prompts)) {
			const properPromptID: string = prompt.prompt
				.split(/\s+/)
				.filter(word => word.length > 2) 
				.slice(0, 5)
				.join('-');

			// Check if command already exists before registering
			const commandId = `prompt-memory.execute.${properPromptID}`;
			const existingCommand = vscode.commands.getCommands().then(commands => 
				commands.includes(commandId)
			);

			if (!await existingCommand) {
				const disposable = vscode.commands.registerCommand(
					commandId,
					async () => {
						await executePromptInModal(prompt.prompt, prompt.action);
					}
				);

				context.subscriptions.push(disposable);
			}
		}
	}

	await setupPromptHistoryCommands();

	// Re-register commands when configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async e => {
			if (e.affectsConfiguration('prompt-memory.savedPrompts')) {
				await setupPromptHistoryCommands();
			}
		})
	);
}

export function deactivate() {}