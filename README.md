[![Latest version](https://img.shields.io/github/v/tag/egafton/visplot?sort=semver&label=latest%20version)](https://github.com/egafton/visplot/tags)
[![arXiv](https://img.shields.io/badge/arXiv-2604.14151-b31b1b.svg)](https://arxiv.org/abs/2604.14151)
[![ASCL](https://img.shields.io/badge/ascl-2607.020-blue.svg?colorB=262255)](https://ascl.net/2607.020)
[![Docs status](https://app.readthedocs.org/projects/visplot/badge/)](https://visplot.readthedocs.io/en/latest/index.html)
[![License](https://img.shields.io/github/license/egafton/visplot)](https://github.com/egafton/visplot/blob/master/LICENSE.md)

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

## User documentation

The public deployment of Visplot includes basic documentation on how to use the tool, accessible through the **Help** button.

For more detailed documentation, including descriptions of Visplot's features, configuration options, and usage, see the [Visplot documentation on Read the Docs](https://visplot.readthedocs.io/en/latest/).

## Attribution

If you use Visplot in your scientific work, please cite:

*E. Gafton, I. R. Losada*, **Visplot: A visibility plot and observation scheduling tool for astronomical observatories**, 2026, submitted to A&A, [arXiv:2604.14151](https://arxiv.org/abs/2604.14151), [ADS](https://ui.adsabs.harvard.edu/abs/2026arXiv260414151G/abstract).

## License

Visplot is released under the GNU General Public License, version 3 (GPL3) license. See [`LICENSE.md`](LICENSE.md) for the full text of the license.

