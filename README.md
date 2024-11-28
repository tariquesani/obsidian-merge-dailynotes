# Obsidian Daily Notes Merger

This plugin allows you to merge daily notes within a specified date range. You can choose to create a new file or append the merged content to an existing file in the output folder. This is particularly useful for consolidating notes over a period of time into a single file for better organization, review or using it with AI.

## Features
- Select a date range to merge notes from.
- Option to strip front matter and/or code blocks from the notes.
- Choose to create a new file or append to an existing file in the output folder.
- Integrates seamlessly with Obsidian's Daily Notes plugin.

## Installation

### Method 1: Manual Installation
1. **Download the plugin files**
   - Download `manifest.json`, `main.js`, and `styles.css` from the latest [release](https://github.com/tariquesani/obsidian-merge-dailynotes/releases/tag/1.0.0) 
2. **Locate your Obsidian Vault folder**
   - Open the `.obsidian/plugins` folder in your Obsidian vault.
   - If the `plugins` folder does not exist, create it.
   - Create `obsidian-merge-dailynotes` folder
3. **Place the plugin**
   - Copy the downloaded files ( `manifest.json`, `main.js`, and `styles.css`) into the `obsidian-merge-dailynotes` folder.
4. **Enable the plugin**
   - Open Obsidian.
   - Navigate to `Settings > Community Plugins > Installed Plugins`.
   - Find the plugin in the list and toggle it on.

### Method 2: Using BRAT
1. **Install BRAT (Beta Reviewers Auto-update Tool)**
   - Go to `Settings > Community Plugins` in Obsidian.
   - Search for and install the "BRAT" plugin.
2. **Add this plugin to BRAT**
   - Open BRAT settings. Choose "Add Beta plugin with frozen version"
   - Add this repository URL: `https://github.com/tariquesani/obsidian-merge-dailynotes`.
   - Specify the `1.0.0` tag for stable usage.
3. **Enable the plugin**
   - Follow the same steps to enable the plugin as in Manual Installation.

## Usage
1. **Ensure Daily Notes Plugin is Enabled**
   - Go to `Settings > Core Plugins` and enable the Daily Notes plugin.
2. **Access the Date Picker**
   - Trigger the plugin via the command palette or assigned hotkey.
   - Use the date picker modal to select the start and end dates for merging.
3. **Select Output Option**
   - Choose whether to create a new file or append to an existing file in the output folder.
4. **Review Merged File**
   - Find the merged file in the specified output folder in your vault.

## Configuration
The plugin provides the following customizable options in the settings:
- **Merge Path**: Folder where merged files are created or appended.
- **Strip Front Matter**: Remove YAML front matter from daily notes. (experimental: Does not work consistently, fixes welcome)
- **Strip Code Blocks**: Remove code blocks from daily notes. (experimental: Does not work consistently, fixes welcome)

## Support
For issues, suggestions, or contributions, please open an issue on the [GitHub](https://github.com/tariquesani/obsidian-merge-dailynotes/issues).

## License
This plugin is released under the [MIT License](LICENSE).
