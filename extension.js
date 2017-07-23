const PopupMenu = imports.ui.popupMenu
const PanelMenu = imports.ui.panelMenu
const Dialog = imports.ui.modalDialog.ModalDialog
const Main = imports.ui.main
const Clutter = imports.gi.Clutter
const Lang = imports.lang
const St = imports.gi.St

const Extension = imports.misc.extensionUtils.getCurrentExtension()
const Controller = Extension.imports.controller

const DiodonGnomeIndicator = Lang.Class({
  Name: 'DiodonGnomeIndicator',
  Extends: PanelMenu.Button,

  destroy () {
    this.parent()
  },

  _init () {
    this.parent(0.0, "DiodonGnomeIndicator")
    let hbox = new St.BoxLayout({
      style_class: 'panel-status-menu-box clipboard-indicator-hbox'
    })
    this.icon = new St.Icon({
      icon_name: 'edit-paste-symbolic',
      style_class: 'system-status-icon clipboard-indicator-icon'
    })

    hbox.add_child(this.icon)
    this.actor.add_child(hbox)

    let searchSection = new PopupMenu.PopupMenuSection()
    let entry = new St.Entry({
      style_class: 'search-entry'
    })
    searchSection.actor.add_actor(entry)
    this.menu.addMenuItem(searchSection)
    entry['clutter-text'].connect('text-changed', () =>
      this._queryItems(entry.text))

    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())

    this.historySection = new PopupMenu.PopupMenuSection()
    this.scrollViewMenuSection = new PopupMenu.PopupMenuSection()
    let historyScrollView = new St.ScrollView({
      overlay_scrollbars: true
    })
    historyScrollView.add_actor(this.historySection.actor)
    this.scrollViewMenuSection.actor.add_actor(historyScrollView)
    this.menu.addMenuItem(this.scrollViewMenuSection)

    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())

    let menuItem = new PopupMenu.PopupMenuItem(_('Clear'))
    this.menu.addMenuItem(menuItem)
    menuItem.connect('activate', () => {
      Controller.clear().then()
      this.historySection.removeAll()
    })

    menuItem = new PopupMenu.PopupMenuItem(_('Preferences'))
    this.menu.addMenuItem(menuItem)
    menuItem.connect('activate', () => Controller.showPreferences)

    menuItem = new PopupMenu.PopupMenuItem(_('Quit'))
    this.menu.addMenuItem(menuItem)
    menuItem.connect('activate', () => {
      Controller.quit()
      this.destroy()
    })

    Controller.connect('OnRemoveItem', () => this._queryItems())
    Controller.connect('OnSelectItem', () => this._queryItems())
    Controller.connect('OnAddItem', () => this._queryItems())
    Controller.connect('OnClear', () => this._queryItems())

    this._queryItems()
  },

  _queryItems (queryString) {
    let query = queryString
      ? Controller.getItemsBySearchQuery(queryString, [], '')
      : Controller.getRecentItems([], '')
    query.then(items => {
      let menuItems = this.historySection._getMenuItems()
      let length = Math.max(menuItems.length, items.length)
      for (let i = 0; i < length; i++) {
        if (i < menuItems.length)
          menuItems[i].destroy()

        if (i < items.length)
          this.historySection.addMenuItem(this._createItem(items[i]), i)
      }
    })
  },

  _createItem (item) {
    let checksum = item.checksum

    let menuItem = new PopupMenu.PopupMenuItem(item.label)

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
            icon_name: 'edit-symbolic',
        })
    })
    edit.connect('button-press-event', () => this._editItem(item))
    buttons.add_child(edit)

    let remove = new St.Button({
        style_class: 'clipboard-action',
        can_focus: true,
        child: new St.Icon({
            style_class: 'clipboard-action-icon',
            icon_name: 'edit-delete-symbolic',
        })
    })
    remove.connect('button-press-event', () =>
      Controller.removeItemByChecksum(checksum)
        .then(() => this._queryItems()))
    buttons.add_child(remove)

    menuItem.actor.connect('enter-event', () => {
      if (this.hover) this.hover.opacity = 0
      this.hover = buttons
      buttons.opacity = 255
    })
    menuItem.actor.connect('leave-event', () => buttons.opacity = 0)

    menuItem.connect('activate', () => this._selectItem(checksum))
    return menuItem
  },

  _selectItem (checksum) {
    Controller.selectItemByChecksum(checksum)
      .then(() => {
        this.menu.close()
        this._queryItems()
      })
  },

  _editItem (item) {
    this.menu.close()

    let dialog = new Dialog()

    let entry = new St.Entry({
      style_class: 'edit-entry'
    })
    entry['clutter-text']['single-line-mode'] = false
    entry['clutter-text']['activatable'] = false
    entry.text = item.text
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
        Controller.removeItemByChecksum(item.checksum)
          .then(() => Controller.addTextItem(entry.text, item.origin))
          .then(() => this._queryItems())
      },
      default: true
    })

    dialog.open()
  },

  _toggleMenu () {
    this.menu.toggle()
  }
})

function enable () {
  Main.panel.addToStatusArea('diodonGnomeIndicator', new DiodonGnomeIndicator(), 1)
}

function disable () {
  diodonGnomeIndicator.destroy()
}
