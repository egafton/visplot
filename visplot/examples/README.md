# Examples for Sending Observation Block (OB) Information to Visplot

This directory contains two example files that demonstrate how to send Observation Block (OB)
information to Visplot, in one of two ways:

   - via a POST request to the Visplot website (or to a local installation),
   - by setting PHP SESSION parameters for a local installation.

## Files

### 1. `post_request_example.html`
This file demonstrates how to send OB information to the Visplot website using a
POST request. It creates a form dynamically in JavaScript, populates it with OB data
in JSON format, and submits it to https://www.visplot.com/. This approach is useful
for pre-populating the target input box on the Visplot website with OB information.

#### Usage:
1. Open the file in a browser.
2. The script will automatically submit the OB data to the Visplot website,
   and will redirect you there.

#### Or try it out on the public website:
Go to https://www.visplot.com/examples/post_request_example.html

### 2. `session_example.php`
This file demonstrates how to set OB information as a session parameter for a local
installation of Visplot. The OB data is stored in the PHP session and the user is
redirected to the local Visplot installation.
In this example, it is assumed that you started Visplot in a container according
to the main README.md file, and that Visplot is running at http://localhost:8888.

#### Usage:
1. Ensure you have the local PHP server running at http://localhost:8888.
2. Access the file via the browser (http://localhost:8888/examples/session_example.php).
4. The OB data will be set in the session and you will be redirected to the
   Visplot main page, with the pre-populated target input box.

#### Or try it out on the public website:
Go to https://www.visplot.com/examples/session_example.php
