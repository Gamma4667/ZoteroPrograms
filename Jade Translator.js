{
	"translatorID": "517543bb-af11-4e6e-8e33-3adede73afa0",
	"label": "Jade - BarNet",
	"creator": "Rhys Cooper",
	"target": "^https?://(?:www\\d?\\.(jade\\.io)",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": false,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2023-04-27 12:00:00"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2023 Rhys Cooper
	
	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


// attr()/text() v2
function attr(docOrElem,selector,attr,index){var elem=index?docOrElem.querySelectorAll(selector).item(index):docOrElem.querySelector(selector);return elem?elem.getAttribute(attr):null;}function text(docOrElem,selector,index){var elem=index?docOrElem.querySelectorAll(selector).item(index):docOrElem.querySelector(selector);return elem?elem.textContent:null;}


function detectWeb(doc, url) {
    // Define an array of keywords to search for in the title
    const statuteKeywords = ["Act", "Regulation", "Regulations", "Rule", "Rules", "Code", "Constitution of"];

    // Check if any keyword is present in the title
    const hasKeyword = statuteKeywords.some((keyword) => text(doc, '.gwt-InlineLabel').includes(keyword) || text(doc, '.caption-2').includes(keyword));

    if (url.includes("/article/") && hasKeyword) {
        return "statute";
    }
    else if (url.includes("/article/")) {
        return "case";
    }
    return false;
}
	
function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('#page-main ul>li>a');
	for (let i=0; i<rows.length; i++) {
		let href = rows[i].href;
		let title = ZU.trimInternal(rows[i].textContent);
		if (!href || !title) continue;
		if (!href.includes('.html')) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}


function doWeb(doc, url) {
	var type = detectWeb(doc, url);
    if (detectWeb(doc, url) === "statute") {
        scrapeStatute(doc, url);
	} else {
        scrapeCase(doc, url);
    }
}

function scrapeStatute(doc, url) {
    const item = new Zotero.Item("statute");

    // Extract the statute information
    let title = text(doc, '.gwt-InlineLabel') || text(doc, '.caption-2');
    let dateEnactedMatch = title.match(/(\d{4})/);
    let codeMatch = title.match(/\((.+)\)/);

    // Set item properties
    item.nameOfAct = title.replace(/\s*\(\w+\)$/, "").replace(/\s*\d{4}\s*$/, "");
    item.dateEnacted = dateEnactedMatch ? dateEnactedMatch[0] : "";
    item.code = codeMatch ? codeMatch[1] : "";
    item.url = url;

    // Add a snapshot attachment
    item.attachments.push({
        title: "Snapshot",
        mimeType: "text/html",
        document: doc
    });
	
	// Extract the link to the original document
	var pdfLink = attr(doc, 'a.gwt-Hyperlink.alcina-NoHistory', 'href');

	
	// Save the original document into Zotero as an attachment.
	if (pdfLink) {
		var fileExtension = pdfLink.split('.').pop();
		var mimeType;

		switch (fileExtension) {
			case 'pdf':
				mimeType = 'application/pdf';
				break;
			case 'docx':
				mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
				break;
			case 'rtf':
				mimeType = 'application/rtf';
				break;
			default:
				mimeType = 'application/octet-stream';
		}

		item.attachments.push({
			title: "Full Text " + fileExtension.toUpperCase(),
			mimeType: mimeType,
			url: pdfLink,
			proxy: false
		});
	}

    // Add a note
    item.notes.push({note: title});

    item.complete();
}

function scrapeCase(doc, url) {
    // Detect the Zotero item type from the document and the url.
    var type = detectWeb(doc, url);

    // Create a new Zotero item with the detected type
    var item = new Zotero.Item(type);

    if (type == "statute") {
        // Extract statute information
        var statuteName = text(doc, '.gwt-InlineLabel') || text(doc, '.caption-2');

        // Set the item fields
        item.title = statuteName;
        item.url = url;
		item.attachments.push({
			title: "Full Text " + fileExtension.toUpperCase(),
			mimeType: mimeType,
			url: pdfLink,
			proxy: false
        });
	
			// Extract the link to the original document
		var pdfLink = attr(doc, 'a.gwt-Hyperlink.alcina-NoHistory', 'href');
			
			// Save the original document into Zotero as an attachment.
		if (pdfLink) {
			var fileExtension = pdfLink.split('.').pop();
			var mimeType;

			switch (fileExtension) {
				case 'pdf':
					mimeType = 'application/pdf';
					break;
				case 'docx':
					mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
					break;
				case 'rtf':
					mimeType = 'application/rtf';
					break;
				default:
					mimeType = 'application/octet-stream';
			}

			item.attachments.push({
				title: "Full Text " + fileExtension.toUpperCase(),
				mimeType: mimeType,
				url: pdfLink
			});
		}

        // Save the Zotero item
        item.complete();
    } else {
		// Full citation is extracted.
		var fullCitation = text(doc, 'title');
		
		// Irrelevant information is removed from the string.
		fullCitation = fullCitation.replace(' - BarNet Jade', '');
	
	    // Store all citations as a single note.
		var allCitationsNote = fullCitation;
	
	// Remove subsequent citations separated by a semi-colon.
    fullCitation = fullCitation.split(';')[0].trim();
	
		// Extract the name of the case (everything before the brackets containing a four-digit number).
	var pattern = /^(.+?)\s+(\[?\(?\d{4}\)?\]?)(.*?)$/;
	var matches = fullCitation.match(pattern);
		
		// Extract the information following the last set of brackets containing four-digits.
		if (matches) {
			var extractedCaseName = matches[1];
			var extractedDate = matches[2];
			var remainingText = matches[3];

	// Extract the court by removing any numbers and parentheses
	var court = remainingText.replace(/\d|\(|\)|\s+/g, '').trim();

	// Check if a long date is present and extract it
	var longDatePattern = /\((\d{1,2}\s+\w+\s+\d{4})\)/;
	var longDateMatches = remainingText.match(longDatePattern);
	if (longDateMatches) {
		extractedDate = longDateMatches[1];
	}

	// Extract numbers before and after the court
	var numbersPattern = /(\d+)\s+(.*?)\s+(\d+)/;
	var numbersMatches = remainingText.match(numbersPattern);

	if (numbersMatches) {
		var firstNumber = numbersMatches[1];
		var secondNumber = numbersMatches[3];

		// Check the type of brackets for the date
		if (extractedDate.startsWith('[')) {
			item.reporter = firstNumber;
			item.docketNumber = secondNumber;
		} else if (extractedDate.startsWith('(')) {
			item.reporterVolume = firstNumber;
			item.firstPage = secondNumber;
		}
	} else {
		// No numbers before the court, only after.
		var singleNumberPattern = /(\d+)/;
		var singleNumberMatches = remainingText.match(singleNumberPattern);

		if (singleNumberMatches) {
			var number = singleNumberMatches[1];

			// Check the type of brackets for the date.
			if (extractedDate.startsWith('[')) {
				item.docketNumber = number;
			} else if (extractedDate.startsWith('(')) {
				item.reporterVolume = court;
				item.reporter = number;
				court = ''; // Clear the court as it's not applicable in this case.
			}
		}
	}
}
	
        // Set the item fields
		item.caseName = extractedCaseName;
		item.dateDecided = extractedDate;
		item.court = court;

        item.attachments.push({
            title: "Snapshot",
            mimeType: "text/html",
            document: doc
        });

        // Extract the link to the original document
        var pdfLink = attr(doc, 'a.gwt-Hyperlink.alcina-NoHistory', 'href');

        // Save the original document into Zotero as an attachment.
        if (pdfLink) {
            var fileExtension = pdfLink.split('.').pop();
            var mimeType;

            switch (fileExtension) {
                case 'pdf':
                    mimeType = 'application/pdf';
                    break;
                case 'docx':
                    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    break;
                case 'rtf':
                    mimeType = 'application/rtf';
                    break;
                default:
                    mimeType = 'application/octet-stream';
            }

            item.attachments.push({
                title: "Full Text " + fileExtension.toUpperCase(),
                mimeType: mimeType,
                url: pdfLink
            });
        }

        item.notes.push({note: "Full citation: " + fullCitation}); // Save the full citation as a note

        // Save the Zotero item
        item.complete();
    }
}
	
	
////////////////////////////////////////////////////////////////////////////
	

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://jade.io/article/974225",
		"items": [
			{
				"itemType": "case",
				"caseName": "Davis v Minister for Immigration, Citizenship, Migrant Services and Multicultural Affairs",
				"creators": [],
				"dateDecided": "2023",
				"court": "HCA",
				"docketNumber": "10",
				"url": "https://jade.io/article/974225",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [{"note": "Davis v Minister for Immigration, Citizenship, Migrant Services and Multicultural Affairs [2023] HCA 10"}],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://jade.io/article/970625",
		"items": [
			{
				"itemType": "case",
				"caseName": "Trans Tasman Energy Group Pty Ltd v State of South Australia (No 2)",
				"creators": [],
				"dateDecided": "2023",
				"court": "SASC",
				"docketNumber": "9",
				"url": "https://jade.io/article/970625",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [{"note": "Trans Tasman Energy Group Pty Ltd v State of South Australia (No 2) [2023] SASC 9"}],
				"seeAlso": []
			}
		]
	},
		{
		"type": "web",
		"url": "https://jade.io/article/63967?at.hl=victoria+park+racing",
		"items": [
			{
				"itemType": "case",
				"caseName": "Victoria Park Racing and Recreation Grounds Co Ltd v Taylor [1937] HCA 45; 58 CLR 479",
				"creators": [],
				"dateDecided": "1937",
				"court": "HCA",
				"docketNumber": "45",
				"url": "https://jade.io/article/63967?at.hl=victoria+park+racing",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [{"note": "Victoria Park Racing and Recreation Grounds Co Ltd v Taylor [1937] HCA 45; 58 CLR 479"}],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://jade.io/article/216608",
		"items": [
			{
				"itemType": "statute",
				"nameOfAct": "Criminal Code Act",
				"creators": [],
				"code": "Cth",
				"dateEnacted": "1995",				
				"url": "https://jade.io/article/216608",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [{"note": "Criminal Code Act 1995 (Cth)"}],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://jade.io/article/636627?at.hl=Residential+Tenancies+regulations+vic&at.hlf=CITATION",
		"items": [
			{
				"itemType": "statute",
				"nameOfAct": "Residential Tenancies Regulations",
				"creators": [],
				"code": "Vic",
				"dateEnacted": "2019",
				"url": "https://jade.io/article/636627?at.hl=Residential+Tenancies+regulations+vic&at.hlf=CITATION",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [{"note": "Residential Tenancies Regulations 2019 (Vic)"}],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/