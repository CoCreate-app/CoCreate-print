/********************************************************************************
 * Copyright (C) 2020 CoCreate LLC and others.
 *
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import "@cocreate/element-prototype";
import { queryElements } from "@cocreate/utils";
import Actions from "@cocreate/actions";
import Observer from "@cocreate/observer";

const selector =
	"[print-selector], [print-closest], [print-parent], [print-next], [print-previous]";

function init(element) {
	if (!element) {
		element = document.querySelectorAll(selector);
		for (let i = 0; i < element.length; i++) {
			initElement(element[i]);
		}
	} else {
		if (
			!(element instanceof HTMLCollection) &&
			!(element instanceof NodeList) &&
			!Array.isArray(element)
		) {
			element = [element];
		}
		for (let i = 0; i < element.length; i++) {
			if (element[i].matches(selector)) {
				initElement(element[i]);
			}
		}
	}
}

function initElement(element) {
	// Add a click event listener to trigger the print action
	element.addEventListener("click", () => {
		let actions = element.getAttribute("actions");
		if (actions && !actions.includes("print")) {
			queryPrintElement(element);
		}
	});
}

function queryPrintElement(element) {
	let elements = queryElements({ element, prefix: "print" });
	if (elements === false) {
		elements = [element];
	}
	print(elements);
}

function print(elements) {
	if (!elements) return;
	if (
		!(elements instanceof HTMLCollection) &&
		!(elements instanceof NodeList) &&
		!Array.isArray(elements)
	) {
		elements = [elements];
	}

	let content = "";
	elements.forEach((target) => {
		content += target.outerHTML; // Combine all target elements' HTML
	});

	// Include CSS styles from the current window
	const styles = Array.from(document.styleSheets)
		.map((styleSheet) => {
			try {
				return Array.from(styleSheet.cssRules)
					.map((rule) => rule.cssText)
					.join("");
			} catch (e) {
				console.warn("Could not read stylesheet:", styleSheet.href);
				return ""; // Handle CORS issues
			}
		})
		.join("");

	// Create a hidden iframe for printing
	const iframe = document.createElement("iframe");
	iframe.style.position = "absolute";
	iframe.style.top = "-9999px";
	iframe.style.left = "-9999px";
	document.body.appendChild(iframe);

	// Write content to the iframe
	const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	iframeDoc.open();
	iframeDoc.write(`
        <html>
        <head>
            <title>Print</title>
            <style>${styles}</style>
        </head>
        <body>${content}</body>
        </html>
    `);
	iframeDoc.close();

	// Wait for iframe content to load before triggering print
	iframe.onload = () => {
		iframe.contentWindow.print();

		// Remove iframe after printing
		iframe.parentNode.removeChild(iframe);
	};

	document.dispatchEvent(
		new CustomEvent("printed", {
			detail: { content }
		})
	);
}

init();

Actions.init([
	{
		name: "print",
		endEvent: "printed",
		callback: (action) => {
			queryPrintElement(action.element);
		}
	}
]);

Observer.init({
	name: "CoCreatePrintAddedNodes",
	observe: ["addedNodes"],
	selector,
	callback(mutation) {
		initElement(mutation.target);
	}
});

Observer.init({
	name: "CoCreatePrintObserver",
	observe: ["attributes"],
	attributeName: [
		"print-selector",
		"print-closest",
		"print-parent",
		"print-next",
		"print-previous"
	],
	selector,
	callback: function (mutation) {
		initElement(mutation.target);
	}
});

export default { init, print };
