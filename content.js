async function replaceExampleWithIframe() {
  console.log("Running extension for Boop Extension");
  try {
    const response = await fetch(chrome.runtime.getURL("config.json"));
    const config = await response.json();

    const replacements = config.replacements;

    if (!replacements) {
      console.error("Config file missing or invalid.");
      return;
    }

    // Create a Set to track processed elements
    window.processedElements = new Set();

    // Process replacements for the current DOM
    processReplacements(replacements);

    // Set up an interval to check every 15 seconds
    setupIntervalCheck(replacements);
  } catch (error) {
    console.error("Error fetching or parsing config:", error);
  }
}

function processReplacements(replacements) {
  console.log(
    "Running replacement process at",
    new Date().toLocaleTimeString()
  );

  replacements.forEach((replacement) => {
    const target = replacement.target;
    const iframeUrl = replacement.iframeUrl;

    if (!target || !iframeUrl) {
      console.error("Invalid replacement entry:", replacement);
      return;
    }
    console.log("Processing", target, "with", iframeUrl);

    // First check if the target exists anywhere on the page
    const pageText = document.body.innerText;
    if (pageText.includes(target)) {
      console.log("Target text found in page:", target);
    } else {
      console.log("Target text NOT found in page:", target);
    }

    const textNodes = getTextNodes(document.body);
    console.log("Found", textNodes.length, "text nodes");

    let replacementsMade = 0;
    textNodes.forEach((node) => {
      // Skip if this node has already been processed
      if (window.processedElements.has(node)) {
        return;
      }

      console.log("Checking text node:", node.nodeValue);

      if (node.nodeValue.includes(target)) {
        console.log("Found target in text node:", node.nodeValue);
        const newNode = document.createElement("div");
        newNode.style.border = "0px"; // Make the container visible
        newNode.style.padding = "0px";
        newNode.style.margin = "0px";
        newNode.style.zIndex = "99999999999999";
        newNode.innerHTML = node.nodeValue.replace(
          new RegExp(target, "g"),
          `<iframe src="${iframeUrl}" style="width:100%; height:725px; border:0px solid blue;z-index:99999999999999;"></iframe>`
        );
        node.parentNode.replaceChild(newNode, node);
        replacementsMade++;
        console.log("Replacement made in text node");
      }

      // Mark this node as processed
      window.processedElements.add(node);
    });

    // Only check a, div, and span elements
    const targetElements = document.querySelectorAll("a, div, span");
    console.log(
      "Checking",
      targetElements.length,
      "target elements (a, div, span) for innerHTML matches"
    );

    targetElements.forEach((element) => {
      // Skip if this element has already been processed
      if (window.processedElements.has(element)) {
        return;
      }

      if (element.innerHTML.includes(target)) {
        console.log("Found target in element innerHTML:", element.tagName);

        element.innerHTML = element.innerHTML.replace(
          new RegExp(target, "g"),
          `<iframe src="${iframeUrl}" style="width:100%; height:725px; border:0px solid blue;z-index:99999999999999;"></iframe>`
        );
        replacementsMade++;
        console.log("Replacement made in element innerHTML");
      }

      // Mark this element as processed
      window.processedElements.add(element);
    });

    console.log("Total replacements made:", replacementsMade);

    // If no replacements were made, try a more aggressive approach
    if (replacementsMade === 0) {
      console.log("No replacements made, trying direct DOM manipulation");
      const bodyHTML = document.body.innerHTML;
      if (bodyHTML.includes(target)) {
        console.log("Target found in body HTML, attempting direct replacement");
        document.body.innerHTML = bodyHTML.replace(
          new RegExp(target, "g"),
          `<iframe src="${iframeUrl}" style="width:100%; height:725px; border:0px;z-index:99999999999999;"></iframe>`
        );
      }
    }
  });
}

function setupIntervalCheck(replacements) {
  // Run the replacement process immediately
  processReplacements(replacements);

  // Then set up an interval to run every 15 seconds (15000 milliseconds)
  const intervalId = setInterval(() => {
    processReplacements(replacements);
  }, 3000);

  console.log("Interval check set up to run every 15 seconds");

  // Store the interval ID in case we need to clear it later
  window.blocksExtensionIntervalId = intervalId;
}

function getTextNodes(node) {
  let all = [];
  for (node = node.firstChild; node; node = node.nextSibling) {
    if (node.nodeType == 3) {
      all.push(node);
    } else {
      all = all.concat(getTextNodes(node));
    }
  }
  return all;
}

// Make sure the function runs after the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", replaceExampleWithIframe);
} else {
  replaceExampleWithIframe();
}
