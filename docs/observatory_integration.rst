.. _observatory_integration:

******************************************
Observatory integration
******************************************

Advanced observatory interfaces for OB delivery
===============================================

This page describes how an observatory observing system can deliver Observing Block
(OB) information to Visplot. It is intended for integration engineers and telescope
operations staff who need to connect an external OB source to either the public
Visplot website or a local Visplot installation.

The examples below illustrate two different integration methods:

- sending OB information by POSTing it to the Visplot web interface,
- setting OB data in a PHP session for a local Visplot deployment.

These examples are intended as a starting point and are not part of the normal user tutorial flow.

Integration overview
--------------------

Visplot can receive OB data in a format that pre-populates the target input area and
starts the scheduling workflow. The two example mechanisms shown below are useful when an
observatory system already has a structured OB representation and wants to hand it off
to Visplot with minimal manual intervention.

For an external system, the typical flow is:

1. Generate the OB payload in the required JSON format.
2. Submit the payload to Visplot using a POST request.
3. Visplot opens with the OB targets preloaded in the target list.

For a local installation, the flow is:

1. Store the OB payload in the PHP session.
2. Redirect the user to the local Visplot page.
3. Visplot loads the session data and populates the target input automatically.

Integration examples
--------------------

`post_request_example.html`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This example shows how to send OB information to Visplot using a browser-based POST
request. It is suitable for observatory systems that can generate an HTML form or
submit equivalent request data.

.. code:: html

    <html>
        <body></body>
        <script type="text/javascript">
            const object = {
                Telescope: "NOT",
                Date: "20170920",
                nTargets: 2,
                Targets: {
                    target1: {
                        Name: "C3",
                        GroupID: "c3",
                        BlockID: "ob",
                        RA: "00:02:13.6",
                        Dec: "67:25:03.7",
                        Epoch: "2000.00",
                        PM: {
                            RA: "0.0",
                            Dec: "0.0"
                        },
                        ObsTime: "2194",
                        Instrument: "FIES",
                        Mode: "SPEC",
                        Imtype: "science",
                        Weather: "Thin Clouds",
                        Moon: "Any",
                        Moondist: "Any",
                        Seeing: "9.9",
                        Proposal: "54-901",
                        Constraint: "3.50",
                        Type: "Staff",
                        Priority: "1"
                    },
                    target2: {
                        Name: "PS1J0147+4630",
                        GroupID: "bessel_r_6",
                        BlockID: "3x30s",
                        RA: "01:47:10.1",
                        Dec: "46:30:43",
                        Epoch: "2000.00",
                        PM: {
                            RA: "0.00",
                            Dec: "0.00"
                        },
                        ObsTime: "404",
                        Instrument: "ALFOSC",
                        Mode: "IMA",
                        Imtype: "science",
                        Weather: "Thin Clouds",
                        Moon: "Any",
                        Moondist: "90",
                        Seeing: "1.0",
                        Proposal: "55-412",
                        Constraint: "2.00",
                        Type: "Fast-Track",
                        Priority: "2"
                    }
                }
            };
            const form = document.createElement("form");
            form.method = "POST";
            form.action = "https://www.visplot.com/";
            form.style.visibility = "hidden";
            const input = document.createElement("input");
            input.name = "obinfo";
            input.value = JSON.stringify(object);
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
        </script>
    </html>
    (END)


How it works
"""""""""""""""""

- Builds a form dynamically in JavaScript.
- Encodes the OB data in JSON and attaches it to the POST payload.
- Submits the form to the Visplot endpoint, which opens the page with the OB data loaded.

Usage
"""""""""""

1. Open the example file in a browser.
2. The script submits the OB payload to Visplot.
3. Visplot opens with the targets pre-populated in the input list.

Public demo
"""""""""""""""

Go to https://www.visplot.com/examples/post_request_example.html


`session_example.php`
^^^^^^^^^^^^^^^^^^^^^^

This example shows how to pass OB information through a PHP session to a local Visplot
installation. It is useful for local deployments where Visplot and the observatory
integration are hosted together.

.. code:: php

   <?php

    $object = array(
        "Telescope" => "NOT",
        "Date" => "20170316",
        "nTargets" => 8,
        "Targets" => array(
            "target1" => array(
                "Name" => "PKS_1510-089",
                "GroupID" => "20170323_1510_05",
                "BlockID" => "1510",
                "RA" => "15:12:50.00",
                "Dec" => "-09:05:59.00",
                "Epoch" => "2000.00",
                "PM" => array(
                    "RA" => "0.000",
                    "Dec" => "0.000"
                ),
                "ObsTime" => "431",
                "Instrument" => "ALFOSC",
                "Mode" => "IMAPOL",
                "Imtype" => "science",
                "Weather" => "Thin Clouds",
                "Moon" => "Any",
                "Moondist" => "Any",
                "Seeing" => "9.9",
                "Proposal" => "54-020",
                "Constraint" => "1.99",
                "Type" => "ToO"
            ),
            "target2" => array(
                "Name" => "PKS_1510-089",
                "GroupID" => "20170325_1510_06",
                "BlockID" => "1510",
                "RA" => "15:12:50.00",
                "Dec" => "-09:05:59.00",
                "Epoch" => "2000.00",
                "PM" => array(
                    "RA" => "0.000",
                    "Dec" => "0.000"
                ),
                "ObsTime" => "431",
                "Instrument" => "ALFOSC",
                "Mode" => "IMAPOL",
                "Imtype" => "science",
                "Weather" => "Thin Clouds",
                "Moon" => "Any",
                "Moondist" => "Any",
                "Seeing" => "9.9",
                "Proposal" => "54-020",
                "Constraint" => "1.99",
                "Type" => "ToO"
            ),
            [text clipped here]
        )
    );

    session_start();
    $_SESSION['obinfo'] = json_encode($object);
    $protocol = $_SERVER['PROTOCOL'] = isset($_SERVER['HTTPS']) && !empty($_SERVER['HTTPS']) ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    header("Location:${protocol}://${host}");



How it works
"""""""""""""""

- Stores the OB payload in the PHP session.
- Redirects the browser to the local Visplot URL.
- Visplot reads the session data and pre-populates the target list.

Usage
"""""""""""""""

1. Ensure your local Visplot installation is running at http://localhost:8888.8
2. Navigate to the PHP example in the browser (http://localhost:8888/examples/session_example.php)
3. The example sets the session data and redirects to Visplot.

Public demo
"""""""""""""

For the example deployment, visit  https://www.visplot.com/examples/session_example.php


Usage notes
-----------

- These integration examples are intended for observatory systems and are not required
  for normal user workflows.
- Use the POST request example for hosted or web-accessible Visplot instances.
- Use the PHP session example for local deployments with PHP support.

Related documentation
---------------------

- :doc:`custom_install` for local deployment instructions.
- :doc:`webinterface` for the user-facing behavior of Visplot.
- :doc:`tutorial` for the standard observer workflow.
