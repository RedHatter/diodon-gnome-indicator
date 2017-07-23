const GLib = imports.gi.GLib
const Gio  = imports.gi.Gio

const controllerIface = `<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN"
                      "http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd">
<!-- GDBus 2.53.4 -->
<node>
  <interface name="net.launchpad.diodon.Controller">
    <method name="ExecutePaste">
    </method>
    <method name="RemoveItemByChecksum">
      <arg type="s" name="checksum" direction="in"/>
    </method>
    <method name="AddTextItem">
      <arg type="s" name="text" direction="in"/>
      <arg type="s" name="origin" direction="in"/>
    </method>
    <method name="AddFileItem">
      <arg type="s" name="paths" direction="in"/>
      <arg type="s" name="origin" direction="in"/>
    </method>
    <method name="GetRecentItems">
      <arg type="as" name="cats" direction="in"/>
      <arg type="s" name="date_copied" direction="in"/>
      <arg type="aa{ss}" name="result" direction="out"/>
    </method>
    <method name="GetItemsBySearchQuery">
      <arg type="s" name="search_query" direction="in"/>
      <arg type="as" name="cats" direction="in"/>
      <arg type="s" name="date_copied" direction="in"/>
      <arg type="aa{ss}" name="result" direction="out"/>
    </method>
    <method name="GetItemByChecksum">
      <arg type="s" name="checksum" direction="in"/>
      <arg type="a{ss}" name="result" direction="out"/>
    </method>
    <method name="GetCurrentItem">
      <arg type="a{ss}" name="result" direction="out"/>
    </method>
    <method name="SelectItemByChecksum">
      <arg type="s" name="checksum" direction="in"/>
    </method>
    <method name="RebuildRecentMenu">
    </method>
    <method name="ShowHistory">
    </method>
    <method name="ShowPreferences">
    </method>
    <method name="Clear">
    </method>
    <method name="Quit">
    </method>
    <signal name="OnSelectItem">
      <arg type="a{ss}" name="item"/>
    </signal>
    <signal name="OnAddItem">
      <arg type="a{ss}" name="item"/>
    </signal>
    <signal name="OnRemoveItem">
      <arg type="a{ss}" name="item"/>
    </signal>
    <signal name="OnClear">
    </signal>
  </interface>
</node>
`
const ControllerProxy = Gio.DBusProxy.makeProxyWrapper(controllerIface);
let proxy = new ControllerProxy(Gio.DBus.session,
      'net.launchpad.diodon.Controller', '/net/launchpad/diodon/Controller')

function connect (signal, callback) {
  proxy.connectSignal(signal, callback)
}

function getItemsBySearchQuery (query, categories, dateCopied) {
  return new Promise((resolve, reject) =>
    proxy.call("GetItemsBySearchQuery", GLib.Variant.new_tuple([
      new GLib.Variant('s', query),
      new GLib.Variant('as', categories),
      new GLib.Variant('s', dateCopied)
    ]), Gio.DBusCallFlags.NONE, -1, null, (proxy, res) =>
      resolve(proxy.call_finish(res).deep_unpack()[0])))
}

function getRecentItems (categories, dateCopied) {
  return new Promise((resolve, reject) =>
    proxy.call("GetRecentItems", GLib.Variant.new_tuple([
      new GLib.Variant('as', categories),
      new GLib.Variant('s', dateCopied)
    ]), Gio.DBusCallFlags.NONE, -1, null, (proxy, res) =>
      resolve(proxy.call_finish(res).deep_unpack()[0])))
}

function selectItemByChecksum (checksum) {
  return new Promise((resolve, reject) =>
    proxy.call("SelectItemByChecksum", GLib.Variant.new_tuple([
      new GLib.Variant('s', checksum)
    ]), Gio.DBusCallFlags.NONE, -1, null, resolve))
}

function removeItemByChecksum (checksum) {
  return new Promise((resolve, reject) =>
    proxy.call("RemoveItemByChecksum", GLib.Variant.new_tuple([
      new GLib.Variant('s', checksum)
    ]), Gio.DBusCallFlags.NONE, -1, null, resolve))
}

function addTextItem (text, origin) {
  return new Promise((resolve, reject) =>
    proxy.call("AddTextItem", GLib.Variant.new_tuple([
      new GLib.Variant('s', text),
      new GLib.Variant('s', origin)
    ]), Gio.DBusCallFlags.NONE, -1, null, resolve))
}

function clear () {
  return new Promise((resolve, reject) =>
    proxy.call("Clear", null, Gio.DBusCallFlags.NONE, -1, null, resolve))
}

function showPreferences () {
  return new Promise((resolve, reject) =>
    proxy.call("ShowPreferences", null, Gio.DBusCallFlags.NONE, -1, null, resolve))
}

function quit () {
  return new Promise((resolve, reject) =>
    proxy.call("Quit", null, Gio.DBusCallFlags.NONE, -1, null, resolve))
}
