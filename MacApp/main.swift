import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, NSToolbarDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var switcher: NSSegmentedControl!
    private let toolbarId = NSToolbar.Identifier("MainToolbar")
    private let switchItemId = NSToolbarItem.Identifier("AppSwitcher")

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()

        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        webView = WKWebView(frame: .zero, configuration: config)

        switcher = NSSegmentedControl(
            labels: ["Second Brain", "ELSA"],
            trackingMode: .selectOne,
            target: self,
            action: #selector(appSwitched(_:))
        )
        switcher.selectedSegment = 0

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1000, height: 760),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Second Brain"
        window.center()

        let content = NSView()
        window.contentView = content
        webView.translatesAutoresizingMaskIntoConstraints = false
        content.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: content.topAnchor),
            webView.leadingAnchor.constraint(equalTo: content.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: content.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: content.bottomAnchor),
        ])

        let toolbar = NSToolbar(identifier: toolbarId)
        toolbar.delegate = self
        window.toolbar = toolbar
        window.toolbarStyle = .unified

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        loadApp(0)
    }

    private func loadApp(_ index: Int) {
        let file = index == 0 ? "index.html" : "elsa.html"
        let base = Bundle.main.resourceURL!
        webView.loadFileURL(base.appendingPathComponent(file), allowingReadAccessTo: base)
        window.title = index == 0 ? "Second Brain" : "ELSA — Work Hub"
    }

    @objc private func appSwitched(_ sender: NSSegmentedControl) {
        loadApp(sender.selectedSegment)
    }

    func toolbarAllowedItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        [switchItemId, .flexibleSpace]
    }

    func toolbarDefaultItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        [switchItemId, .flexibleSpace]
    }

    func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier itemIdentifier: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
        guard itemIdentifier == switchItemId else { return nil }
        let item = NSToolbarItem(itemIdentifier: itemIdentifier)
        item.view = switcher
        item.label = "App"
        return item
    }

    @objc private func reloadPage() {
        webView.reload()
    }

    @objc private func devToolsHint() {
        let alert = NSAlert()
        alert.messageText = "Developer Tools"
        alert.informativeText = "Right-click anywhere in the app and choose \"Inspect Element\" to open the Web Inspector."
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }

    @objc private func goBack() {
        webView.goBack()
    }

    @objc private func goForward() {
        webView.goForward()
    }

    private func buildMenu() {
        let mainMenu = NSMenu()

        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenuItem.submenu = appMenu
        appMenu.addItem(
            withTitle: "Quit \(ProcessInfo.processInfo.processName)",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        )

        let editMenuItem = NSMenuItem()
        mainMenu.addItem(editMenuItem)
        let editMenu = NSMenu(title: "Edit")
        editMenuItem.submenu = editMenu
        editMenu.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
        editMenu.addItem(.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")

        let viewMenuItem = NSMenuItem()
        mainMenu.addItem(viewMenuItem)
        let viewMenu = NSMenu(title: "View")
        viewMenuItem.submenu = viewMenu
        let reload = viewMenu.addItem(withTitle: "Reload", action: #selector(reloadPage), keyEquivalent: "r")
        reload.target = self
        let devtools = viewMenu.addItem(withTitle: "Developer Tools", action: #selector(devToolsHint), keyEquivalent: "d")
        devtools.target = self

        let navMenuItem = NSMenuItem()
        mainMenu.addItem(navMenuItem)
        let navMenu = NSMenu(title: "Navigate")
        navMenuItem.submenu = navMenu
        let back = navMenu.addItem(withTitle: "Back", action: #selector(goBack), keyEquivalent: "[")
        back.target = self
        let fwd = navMenu.addItem(withTitle: "Forward", action: #selector(goForward), keyEquivalent: "]")
        fwd.target = self

        NSApp.mainMenu = mainMenu
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()