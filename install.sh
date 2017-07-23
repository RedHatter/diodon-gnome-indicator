#!/bin/bash

PREFIX=${PREFIX:-"/usr"}
INSTALL_PATH=$PREFIX/share/gnome-shell/extensions/diodongnomeindicator@timothy.idioticdev.com/

files="controller.js extension.js metadata.json stylesheet.css"

if [ "$1" == "package" ]; then
  zip -j diodon-gnome-indicator.zip $files
  exit
elif [ "$1" == "uninstall" ]; then
  rm -r $INSTALL_PATH
fi

mkdir -p $INSTALL_PATH
cp $files $INSTALL_PATH
echo Installed in $INSTALL_PATH
