// Render the Resources page.

/* global escapeSpecialChars, createPagination, processResourcesDisplayResults, includesCaseInsensitive, filterResources, $ */

const pageSize = 10;
const params = new URLSearchParams(window.location.search);
let searchTerm = params.get("s") ? params.get("s").trim() : "";
let pageInQuery = params.get("page");

// Get selected tags to filter
let selectedTags = [];
let selectedTypes = [];

for (let p of params) {
	let queryKeyPrefix = p[0].substr(0, 2); // only need to check the first two characters
	let queryKeyWithoutPrefix = p[0].substr(2);

	if (queryKeyPrefix !== "s" && queryKeyPrefix !== "pa") { // if it's not the search term or page number...
		switch (queryKeyPrefix) {
		case "m_": // media type
			selectedTypes.push(queryKeyWithoutPrefix);
			break;
		case "t_": // tag
			selectedTags.push(queryKeyWithoutPrefix);
			break;
		}
	}
}

// The main search process
fetch(window.location.origin + "/resourceData.json").then(function (response) {
    response.json().then(function (resourcesData) {
		let results = resourcesData.resources,
			isInitialRender = true,
			pagination, tags, resourceTypes, resultsToDisplay;
		if (searchTerm || selectedTags.length > 0 || selectedTypes.length > 0) {
			// Perform search and filter
			isInitialRender = false;

			// Search
			if (searchTerm) {
				results = searchResources(results, searchTerm, resourcesData.tags);
			}

			// Filter by selected tags or media types
			let filterSettings = {
				selectedTags: selectedTags || [],
				selectedTypes: selectedTypes || []
			};

			results = filterResources(results, filterSettings);
		}

		// Convert some values to formats that can be displayed
		if (results.length > 0) {
			results = processResourcesDisplayResults(results);
		}

		// the "filter" call is to ignore empty query strings
		let filterQuery = [
			selectedTags.map(tag => "t_" + tag + "=on").join("&"),
			selectedTypes.map(type => "m_" + type + "=on").join("&")
		].filter(query => query).join("&");

		// Paginate search results
		if (results.length > pageSize) {
			pagination = createPagination(results, pageSize, pageInQuery, "/resources/?s=" + searchTerm + "&" + filterQuery + "&page=:page");
		}

		// selectedTags = resourcesData.tags.filter(tag => selectedTags.includes(tag.value));
		resultsToDisplay = pagination ? pagination.items : results;
		if (!isInitialRender) {
			// Display the number of search results
			document.querySelector(".search-result").innerHTML = `${results.length} of ${resourcesData.resources.length} resources matched`;

			// Display the search term in the search input field and the result status container
			if (searchTerm) {
				document.getElementsByName("s")[0].value = searchTerm;
				document.querySelector(".search-term").innerHTML = searchTerm;
				document.querySelector(".search-term-container").style.display = "block";
			}
			// add checked states for tags and media types
			console.log("selectedTags: ", selectedTags);
			console.log("selectedTypes: ", selectedTypes);
			renderCheckboxStats(document.querySelector('.filter-body[data-section="tags"]'), 't_', selectedTags);
			renderCheckboxStats(document.querySelector('.filter-body[data-section="mediatypes"]'), 'm_', selectedTypes);
		}
		renderResources(resultsToDisplay);
		if (pagination) {
			renderPagination(pagination);
		}
	});
});

/*
 * Show/hide the corresponding arrow up and down buttons based on the expand state
 * @param {DOM element} expandButtonElm - The DOM element of the expand button.
 * @param {String} expandButtonState - A value of "true" or "false".
 */
function setExpandSVGState(expandButtonElm, expandButtonState) {
	const arrowupSVG = $(expandButtonElm).find(".arrowup");
	arrowupSVG[expandButtonState === "false" ? "hide" : "show"]();
	const arrowdownSVG = $(expandButtonElm).find(".arrowdown");
	arrowdownSVG[expandButtonState === "true" ? "hide" : "show"]();
}

// Clicking the expand button on the filter header opens/closes the filter
const expandButtons = document.querySelectorAll(".filter .filter-expand-button");

for (let i = 0; i < expandButtons.length; i++) {
	// At the page load, show/hide arrow up and down buttons based on the aria-expand state of the expand button
	const initialExpandedValue = expandButtons[i].getAttribute("aria-expanded");
	setExpandSVGState(expandButtons[i], initialExpandedValue);

	// Add event listener for expand buttons
	expandButtons[i].addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		const currentExpandedValue = expandButtons[i].getAttribute("aria-expanded");
		const expandedState = currentExpandedValue === "true" ? "false" : "true";
		expandButtons[i].setAttribute("aria-expanded", expandedState);

		// Open/close the appropriate filter
		// Find the filter body by using its position relative to the button as well as the css selector
		// since there are two elements that match the selector (one each for static the and dynamic views).
		// Clicking on one of expand buttons only opens the form that this button corresponds to.
		const filterBodySelector = ".filter-body[data-section=\"" + expandButtons[i].dataset.section + "\"]";
		const filter = $(expandButtons[i]).parent().siblings(filterBodySelector);
		filter[expandedState === "false" ? "hide" : "show"]();

		// Show/hide the expand svg
		setExpandSVGState(expandButtons[i], expandedState);
	});
}

// clicking a filter header opens/closes the corresponding filter. It behaves the same as clicking the corresponding
// expand/collapse button.
const filterHeaders = document.querySelectorAll(".filter .filter-header");

for (let i = 0; i < filterHeaders.length; i++) {
	filterHeaders[i].addEventListener("click", () => {
		$(filterHeaders[i]).find(".filter-expand-button").click();
	});
}

// Clicking "reset filter" buttons redirects the page to the initial state without search term and filtering conditions
document.querySelector(".reset-button").addEventListener("click", () => {
	window.location = "/resources";
});
