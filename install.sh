#!/bin/bash

PREFIX=${PREFIX:-"/usr"}
INSTALL_PATH=$PREFIX/share/gnome-shell/extensions/diodongnomeindicator@timothy.idioticdev.com

files="controller.js extension.js metadata.json stylesheet.css"

if [ "$1" == "package" ]; then
  zip -j diodon-gnome-indicator.zip $files
elif [ "$1" == "uninstall" ]; then
  [ -h $INSTALL_PATH ] && rm $INSTALL_PATH || rm -r $INSTALL_PATH
elif [ "$1" == "logs" ]; then
  journalctl /usr/bin/gnome-shell -f | grep -1 diodongnomeindicator
elif [ "$1" == 'link' ]; then
  mkdir -p $INSTALL_PATH
  ln -s -T $(pwd) $INSTALL_PATH
  echo Linked to $INSTALL_PATH
else
  mkdir -p $INSTALL_PATH
  cp $files $INSTALL_PATH
  echo Installed in $INSTALL_PATH
fi
