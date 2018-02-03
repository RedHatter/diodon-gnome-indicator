const ZeitgeistClipboardStorage = imports.gi.Diodon.ZeitgeistClipboardStorage
const ClipboardConfiguration = imports.gi.Diodon.ClipboardConfiguration
const ClipboardTimerange = imports.gi.Diodon.ClipboardTimerange
const Utility = imports.gi.Diodon.Utility

const SettingsBindFlags = imports.gi.Gio.SettingsBindFlags
const Cancellable = imports.gi.Gio.Cancellable
const Settings = imports.gi.Gio.Settings
const Clipboard = imports.gi.Gtk.Clipboard
const Display = imports.gi.Gdk.Display
const GLib = imports.gi.GLib

class Controller {

  /**
   * Construct a new controller and underlining ZeitgeistClipboardStorage.
   *
   * @param onChange Callback for when the item list changes
   */
  constructor (onChange) {
    this.onChange = onChange
    this.storage = ZeitgeistClipboardStorage.new()
    this.configuration = ClipboardConfiguration.new()

    this.storage.connect('on_items_inserted', onChange)
    this.storage.connect('on_items_deleted', onChange)

    let settings = new Settings({ schema_id: 'net.launchpad.Diodon.clipboard' })

    settings.bind('app-paste-keybindings', this.configuration,
        'app-paste-keybindings', SettingsBindFlags.DEFAULT)

    settings.bind('instant-paste', this.configuration,
        'instant-paste', SettingsBindFlags.DEFAULT)

    settings.bind('recent-items-size', this.configuration,
        'recent-items-size', SettingsBindFlags.DEFAULT)
    settings.connect('changed', (obj, key) => {
      if (key == 'recent-items-size') onChange()
    })

    settings.bind('use-clipboard', this.configuration,
        'use-clipboard', SettingsBindFlags.DEFAULT)

    settings.bind('use-primary', this.configuration,
        'use-primary', SettingsBindFlags.DEFAULT)
  }


  /**
   * Get clipboard items which match given search query
   *
   * @param search_query query to search items for
   * @return clipboard items matching given search query
   */
  getItemsBySearchQuery (searchQuery, callback) {
    this.storage.get_items_by_search_query(searchQuery, [],
      ClipboardTimerange.ALL, new Cancellable(),
      (obj, res) => callback(this.storage.get_items_by_search_query_finish(res))
    )
  }

  /**
   * Get recent items.
   *
   * @return list of recent clipboard items
   */
  getRecentItems (callback) {
    this.storage.get_recent_items(this.configuration.get_recent_items_size(),
      [], ClipboardTimerange.ALL, new Cancellable(),
      (obj, res) => callback(this.storage.get_recent_items_finish(res))
    )
  }

  /**
   * Select clipboard item. Will preform paste if instant-paste is configured.
   *
   * @param item item to be selected
   */
  selectItem (item) {
    // Wait for GLib to finish processing signal otherwise the UI hangs.
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      // No way to get primary selection from Gjs
      item.to_clipboard(Clipboard.get_default(Display.get_default()))

      if (this.configuration.get_instant_paste())
        this.executePaste(item)
    })

    this.storage.select_item(item, this.configuration.get_use_clipboard(),
      this.configuration.get_use_primary(), new Cancellable(), this.onChange)
  }

  /**
   * Execute paste instantly according to set preferences.
   *
   * @param item item to be pasted
   */
  executePaste (item) {
      let key = null
      if(this.configuration.get_use_clipboard())
        key = this.configuration.lookup_app_paste_keybinding(
          Utility.get_path_of_active_application()) || '<Ctrl>V'

      // prefer primary selection paste as such works
      // in more cases (e.g. terminal)
      // however it does not work with files and images
      // if(this.configuration.get_use_primary() && item is TextClipboardItem) {
      //     key = '<Shift>Insert'
      // }

      if(key != null) {
        Utility.perform_key_event(key, true, 100)
        Utility.perform_key_event(key, false, 0)
      }
  }

  /**
   * Remove given item from view, storage and finally destroy
   * it gracefully.
   *
   * @param item item to be removed
   */
  removeItem (item) {
    this.storage.remove_item(item, this.onChange)
  }

  /**
   * Add given text as text item to current clipboard history
   *
   * @param type clipboard type
   * @param text text to be added
   * @param origin origin of clipboard item as application path
   */
  addItem (type, text, origin) {
    this.storage.add_item(
      TextClipboardItem.new(type, text, origin, DateTime.new_now_utc()),
      new Cancellable(), this.onChange
    )
  }
}
