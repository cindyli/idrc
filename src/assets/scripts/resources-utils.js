// Utility functions used by the Resources page.

/*
 * Escape special characters in a string by adding double slashes in front.
 * @param {String} data - The string to escape special characters within it.
 * @return The same string with special characters within it escaped.
 */
function escapeSpecialChars(data) {
	return data.replace(/[!@#$%^&*()+=\-[\]\\';,./{}|":<>?~_]/g, "\\$&");
}

/*
 * Search the data set with records that match the search term.
 *
 * This search comprises the following fields:
 * - title
 * - learnTags
 * - abstract
 * - summary
 * - type
 * - keywords
 *
 * @param {Array<Object>} dataSet - A set of Resource records upon which the search will be run
 * @param {String} searchTerm - The term for which to search
 * @param {Array<Object>} resourceTags - The set of all resource tags, including value and label
 *
 * @return A subset of the input `dataSet` that have matched term in any of the searched fields
 */
function searchResources(dataSet, searchTerm, resourceTags) {
	searchTerm = searchTerm.toLowerCase();
	return dataSet.filter((oneRecord) => {
		// TODO: see if the tag value/label mapping can be done in the init for vm.tags in resources-dynamic-handler.js
		const searchableContent = (oneRecord.title + " " +
			oneRecord.learnTags.map(learnTag => resourceTags.find(tag => tag.value === learnTag).label).join(" ") + " " +
			oneRecord.summary + " " +
			oneRecord.type + " " +
			oneRecord.keywords.join(" ") + " " +
			oneRecord.abstract).toLowerCase();
		return searchableContent.match(escapeSpecialChars(searchTerm));
	});
}

// /*
//  * Bind click handlers for topic cards. Clicking anywhere on the topic tile is treated the same as if
//  * the user had clicked on the checkbox itself.
//  *
//  * @param {String} viewSelector - The selector of the static or the dynamic view template
//  */
// function bindTopicCardClick(viewSelector)
// {
// 	const topicCards = document.querySelectorAll(viewSelector + " .topic-choices li");

// 	for (let i = 0; i < topicCards.length; i++) {
// 		topicCards[i].addEventListener("click", () => {
// 			$(topicCards[i]).find("input").click();
// 		});
// 	}
// }

// /*
//  * Bind change events for topic checkboxes. When a topic is checked or unchecked, reload the page immediately
//  * to show search results.
//  * @param {String} viewSelector - The selector of the static or the dynamic view template
//  */
// function bindTopicChange(viewSelector) {
// 	// Clicking filter choices updates the corresponding counter
// 	const topicCheckboxes = document.querySelectorAll(viewSelector + " .filter input[name^=c_]");

// 	for (let i = 0; i < topicCheckboxes.length; i++) {
// 		topicCheckboxes[i].addEventListener("change", (e) => {
// 			e.target.closest("form").submit();
// 		});
// 	}
// }

/*
 * Bind click handlers for filter section checkbox clear buttons.
 */
function bindClearFilterButtonClick()
{
	const clearFilterButtons = document.querySelectorAll(".filter .filter-clear button");

	for (let i = 0; i < clearFilterButtons.length; i++) {
		clearFilterButtons[i].addEventListener("click", (e) => {
			$(clearFilterButtons[i]).parent().siblings("ul").find(".filter-checkbox").prop("checked", false);

			// Submit the form to update the filter after all checkboxes are unselected
			e.target.closest("form").submit();
		});
	}
}

/*
 * Filter the data set for records that satisfy one or more of the following criteria,
 * - category (aka topic) in the selected categories
 * - media type in the selected media types
 * - at least one tag in the selected tags
 *
 * If multiple criteria are selected, the intersections of the result sets for each
 * criterion will be returned.
 *
 * @param {Array<Object>} resources - The data set that the filter is performed upon.
 * @param {Object} filterSettings - A collection of data and settings representing the filter selections
 * @param {Array<Object>} filterSettings.categories - The set of all categories (aka topics)
 * @param {Array<String>} filterSettings.selectedCategories - An array of category values to match.
 * @param {Array<String>} filterSettings.selectedTags - An array of tag values to match.
 * @param {Array<String>} filterSettings.selectedTypes - An array of media types to match.
 *
 * @return A subset of the input `dataSet` that satisfy the matching criteria outlined above
 */
function filterResources(resources, filterSettings) {
	let results = resources;

	if (filterSettings.selectedTags.length > 0) {
		results = results.filter(oneRecord => oneRecord.learnTags.some(tag => filterSettings.selectedTags.indexOf(tag) >= 0));
	}

	if (filterSettings.selectedTypes.length > 0) {
		results = results.filter(oneRecord => filterSettings.selectedTypes.includes(oneRecord.type));
	}

	return results;
}

/*
 * Chunk (split) the array into smaller arrays with the given chunk size at its most.
 * @param {Array<Anything>} inputArray - The input array to chunk.
 * @param {Number} chunkSize - The size of smaller arrays to chunk to.
 * @return An array of smaller arrays with the given chunk size at its most.
 */
function chunkArray(inputArray, chunkSize) {
	return Array(Math.ceil(inputArray.length / chunkSize)).fill().map((_, index) => index * chunkSize).map(begin => inputArray.slice(begin, begin + chunkSize));
}

/*
 * Create the pagination object for the input data set.
 * @param {Array<Object>} dataArray - The data set to create the pagination object for.
 * @param {Number} pageSize - The number of records on a page.
 * @param {Number} pageInQuery - The current page number.
 * @param {String} hrefTemplate - The href to redirect to when a page number is clicked.
 * @return Generate a pagination object in this data structure: https://www.11ty.dev/docs/pagination/#paging-an-array.
 */
function createPagination(dataArray, pageSize, pageInQuery, hrefTemplate) {
	const dataInChunk = chunkArray(dataArray, pageSize);
	pageInQuery = pageInQuery ? (parseInt(pageInQuery) > 1 ? parseInt(pageInQuery) : 1) : 1;
	let hrefs = [];
	for (let i = 0; i < dataInChunk.length; i++) {
		hrefs.push(hrefTemplate.replace(":page", i + 1));
	}

	// The pagination data structure follows the Eleventy pagination data structure to make it easier to integrate
	// pagination templates written in nunjucks and vue: https://www.11ty.dev/docs/pagination/#paging-an-array
	const pagination = {
		items: dataInChunk[pageInQuery - 1],
		pageNumber: pageInQuery - 1,
		hrefs: hrefs,
		href: {
			next: hrefs[pageInQuery] ? hrefs[pageInQuery] : null,
			previous: hrefs[pageInQuery - 2] ? hrefs[pageInQuery - 2] : null,
			first: hrefs[0],
			last: hrefs[hrefs.length - 1]
		},
		pages: dataInChunk,
		page: {
			next: dataInChunk[pageInQuery] ? dataInChunk[pageInQuery] : null,
			previous: dataInChunk[pageInQuery - 2] ? dataInChunk[pageInQuery - 2] : null,
			first: dataInChunk[0],
			last: dataInChunk[dataInChunk.length - 1]
		},
		hideProceedingPageButton: pageInQuery !== 2 && pageInQuery !== 3,
		hideFollowingPageButton: pageInQuery !== dataInChunk.length - 1 && pageInQuery !== dataInChunk.length - 2
	};
	return pagination;
}

/*
 * Set the given list of checkbox values to "checked" state.
 *
 * @param {Object} container - The container that has all checkbox elements
 * @param {String} checkboxPrefix - The prefix of the checkbox name
 * @param {Array} checkedValue - An array of the suffix of the checkbox name that are checked
 */
function renderCheckboxStats(container, checkboxPrefix, checkedValue) {
	checkedValue.forEach(value => {
		container.querySelector('input[type="checkbox"][name="' + checkboxPrefix + value + '"]').checked = true;
	});
}

/*
 * Performs a case-insensitive search to determine whether a string array includes
 * a certain value among its entries, returning true or false as appropriate.
 * If inputStringArray is not exclusively an array of strings or if searchString
 * isn't a string, then false is returned.
 *
 * @param {String[]} inputStringArray - an array of strings to search over
 * @param {String} searchString - a string to search the collection for
 */
function includesCaseInsensitive(inputStringArray, searchString) {
	if (typeof searchString !== "string" || inputStringArray.some(str => typeof str !== "string")) {
		return false; // TODO: consider throwing an exception instead
	} else {
		// normalize all string values by making them upper case
		inputStringArray = inputStringArray.map(str => str.toUpperCase());
		searchString = searchString.toUpperCase();

		return inputStringArray.includes(searchString);
	}
}

/*
 * Process each object in the data set to convert some field value to formats for display.
 * @param {Array<Object>} dataSet - The data set to process.
 * @return The same set of the data set with fields converted.
 */
function processResourcesDisplayResults(inArray) {
	return inArray.map((oneRecord) => {
		oneRecord.title = htmlDecode(oneRecord.title);
		oneRecord.dateTime = oneRecord.dateTime ? convertDate(oneRecord.dateTime): undefined;
		oneRecord.summary = stripHtmlTags(oneRecord.summary);
		return oneRecord;
	});
}

/*
 * Remove html tags from the input string.
 * @param {String} inputString - The string to remove html tags.
 * @return The string with html tags removed.
 */
// eslint-disable-next-line
stripHtmlTags = function (inputString) {
	return inputString.replace(/<\/?[^>]+(>|$)/g, "");
};

/*
 * Extract text from a html string.
 * @param {String} input - The string to extract text from.
 * @return The extracted text.
 */
function htmlDecode(input) {
	let el = document.createElement("div");
	el.innerHTML = input;
	return el.innerText;
}

/*
 * Render the resources result
 * @param {Array} resources - An array of resources to be rendered.
 * @return directly add the resources html to the content selector.
 */
function renderResources(resources) {
	let resourcesHtml = '';

	resources.forEach(resource => {
		resourcesHtml += `<a href="${resource.url}">
			<div class="tile-item">
			<div class="tile-resource">
				<h2 class="h3">${resource.title}</h2>
				<div class="info">
				<svg aria-hidden="true"><use xlink:href="#media-type" /></svg>
				Media Type: ${resource.type}
				</div>
		`;
		if (resource.readability) {
			resourcesHtml += `<div class="info">
			<svg aria-hidden="true"><use xlink:href="#readability" /></svg>
			<span class="resource-readability-title">Readability:&MediumSpace;</span>
			<ul class="resource-readability-list">
			`;

			resource.readability.forEach((readabilityLevel, i) => {
				resourcesHtml += `
				<li>${readabilityLevel}
				`;
				if (i < resource.readability.length - 1) {
					resourcesHtml += `<span>,&MediumSpace;</span>`
				}
				resourcesHtml += `</li>`;
			});

			resourcesHtml += `
			</ul>
			</div>
			`;
		}

		resourcesHtml += `
			<div class="info">
				<svg aria-hidden="true"><use xlink:href="#topics" /></svg>
				Topic: <span>${ resource.focus }</span>
			</div>
		</div>
		</div>
	</a>`;
	});

	document.querySelector('.content').innerHTML = resourcesHtml;
}

/*
 * Render the pagination.
 * @param {Object} pagination - A pagination object to be rendered.
* @return directly add the pagiination html to the pagination selector.
  */
function renderPagination(pagination) {
	let paginationHtml = `
	<h2 id="pagination" class="visually-hidden">resources page navigation</h2>
		<ul class="container">`;

	if (pagination.href.previous) {
		paginationHtml += `
			<li><a href="${ pagination.href.previous }"><svg><use xlink:href="#previous" /></svg><span class="visually-hidden">previous</span></a></li>`;
	}
	pagination.pages.forEach((page, pageNumber) => {
		paginationHtml += `
			<li><a href="${ pagination.hrefs[pageNumber] }"`;
		if (pagination.pageNumber === pageNumber) {
			paginationHtml += ` aria-current="page"`;
		}
		paginationHtml += `>${ pageNumber + 1 }</a></li>`;
	});
	if (pagination.href.next) {
		paginationHtml += `
			<li><a href="${ pagination.href.next }"><svg><use xlink:href="#next" /></svg><span class="visually-hidden">next</span></a></li>`;
	}
	paginationHtml += `
		</ul>`;
	document.querySelector('.pagination').innerHTML = paginationHtml;
}
