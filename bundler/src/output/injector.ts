export function injectBundledAssetsIntoHtml(
	sourceHtml: string,
	input: { jsFileName: string; cssFileNames: string[] },
): string {
	const cssMarkup = input.cssFileNames
		.map((cssFileName) => `  <link rel="stylesheet" href="${cssFileName}">`)
		.join("\n");
	const jsMarkup = `  <script src="${input.jsFileName}"></script>`;

	let html = sourceHtml;
	if (cssMarkup.length > 0) {
		html = replacePlaceholderOrInsertBeforeClosingTag(
			html,
			"<!-- bundler:css -->",
			"head",
			cssMarkup,
		);
	}

	html = replacePlaceholderOrInsertBeforeClosingTag(
		html,
		"<!-- bundler:js -->",
		"body",
		jsMarkup,
	);
	return html;
}

function replacePlaceholderOrInsertBeforeClosingTag(
	sourceHtml: string,
	placeholder: string,
	tagName: "head" | "body",
	markup: string,
): string {
	if (sourceHtml.includes(placeholder)) {
		return sourceHtml.replace(placeholder, markup);
	}

	const closingTagPattern = new RegExp(`</${tagName}>`, "i");
	const closingTagMatch = closingTagPattern.exec(sourceHtml);
	if (!closingTagMatch || closingTagMatch.index === undefined) {
		return `${sourceHtml}\n${markup}\n`;
	}

	return `${sourceHtml.slice(0, closingTagMatch.index)}${markup}\n${sourceHtml.slice(closingTagMatch.index)}`;
}
