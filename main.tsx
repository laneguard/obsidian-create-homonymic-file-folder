import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";
import * as path from "path";

// 定义插件设置接口
interface MyPluginSettings {
	mySetting: string; // 插件的设置项
}

// 默认设置
const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default", // 默认值为 'default'
};

// 插件主类
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings; // 插件设置

	// 插件加载时调用
	//onload() 生命周期函数在用户激活 Obsidian 插件时触发。这将是您设置插件大部分功能的地方。该方法在插件更新时也会被触发。
	async onload() {
		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));

		await this.loadSettings(); // 加载设置

		// 在左侧功能区添加一个图标
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// 用户点击图标时显示通知
				new Notice("This is a notice!");
			}
		);

		const ribbonIconEl2 = this.addRibbonIcon(
			"dice",
			"Activate view",
			() => {
				this.activateView();
			}
		);

		// 为图标添加自定义类
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// 在状态栏添加一个状态项（不支持移动端）
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// 添加一个简单的命令，可以在任何地方触发
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open(); // 打开示例模态框
			},
		});

		// 添加一个编辑器命令，可以对当前编辑器实例执行操作
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection()); // 打印当前选中的文本
				editor.replaceSelection("Sample Editor Command"); // 替换选中文本
			},
		});

		// 添加一个复杂命令，可以检查当前应用状态是否允许执行命令
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// 检查条件：当前是否有 Markdown 视图
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// 如果 checking 为 true，仅检查命令是否可以执行
					// 如果 checking 为 false，则执行操作
					if (!checking) {
						new SampleModal(this.app).open(); // 打开示例模态框
					}
					// 当检查函数返回 true 时，命令才会显示在命令面板中
					return true;
				}
			},
		});

		// 添加设置选项卡，用户可以通过它配置插件的各个方面
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// 如果插件绑定了任何全局 DOM 事件（在不属于插件的部分）
		// 使用此函数会在插件禁用时自动移除事件监听器
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt); // 打印点击事件
		});

		// 注册定时器，插件禁用时会自动清除定时器
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle("create-homonymic-file-folder:create-folder 👈")
						.setIcon("document")
						.onClick(async () => {
							const basePath = view.file?.vault.adapter.basePath;
							const filePath = view.file.path;
							const absoluteFilePath = path.join(basePath, filePath);
							const folderPath = path.join(path.dirname(absoluteFilePath),view.file?.basename);
							createFolder(folderPath);
							moveFile(absoluteFilePath,folderPath);
							return new Notice(absoluteFilePath);
						});
				});
			})
		);
	}

	// 插件卸载时调用
	//onunload() 生命周期函数在插件被禁用时触发。插件所调用的任何资源必须在这里得到释放，以防止在您的插件被禁用后对 Obsidian 的性能产生影响。
	onunload() {
		// 清理操作
	}

	// 加载设置
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	// 保存设置
	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}
}

// 示例模态框类
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	// 模态框打开时调用
	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!"); // 设置模态框内容
	}

	// 模态框关闭时调用
	onClose() {
		const { contentEl } = this;
		contentEl.empty(); // 清空模态框内容
	}
}

// 示例设置选项卡类
class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// 显示设置选项卡内容
	display(): void {
		const { containerEl } = this;

		containerEl.empty(); // 清空容器

		// 添加一个设置项
		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

const VIEW_TYPE_EXAMPLE = "example-view";

class ExampleView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Example view";
	}

	async onOpen() {
		const root = createRoot(this.containerEl.children[1]);
		root.render(
			<div>
				<ReactView />
			</div>
		);
	}

	async onClose() {
		ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
	}
}

import * as fs from "fs";

function createFolder(folderPath: string): void {
	try {
		// 使用 fs.mkdirSync 同步创建文件夹
		fs.mkdirSync(folderPath, { recursive: true });
		console.log(`文件夹已成功创建：${folderPath}`);
	} catch (error) {
		console.error(`创建文件夹时出错：${error.message}`);
	}
}

function moveFile(sourceFilePath: string, targetDirPath: string): void {
	try {
		// 获取源文件的文件名
		const fileName = path.basename(sourceFilePath);
		// 构造目标文件的完整路径
		const targetFilePath = path.join(targetDirPath, fileName);

		// 使用 fs.renameSync 同步移动文件
		fs.renameSync(sourceFilePath, targetFilePath);
		console.log(`文件已成功移动到：${targetFilePath}`);
	} catch (error) {
		console.error(`移动文件时出错：${error.message}`);
	}
}