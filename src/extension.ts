import * as vscode from "vscode";

/** Delay before sending initial config to allow webview to initialize */
const WEBVIEW_INIT_DELAY_MS = 500;

interface WebviewMessage {
  type: string;
  [key: string]: unknown;
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new MkdownEditorProvider(context);
  context.subscriptions.push(MkdownEditorProvider.register(context, provider));

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("mkdown")) {
        const config = vscode.workspace.getConfiguration("mkdown");
        provider.postMessageToActiveWebview({
          type: "update-config",
          config: {
            theme: config.get("theme"),
            fontSize: config.get("font.size"),
            fontFamily: config.get("font.family"),
            alignment: config.get("layout.alignment"),
            highlightEnabled: config.get("highlight.enabled"),
            highlightRules: config.get("highlight.rules"),
            selectionToolbar: config.get("selectionToolbar.enabled"),
          },
        });
      }
    })
  );
}

/**
 * Custom text editor provider for the mkdown Markdown Editor.
 * Manages webview panels, config synchronization, and document syncing.
 *
 * Reference: https://vogella.com/blog/multiple-webviews-single-extension/
 */
class MkdownEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "mkdown.editor";
  private isUpdatingFromWebview = false;
  private lastWebviewText = "";
  private webviews = new Set<vscode.WebviewPanel>();
  private latestConfig: Record<string, unknown> | null = null;

  constructor(private readonly context: vscode.ExtensionContext) { }

  public static register(context: vscode.ExtensionContext, provider: MkdownEditorProvider): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(MkdownEditorProvider.viewType, provider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    });
  }

  public postMessageToActiveWebview(message: WebviewMessage) {
    // Cache config so we can re-apply it when panels become visible again
    if (message.type === "update-config") {
      this.latestConfig = message.config as Record<string, unknown>;
    }
    for (const panel of this.webviews) {
      try {
        panel.webview.postMessage(message);
      } catch {
        // Panel was disposed between iterations — clean it up
        this.webviews.delete(panel);
      }
    }
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.webviews.add(webviewPanel);

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };

    webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview);

    const config = vscode.workspace.getConfiguration("mkdown");

    // Sync initial content & config after a short delay for webview initialization
    setTimeout(() => {
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
      });
      webviewPanel.webview.postMessage({
        type: "update-config",
        config: {
          theme: config.get("theme"),
          fontSize: config.get("font.size"),
          fontFamily: config.get("font.family"),
          alignment: config.get("layout.alignment"),
          highlightEnabled: config.get("highlight.enabled"),
          highlightRules: config.get("highlight.rules"),
          selectionToolbar: config.get("selectionToolbar.enabled"),
        },
      });
    }, WEBVIEW_INIT_DELAY_MS);

    // Sync host changes to webview
    const subscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString() && !this.isUpdatingFromWebview) {
        const newText = document.getText();
        // Don't echo back text that originated from the webview
        if (newText !== this.lastWebviewText) {
          webviewPanel.webview.postMessage({
            type: "update",
            text: newText,
          });
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      subscription.dispose();
      this.webviews.delete(webviewPanel);
    });

    // Re-apply config when panel becomes visible again (e.g. after switching back from settings)
    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.visible && this.latestConfig) {
        webviewPanel.webview.postMessage({
          type: "update-config",
          config: this.latestConfig,
        });
      }
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "edit":
          this.lastWebviewText = e.text;
          this.updateTextDocument(document, e.text);
          return;
        case "info":
          vscode.window.showInformationMessage(e.text);
          return;
      }
    });
  }

  private async updateTextDocument(document: vscode.TextDocument, text: string) {
    this.isUpdatingFromWebview = true;
    try {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
      const success = await vscode.workspace.applyEdit(edit);
      if (!success) {
        console.error("[mkdown] Failed to apply workspace edit");
      }
    } catch (error) {
      console.error("[mkdown] Error updating document:", error);
    } finally {
      this.isUpdatingFromWebview = false;
    }
  }

  private getWebviewContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "webview.dist.js"));
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "style.css"));
    const zenithCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "zenith-styles.css"));
    const nonce = getNonce();

    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    style-src ${webview.cspSource} 'unsafe-inline';
                    script-src 'nonce-${nonce}';
                    font-src ${webview.cspSource};
                    img-src ${webview.cspSource} https: data:;
                ">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${cssUri}" rel="stylesheet">
                <link href="${zenithCssUri}" rel="stylesheet">
                <title>mkdown Editor</title>
            </head>
            <body>
                <div id="editor"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
  }
}

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
