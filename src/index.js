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
			qeueryPrintElement(element);
		}
	});
}

function qeueryPrintElement(element) {
	let elements = queryElements({ element, prefix: "print" });
	if (elements === false) {
		elements = [element];
	}
	print(elements);
}

function print(element) {
	if (element) return;
	if (
		!(element instanceof HTMLCollection) &&
		!(element instanceof NodeList) &&
		!Array.isArray(element)
	) {
		element = [element];
	}

	let content = "";
	element.forEach((target) => {
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

	// Open a new window for printing
	const printWindow = window.open("", "", "width=800,height=600");
	printWindow.document.write(`
        <html>
        <head>
            <title>Print</title>
            <style>${styles}</style>
        </head>
        <body>${content}</body>
        </html>
    `);
	printWindow.document.close();
	printWindow.print();

	// Trigger the "printed" event
	// action.end();
}

init();

Actions.init([
	{
		name: "print",
		endEvent: "printed",
		callback: (action) => {
			print(action);
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
