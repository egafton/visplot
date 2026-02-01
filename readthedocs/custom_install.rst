.. _custom_install:

*********************************
Custom installation of Visplot
*********************************

You can also run a local copy of the project in your machine. 

Prerequisites
==============

- `Docker <https://docs.docker.com/get-started/get-docker/>`__

- a modern browser with HTML5 support (Visplot may load but not display correctly on older browsers, or it may fail to load at all

Download the code
==================

You can clone directly the code from `Github <https://github.com/egafton/visplot>`__:

.. code:: bash

    git clone https://github.com/egafton/visplot.git

or, if you have your ssh keys configured with Github:

.. code:: bash

    git@github.com:egafton/visplot.git


Running the tool
=================

* Start the container:

    .. code:: bash

        docker compose up --build --detach visplot

* Navigate to `http://localhost:8888/` in your browser.
