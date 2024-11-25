import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Plugin settings interface
interface MergeDailyNotesSettings {
    mergePath: string; // Path where merged files are saved
    stripFrontMatter: boolean; // Toggle for removing front matter
    stripCodeBlocks: boolean; // Toggle for removing code blocks
}

// Default plugin settings
const DEFAULT_SETTINGS: MergeDailyNotesSettings = {
    mergePath: "Merged Notes",
    stripFrontMatter: false,
    stripCodeBlocks: false,
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
		new DatePickerModal(this.app, async (startDate: string, endDate: string) => {
			await this.mergeDailyNotes(startDate, endDate);
		}).open();
	}

	async mergeDailyNotes(startDate: string, endDate: string) {
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

		const outputPath = `${this.settings.mergePath}/${startDate} to ${endDate}.md`;
		await vault.createFolder(this.settings.mergePath).catch(() => {}); // Ensure the folder exists

		const outputFile = await vault.create(outputPath, ""); // Create the file incrementally

		let currentDate = start.clone();

		while (currentDate.isSameOrBefore(end)) {
			const fileName = `${folder}/${currentDate.format(dateFormat)}.md`;
			const file = vault.getAbstractFileByPath(fileName);

			if (file) {
				let content = await vault.read(file);

				if (this.settings.stripFrontMatter) {
					content = content.replace(/^---[\s\S]*?---\n/, '');
				}

				if (this.settings.stripCodeBlocks) {
					content = content.replace(/```(?:.|\n)*?```/g, ""); // Corrected regex for multiline code blocks
				}

				await vault.append(
					outputFile,
					`## ${currentDate.format(
						"YYYY-MM-DD"
					)}\n\n${content}\n\n---\n\n`
				);
			}

			currentDate.add(1, "days");
		}

		new Notice(`Daily notes merged and saved to: ${outputPath}`);
	}
}

// Modal for date selection
class DatePickerModal extends Modal {
	constructor(app, onSubmit) {
		super(app);
		this.onSubmit = onSubmit; // Callback for handling date selection
	}

	onOpen() {
		const { contentEl } = this;

		// Inject CSS for better styling
		const styleEl = contentEl.createEl("style");
		styleEl.textContent = `
            .date-picker-modal label {
                display: block;
                margin-top: 10px;
                font-weight: bold;
            }
            .date-picker-modal input {
                width: 100%;
                padding: 5px;
                margin-bottom: 10px;
                font-size: 14px;
            }
            .date-picker-modal button {
                width: 100%;
                padding: 10px;
                background-color: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
                font-size: 16px;
                border-radius: 5px;
            }
            .date-picker-modal button:hover {
                background-color: #45a049;
            }
        `;

		// Add modal content
		contentEl.addClass("date-picker-modal");
		contentEl.createEl("label", { text: "Start Date:" });
		const startDateInput = contentEl.createEl("input", { type: "date" });

		contentEl.createEl("label", { text: "End Date:" });
		const endDateInput = contentEl.createEl("input", { type: "date" });

		// Set default values for the date inputs
		startDateInput.value = moment().subtract(7, "days").format("YYYY-MM-DD"); // Start date: one week prior
		endDateInput.value = moment().format("YYYY-MM-DD"); // End date: today


		const submitButton = contentEl.createEl("button", {
			text: "Merge Notes",
		});
		submitButton.addEventListener("click", () => {
			const startDate = startDateInput.value;
			const endDate = endDateInput.value;

			if (!startDate || !endDate || startDate > endDate) {
				new Notice("Invalid date range. Please try again.");
				return;
			}

			this.onSubmit(startDate, endDate); // Pass dates to callback
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
                        this.plugin.settings.mergePath = value.trim() || "Merged Notes";
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Strip out Front Matter")
            .setDesc("Remove front matter (YAML block) from each daily note before merging.")
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
            .setDesc("Remove code blocks (```) from each daily note before merging.")
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

