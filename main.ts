import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFolder,
	TFile,
} from "obsidian";

// Plugin settings interface
interface MergeDailyNotesSettings {
	mergePath: string;
	stripFrontMatter: boolean;
	stripCodeBlocks: boolean;
	lastStartDate: string | null; // New property to store the last start date
	lastEndDate: string | null; // New property to store the last end date
}

// Default plugin settings
const DEFAULT_SETTINGS: MergeDailyNotesSettings = {
	mergePath: "Merged Notes",
	stripFrontMatter: false,
	stripCodeBlocks: false,
	lastStartDate: null, // Default to null
	lastEndDate: null, // Default to null
};

// Plugin class
export default class MergeDailyNotesPlugin extends Plugin {
	settings: MergeDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "merge-daily-notes",
			name: "now!",
			callback: () => this.openDatePickerModal(),
		});

		this.addSettingTab(new MergeDailyNotesSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	openDatePickerModal() {
		const defaultStartDate =
			this.settings.lastStartDate ||
			moment().subtract(7, "days").format("YYYY-MM-DD");
		const defaultEndDate =
			this.settings.lastEndDate || moment().format("YYYY-MM-DD");

		new DatePickerModal(
			this.app,
			async (startDate, endDate, selectedFile) => {
				await this.mergeDailyNotes(startDate, endDate, selectedFile);
			},
			defaultStartDate,
			defaultEndDate,
			this.settings.mergePath
		).open();
	}
	async mergeDailyNotes(
		startDate: string,
		endDate: string,
		selectedFile: string
	) {
		// Save the selected dates in settings
		this.settings.lastStartDate = startDate;
		this.settings.lastEndDate = endDate;
		await this.saveSettings();

		const dailyNotesPlugin =
			this.app.internalPlugins.getPluginById("daily-notes");

		if (!dailyNotesPlugin || !dailyNotesPlugin.enabled) {
			new Notice("Daily Notes plugin is not enabled.");
			return;
		}

		const settings = dailyNotesPlugin.instance.options;
		const folder = settings.folder;
		const dateFormat = settings.format;

		const start = moment(startDate, "YYYY-MM-DD");
		const end = moment(endDate, "YYYY-MM-DD");

		const vault = this.app.vault;
		const mergePath = this.settings.mergePath;

		await vault.createFolder(mergePath).catch(() => {}); // Ensure the folder exists

		let outputFile: TFile | null = null;

		// Handle file selection logic
		if (selectedFile === "new") {
			const outputPath = `${mergePath}/${startDate} to ${endDate}.md`;
			outputFile = await vault.create(outputPath, ""); // Create a new file
		} else {
			outputFile = vault.getAbstractFileByPath(selectedFile) as TFile;
			if (!outputFile) {
				new Notice("Selected file not found. Please try again.");
				return;
			}
		}

		let currentDate = start.clone();
		while (currentDate.isSameOrBefore(end)) {
			const fileName = `${folder}/${currentDate.format(dateFormat)}.md`;
			const file = vault.getAbstractFileByPath(fileName);

			if (file) {
				let content = await vault.read(file);

				// Apply stripping settings
				if (this.settings.stripFrontMatter) {
					content = content.replace(/^---[\s\S]*?---\n/, "");
				}

				if (this.settings.stripCodeBlocks) {
					content = content.replace(/```[\s\S]*?```/g, ""); // Regex for multiline blocks
				}

				// Append the formatted content to the output file
				await vault.append(
					outputFile,
					`## ${currentDate.format(
						"YYYY-MM-DD"
					)}\n\n${content}\n\n---\n\n`
				);
			}

			currentDate.add(1, "days");
		}

		new Notice(`Daily notes merged and saved to: ${outputFile.path}`);
	}
}

// Modal for date selection
class DatePickerModal extends Modal {
	constructor(
		app: App,
		private onSubmit: (
			startDate: string,
			endDate: string,
			selectedFile: string
		) => void,
		private defaultStartDate: string,
		private defaultEndDate: string,
		private mergePath: string
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		// Add a class for styling
		contentEl.addClass("date-picker-modal");

		// Add modal content
		contentEl.createEl("label", { text: "Start Date:" });
		const startDateInput = contentEl.createEl("input", { type: "date" });
		startDateInput.value = this.defaultStartDate; // Set default start date

		contentEl.createEl("label", { text: "End Date:" });
		const endDateInput = contentEl.createEl("input", { type: "date" });
		endDateInput.value = this.defaultEndDate; // Set default end date

		// Dropdown for file selection
		contentEl.createEl("label", { text: "Select Output File:" });
		const fileSelect = contentEl.createEl("select");

		// Add "Create New File" as the first option
		fileSelect.createEl("option", {
			text: "Create New File",
			value: "new",
		});

		// Populate the dropdown with files from mergePath
		const outputFolder = this.app.vault.getAbstractFileByPath(
			this.mergePath
		);
		if (outputFolder && outputFolder instanceof TFolder) {
			for (const file of outputFolder.children) {
				if (file instanceof TFile && file.extension === "md") {
					fileSelect.createEl("option", {
						text: file.name,
						value: file.path,
					});
				}
			}
		} else {
			new Notice("Output folder not found or empty.");
		}

		const submitButton = contentEl.createEl("button", {
			text: "Merge Notes",
		});
		submitButton.addEventListener("click", () => {
			const startDate = startDateInput.value;
			const endDate = endDateInput.value;
			const selectedFile = fileSelect.value;

			if (!startDate || !endDate || startDate > endDate) {
				new Notice("Invalid date range. Please try again.");
				return;
			}

			this.onSubmit(startDate, endDate, selectedFile); // Pass dates to callback
			this.close(); // Close the modal
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty(); // Clean up modal content
	}
}

// Plugin settings class
class MergeDailyNotesSettingTab extends PluginSettingTab {
	plugin: MergeDailyNotesPlugin;

	constructor(app: App, plugin: MergeDailyNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Merge Daily Notes Settings" });

		new Setting(containerEl)
			.setName("Merge Path")
			.setDesc("Specify the folder where merged files will be saved.")
			.addText((text) =>
				text
					.setPlaceholder("Merged Notes")
					.setValue(this.plugin.settings.mergePath)
					.onChange(async (value) => {
						this.plugin.settings.mergePath =
							value.trim() || "Merged Notes";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Strip out Front Matter")
			.setDesc(
				"Remove front matter (YAML block) from each daily note before merging."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.stripFrontMatter)
					.onChange(async (value) => {
						this.plugin.settings.stripFrontMatter = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Strip out Code Blocks")
			.setDesc(
				"Remove code blocks (```) from each daily note before merging."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.stripCodeBlocks)
					.onChange(async (value) => {
						this.plugin.settings.stripCodeBlocks = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
