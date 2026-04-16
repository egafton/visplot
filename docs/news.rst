.. _news:

******************************************
Visplot Exciting News
******************************************

This page contains the latest updates, announcements, and assorted good news
from Visplot development. Check back here to see what is new, what is coming,
and what we have quietly fixed while no one was looking.

April 2026
==========


* Upcoming talk: Join us for a short online presentation about Visplot!

  On April 21 at 12:30 EST, I'll be giving a talk (in Spanish) as part of the RIA Tostes de Café series. For more details check out https://riastronomia.es/riatosdecafe/. Whether you're a seasoned observer or just curious about astronomical planning tools, this is a great chance to learn more about Visplot in a casual, coffee-fueled setting. ¡Nos vemos allí!

* Paper submitted to A&A!

  We've officially submitted our paper on Visplot to Astronomy & Astrophysics. 

  If you use Visplot in your work, please cite: 

  *E. Gafton, I. R. Losada*, **Visplot: A visibility plot and observation scheduling tool for astronomical observatories**, 2026, submitted to A\&A, `arXiv:2604.14151 <https://arxiv.org/abs/2604.14151>`__, `ADS <https://ui.adsabs.harvard.edu/abs/2026arXiv260414151G/abstract>`__
  
  The preprint is available on arXiv for those eager to dive in.

  We also found a nice description of the paper `here <https://gist.science/paper/2604.14151>`__.

* New scheduling algorithm unleashed!

  Visplot now includes a sophisticated new scheduling option: the flexible-placement beam search algorithm. This powerhouse is designed for those tricky observing nights with tightly constrained targets or overlapping visibility windows. While the original greedy heuristic remains the go-to for most scenarios, the beam search can find better solutions when things get complicated. It's like having a backup plan that actually works—because sometimes, the stars don't align (literally).

* Tutorial gets a glow-up!

  The Visplot tutorial has been thoroughly refreshed with more detailed explanations of scheduling algorithms, added humor to keep things engaging (because who says astronomy can't be fun?), and seamless cross-references to other documentation pages. We've also included tips on telescope-specific pages and a new "Wrapping up" section to send you off with clear skies and good observing vibes.

* Telescope collection expands!

  We've been busy adding more telescopes to the roster, pushing Visplot's support to over 100 facilities worldwide. From the latest additions to fine-tuning existing ones, the interactive map just keeps getting more useful. And for those with dedicated pages (like www.visplot.com/not), we've made it easier to find and reference them in the docs.

* Under-the-hood improvements:

  - Autosave feature: Never lose your work again—Visplot now automatically saves your session as you go.
  - SkyCam enhancements: Better handling of corrupt images and improved reliability for supported telescopes.
  - Manual reordering tweaks: Scheduling adjustments are now smoother and more intuitive.
  - Minor bug fixes and performance boosts: Because even the best tools can use a little polish.


March 2026
==========

* Visplot v5.1 released!

  A new version is out, bringing the flexible-placement beam search algorithm to the scheduling options. This advanced algorithm helps with complex, tightly-constrained observing nights where the greedy heuristic might struggle. Also included are UI tweaks like improved label positioning for zenith observations, better responsiveness, and enhanced manual reordering of schedules. Plus, more telescopes added to the ever-growing list—because the more, the merrier (or at least, the more options).

February 2026
==============

* New version of the web interface released!

  Visplot just got a fresh update, with support for many more telescopes and a
  brand-new interactive map to help you choose your observing location with a
  click (or two).

  Please note that not all telescopes come with the same level of detailed
  specifications. Facilities with unknown or incomplete constraints are now
  clearly marked with a vertical red banner stating:

    .. warning::

        "No telescope-specific altitude or collision limits are defined.

        Schedule may include unsafe pointings. Use with caution!"

  As always, we warmly welcome feedback from the community — it is what keeps
  Visplot growing in the right direction.


* New telescope available:

  The VLT has officially joined the Visplot family! After noticing that some
  users were already trying it out via the web interface, we decided to make it
  official and add full support. No more pretending it was an accident.

* New predefined targets available:

  * Blank fields:

    Until now, Visplot only included Northern Hemisphere blank fields as
    predefined targets that could be loaded instantly with a single click.
    We have now expanded this to include both Northern *and* Southern
    Hemisphere blank fields, because symmetry is beautiful.

  * Spectrophotometric standards:

    Since many users regularly rely on standard stars for calibration, we have
    added a curated list of predefined spectrophotometric standards. As with
    the blank fields, these are available for both Northern and Southern
    Hemispheres, so no one feels left out.


January 2026
=============

* The Visplot documentation page:

  A brand new documentation page for Visplot is now live:

  https://visplot.readthedocs.io/en/latest/index.html

  It includes an expanded tutorial, this very news section, and several other
  useful goodies. From now on, this is the official go-to place for all things
  Visplot — bookmarks encouraged.

* Visplot peer-reviewed paper:

  We are preparing a peer-reviewed paper describing the Visplot visibility and
  scheduling tool. Yes, Visplot is heading into the literature!

  If you have used (or are currently using) Visplot and would like to share
  your experience, we would greatly appreciate your input via the following
  Google form:

  https://forms.gle/TupYVh4LXVx78Fpu8

  All responses are valuable, whether you are a power user or just dipped a
  toe in. Your feedback helps document Visplot's role within the astronomical
  community.
