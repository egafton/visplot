# Visplot
Visibility plot and observation scheduling tool for telescopes. It allows automatic, nearly-optimal scheduling of an entire observing night.

## Getting started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* a web server (e.g., Apache) that can run PHP scripts (i.e., mod_php enabled);
* a modern browser with HTML5 support (Visplot may load but not display correctly on older browsers, or it may fail to load at all);

### Installation on Ubuntu 22.04

* Make sure your installation is up-to-date:

  ```
  sudo apt update && sudo apt upgrade
  ```

* Install Apache and PHP:

  ```
  sudo apt install apache2 php libapache2-mod-php
  ```

* Enable Apache and PHP (adapt the PHP version number if necessary):

  ```
  sudo systemctl enable apache2
  sudo a2enmod php8.1
  ```

* Restart the Apache server:
  ```
  sudo systemctl restart apache2
  ```

Test that the installation has been successful by navigating to `http://localhost/`.

If so, you can just copy the Visplot files to `/var/www/html/{SUBDIR}` and
access them via a browser at `http://localhost/{SUBDIR}`. If Visplot is the
only page that will run on your server, `{SUBDIR}` can and should be empty.

## License

Visplot is released under the GNU General Public License, version 3 (GPL3) license. See [LICENSE.md] for the full text of the license.
