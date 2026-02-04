#
# Copyright (c) 2016-2026 ega, irl.
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version. See LICENSE.md.
#
ls ../js/*.js

jsdoc --verbose \
      --debug \
      --destination . \
      --access all \
      --configure conf.js \
      ../js/*.js
