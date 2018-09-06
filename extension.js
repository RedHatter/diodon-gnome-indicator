const PopupMenu = imports.ui.popupMenu
const PanelMenu = imports.ui.panelMenu
const Dialog = imports.ui.modalDialog.ModalDialog
const Main = imports.ui.main

const Clutter = imports.gi.Clutter
const Gio = imports.gi.Gio
const St = imports.gi.St

const Lang = imports.lang

const Extension = imports.misc.extensionUtils.getCurrentExtension()
const Controller = Extension.imports.controller.Controller

const DiodonGnomeIndicator = Lang.Class({
  Name: 'DiodonGnomeIndicator',
  Extends: PanelMenu.Button,

  destroy () {
    this.parent()
  },

  _init () {
    this.parent(0.0, "DiodonGnomeIndicator")
    this.buildMenu = this.buildMenu.bind(this)
    this.queryItems = this.queryItems.bind(this)

    // Icon for menu button
    let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' })
    hbox.add_child(new St.Icon({
      icon_name: 'edit-paste-symbolic',
      style_class: 'system-status-icon'
    }))
    this.actor.add_child(hbox)

    // Search entry
    let searchSection = new PopupMenu.PopupMenuSection()
    this.menu.addMenuItem(searchSection)

    let entry = new St.Entry({ style_class: 'search-entry' })
    searchSection.actor.add_actor(entry)
    entry['clutter-text'].connect('text-changed', () => {
      // Set filter text and requery items
      this.searchQuery = entry.text
      this.queryItems()
    })
    entry.set_primary_icon(new St.Icon({
      style_class: 'clipboard-entry-icon',
      icon_name: 'edit-find'
    }))

    // Search entry clear button
    let clear = new St.Button({
      child: new St.Icon({
        style_class: 'clipboard-entry-icon',
        icon_name: 'edit-clear-symbolic'
      })
    })
    clear.connect('button-press-event', () => entry.text = '')
    entry.set_secondary_icon(clear)

    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())

    // Section for clipboard items
    this.historySection = new PopupMenu.PopupMenuSection()
    let scrollViewMenuSection = new PopupMenu.PopupMenuSection()
    let historyScrollView = new St.ScrollView({ overlay_scrollbars: true })
    historyScrollView.add_actor(this.historySection.actor)
    scrollViewMenuSection.actor.add_actor(historyScrollView)
    this.menu.addMenuItem(scrollViewMenuSection)

    // Wait for Diodon
    Gio.bus_watch_name(
      Gio.BusType.SESSION, 'org.gnome.zeitgeist.Engine',
      Gio.BusNameWatcherFlags.NONE,
      () => this.onZeitgeistStarted(),
      () => {})
  },

  /**
   * Initializes connection to Diodon and querys items.
   */
  onZeitgeistStarted () {
    this.controller = new Controller(this.queryItems)
    this.queryItems()
  },

  /**
   * Retrieves items from Diodon and build menu.
   */
  queryItems () {
    if (this.searchQuery)
      this.controller.getItemsBySearchQuery(this.searchQuery, this.buildMenu)
    else
      this.controller.getRecentItems(this.buildMenu)
  },

  /**
   * Clear menu items and rebuild.
   *
   * @param items The list of clipboard items to build from
   */
  buildMenu (items) {
    let menuItems = this.historySection._getMenuItems()
    let length = Math.max(menuItems.length, items.length)
    for (let i = 0; i < length; i++) {
      if (i < menuItems.length)
        menuItems[i].destroy()

      if (i < items.length)
        this.historySection.addMenuItem(this.createItem(items[i]), i)
    }
  },

  /**
   * Create menu item from clipboard item.
   *
   * @param item The clipboard item to build from
   */
  createItem (item) {
    let menuItem = new PopupMenu.PopupMenuItem(item.get_label())
    menuItem.connect('activate', () => this.selectItem(item))

    let buttons = new St.BoxLayout()
    buttons.opacity = 0
    buttons.set_x_align(Clutter.ActorAlign.END)
    buttons.set_x_expand(true)
    buttons.set_y_expand(true)
    menuItem.actor.add_child(buttons)

    let edit = new St.Button({
      style_class: 'clipboard-action',
      can_focus: true,
      child: new St.Icon({
        style_class: 'clipboard-action-icon',
        icon_name: 'document-edit-symbolic',
      })
    })
    edit.connect('button-press-event', () => this.editItem(item))
    buttons.add_child(edit)

    let remove = new St.Button({
      style_class: 'clipboard-action',
      can_focus: true,
      child: new St.Icon({
        style_class: 'clipboard-action-icon',
        icon_name: 'edit-delete-symbolic',
      })
    })
    remove.connect('button-press-event', () => this.controller.removeItem(item))
    buttons.add_child(remove)

    // Only show buttons on hover
    menuItem.actor.connect('enter-event', () => {
      if (this.hover) this.hover.opacity = 0
      this.hover = buttons
      buttons.opacity = 255
    })
    menuItem.actor.connect('leave-event', () => buttons.opacity = 0)

    return menuItem
  },

  /**
   * Select clipboard item. Might paste based on configuration.
   *
   * @param item The clipboard item to select
   */
  selectItem (item) {
    this.menu.close()
    this.controller.selectItem(item)
  },

  /**
   * Open dialog to edit clipboard item.
   *
   * @param item The clipboard item to edit
   */
  editItem (item) {
    this.menu.close()

    let dialog = new Dialog()

    let entry = new St.Entry({ style_class: 'edit-entry' })
    entry['clutter-text']['single-line-mode'] = false
    entry['clutter-text']['activatable'] = false
    entry.text = item.get_text()
    dialog.contentLayout.add(entry)

    dialog.addButton({
      label: 'Cancel',
      action: () => dialog.close(),
      keys: [ Clutter.KEY_Escape ]
    })

    dialog.addButton({
      label: 'Done',
      action: () => {
        dialog.close()
        this.controller.removeItem(item)
        this.controller.add_item(item.get_clipboard_type(), text, item.get_origin())
      },
      default: true
    })

    dialog.open()
    entry['clutter-text'].grab_key_focus()
  }
})

let diodonGnomeIndicator = null

function enable () {
  diodonGnomeIndicator = new DiodonGnomeIndicator()
  Main.panel.addToStatusArea('diodonGnomeIndicator', diodonGnomeIndicator, 1)
}

function disable () {
  diodonGnomeIndicator.destroy()
}
