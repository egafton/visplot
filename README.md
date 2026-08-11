[![Latest version](https://img.shields.io/github/v/tag/egafton/visplot?label=latest%20version)](https://github.com/egafton/visplot/releases/latest)
[![arXiv](https://img.shields.io/badge/arXiv-2604.14151-b31b1b.svg)](https://arxiv.org/abs/2604.14151)
[![ASCL](https://img.shields.io/badge/ascl-2607.020-blue.svg?colorB=262255)](https://ascl.net/2607.020)
[![Docs status](https://app.readthedocs.org/projects/visplot/badge/)](https://visplot.readthedocs.io/en/latest/index.html)
[![License](https://img.shields.io/github/license/egafton/visplot)](https://github.com/egafton/visplot/blob/main/LICENSE)

# Visplot
Visibility plot and observation scheduling tool for telescopes. It allows automatic, nearly-optimal scheduling of an entire observing night.

![Visplot](https://raw.githubusercontent.com/egafton/visplot/master/docs/figs/snapshot.png "Snapshot of Visplot")

## Using Visplot
The latest version of Visplot is hosted publicly at [https://www.visplot.com](https://www.visplot.com). You can use it without installing anything on your computer.

## Local installation
These instructions will get you a copy of the project up and running on your local machine (e.g., for development and testing purposes).

### Prerequisites

* Docker;
* a modern browser with HTML5 support (Visplot may load but not display correctly on older browsers, or it may fail to load at all);

### Starting the container

* ```bash
  docker compose up --build --detach visplot
  ```

Test that the installation has been successful by navigating to `http://localhost:8888/`.

## License

Visplot is released under the GNU General Public License, version 3 (GPL3) license. See [`LICENSE.md`](LICENSE.md) for the full text of the license.

