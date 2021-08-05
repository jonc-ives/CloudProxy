//A JSON object that contains the string translations retrieved according to the user's language setting.
var languageFile = {};
//A JSON object that contains the string translations for the default language file (assumed to be English).
var defaultLanguageFile = {};
// convert-readme.txt file with license informations
var convertReadmeFile = "";
//The number of asynchronous calls that have returned from a given batch of calls.
var returnedCalls = 0;
//The number of asynchronous calls that are expected to be made for a given batch of calls.
var expectedCalls = 0;
// Reload side after overlay dialog has been closed
var setReloadSide = false;
// detect safari browser
var browser = "other";
// detect Mac OS
var os = "other";

//The currently selected left navigation item.
var activeNav;
//A boolean indicating whether or not the user has made any changes to a page of configuration settings.
var changesMade = false;
//A boolean indicating whether or not the user has clicked an input field
var inputFieldClicked = false;
//The handler to be called if the user elects to save the changes he made.
var saveHandler;

//An object containing all the data for the Status page.
var statusData = {};
var statusDataOrig = {};
//The timer that automatically updates a page at a regular increment.
var updateTimer;
//The interval at which to run the update timer, in milliseconds.
var updateTimerInterval = 30000;
//Second interval at which to run the update timer for <updateTimerInterval1Count> times.
var updateTimerInterval1 = 2000;
var updateTimerInterval1Count = 0;
// The timer that is initiated after pressing the log in or register button to the myTwonky portal
var portalTimer;
//The interval at which to run the portal timer, in milliseconds. 
//This variable gets the values of portalTimerInterval 1, then 2 and 3.
var portalTimerInterval;
// Counts how many times the timer was called. The value 0 indicates that no timer is started.
var portalTimerIntervalCount = 0;
// First (initial) timer interval and how many times he is called
var portalTimerInterval1 = 40000;
var portalTimerInterval1Count = 1;
// Second timer interval and how many times he is called. The value must be different to 1 and 3.
var portalTimerInterval2 = 15000;
var portalTimerInterval2Count = 3;
// Third timer interval and how many times he is called. The value must be different to 1 and 2.
var portalTimerInterval3 = 30000;
var portalTimerInterval3Count = 5;
// timer which clear the background spinner after 5 seconds
var loadingGraficActiv;

var noMediaFusionServer = false;
var noWebDavServer = true;
var myTwonkyDisabled = false;

// 1: browse shared folder, 2: browse sync folder
var folderBrowseDialogMsg = 1;

//An object containing all the data for the Setup page.
var setup = {};
var setupOrig = {};
//The user's currently selected navigation type for the defaultview property.
var selectedNavType;
// true if the language was changed by the user
var setNewLanguage = false;
//An object containing all the data for the Sharing page.
var sharing = {};
var sharingOrig = {};
//update receiver list
var sharingReceiverChanged = false;
//update aggregation server list
var sharingAggServerChanged = false;
//An object containing all the data for the Aggregation page.
var aggregation = {};
var aggregationOrig = {};
//A list of aggregation servers the user has made modifications to. Tracked for optimization to avoid
//sending updates to TwonkyServer when data is saved except for servers the user has changed.
var changedServers = {};
//An object containing all the data for the Advanced page.
var advanced = {};
var advancedOrig = {};
//An object containing all the data for the Online Services page.
var onlineservices = {};
var onlineservicesOrig = {};
//A list of media receivers the user has made modifications to. Tracked for optimization to avoid
//sending updates to TwonkyServer when data is saved except for receivers the user has changed.
var changedReceivers = {};
//A list of agg server the user has made modifications to. Tracked for optimization to avoid
//sending updates to TwonkyServer when data is saved except for agg servers the user has changed.
var changedAggServer = {};


$(window).bind("hashchange", function(e){
    $("#leftNavContainer").show();
    $("#serverSettingsContentWrapper").show();
    $("#licenseInfoPage").hide();
    switch (e.fragment) {
        case "":
        case "status":
            checkChanges("loadStatus();");
            populateSettingsNav();
            break;
        case "setup":
            checkChanges("loadSetup();");
            populateSettingsNav();
            break;
        case "sharing":
            checkChanges("loadSharing();");
            populateSettingsNav();
            break;
        case "aggregation":
            checkChanges("loadAggregation();");
            populateSettingsNav();
            break;
        case "synchronization":
            checkChanges("loadSynchronization();");
            break;
        case "advanced":
            checkChanges("loadAdvanced();");
            populateSettingsNav();
            break;
        case "onlineservices":
            checkChanges("loadOnlineServices();");
            populateSettingsNav();
            break;
        case "video":
            checkChanges("loadMediaBrowse('video');");
            break;
        case "music":
            checkChanges("loadMediaBrowse('music');");
            break;
        case "photo":
            checkChanges("loadMediaBrowse('photo');");
            break;
        case "licenseinfo":
            checkChanges("showLicenseInfo();");
            break;
        default:
			loadMediaBrowseContent(e.fragment);
            break;
    }
});

function loadMediaBrowse(hash) {
	navigateToUrl("/webbrowse#"+hash);
}
function navigateToUrl(param){
   window.location.href = param;
}
function navigateTo(params){
	// change hash
   window.location.href = $.param.fragment(window.location.href, params, 2);
}

function browserIdentification() {
	browser = "other";
	// special treating for Safari
	if (navigator.userAgent.indexOf("Safari") != -1) browser = "Safari";
	if (navigator.userAgent.indexOf("KHTML") != -1) browser = "Safari";
}
function osIdentification() {
	os = navigator.platform;
	if (navigator.platform.indexOf("Mac") != -1) os = "Mac";
}

// show the license information page
function showLicenseInfo() {
	$("#leftNavContainer").hide();
	$("#serverSettingsContentWrapper").hide();
	$("#licenseInfoPage").show();
	$("#licenseInfoPage").html(getString("mpeglicense") + "<br /><br />" + getString("copyright") + "<br /><br /><br /><br />" + 
		convertReadmeFile + "<br /><br />" + 
		"<BR><BR>License information is provided here: <br /><br /> " + 
		"<a class='inlineLink' href='http://jquery.org/license/' >http://jquery.org/license/</a> (click on 'MIT License' link)<br /><br />" +
		"<a class='inlineLink' href='http://benalman.com/about/license/' >http://benalman.com/about/license/</a> <br />");
}

function getLanguageFile(){
	// read server language file
    $.ajax("/webconfig/strings-" + statusData["language"] + ".json", {
        "success": function(data){
            languageFile = parseJson(data);
        },
        "error": function(){
            $.ajax("/webconfig/strings-en.json", function(data){
                languageFile = parseJson(data);
            });
        }
    });
}
function getConvertReadmeFile(){
	makeGetRequest("/webconfig/convert-readme.txt", {}, function(data){
		convertReadmeFile = data;
		convertReadmeFile = convertReadmeFile.replace(/(\r\n)|(\r)|(\n)/g, "<BR>");
	});
}

//Get the value of a string given a key from the localized string translations.
//key: The key to retrieve a string for.
//getLong: Default false. If true, retrieve longValue from the translation object rather than value. longValue can be
//used to store longer text that shouldn't necessarily always be displayed.
function getString(key, getLong){
    if (languageFile[key]) {
        return (getLong) ? (languageFile[key].longValue) : (languageFile[key].value);
    } else {
		if (defaultLanguageFile[key]) {
			return (getLong) ? (defaultLanguageFile[key].longValue) : (defaultLanguageFile[key].value);
		} else {
			return "";
		}
	}
}

//Replace the contents of all elements in html that have a "string" attribute with the matching value from the
//translation file.
//html: The HTML to perform the replacement on. 
function replaceStrings(html){
    var stringElements = $("[string]", html);
    for (var i=0;i<stringElements.length;i++) {
		var elem = stringElements[i];
		var j_elem = $(elem);	// convert to jQuery object
		j_elem.html(getString(j_elem.attr("string")));
	}

    // Update the text of "button"s.
    $.each($("input[type=button]"), function(i, element) {
    	element = $(element);
        element.attr("value", getString(element.attr("string")));
    });
}


// show or hide the content of subheaders. 
// The layout of each page will be saved. If the user comes back to a page the layout has not changed. 
function showToggleButtons(html){
	if (!(document.cookie)) return;
    var buttonElements = $(".toggleButton", html);
    for (var i=0;i<buttonElements.length;i++) {
		var elem = buttonElements[i];
		var j_elem = $(elem);	// convert to jQuery object
		var parent = j_elem.parents(".boxHeader");
		var nextHeader = $(parent).next();
		var id = j_elem.attr("id");
        var c = document.cookie;
		var a = c.split(";");
		for (var j=0;j<a.length;j++) {
			var cookieID = a[j].substring(0,a[j].indexOf("="));
			var cookieValue = a[j].substring(a[j].indexOf("=")+1, a[j].length);
			if (cookieID.indexOf(id) >= 0) {
				if (cookieValue.indexOf("show") >= 0) { 
					nextHeader.show();
					if (nextHeader.hasClass("hideSubheaderBody")) nextHeader.removeClass("hideSubheaderBody");	// for I.E.
					$(".toggleText", j_elem).text(getString("hide"));
					j_elem.removeClass("hidden");
					j_elem.addClass("showing");
				}
			}
		}
    }
}

//Call a handler function for each element in html that has a "key" attribute to display data.
//html: The HTML to perform the replacement on.
//responseData: The data object to retrieve the data from.
//handler: The handler that should be called when an element with a "key" attribute is discovered. Handlers should
//have the function signature (element, key, data) where element is the affected element, key is the data's key,
//and data is the data collection object.
function replaceData(html, responseData, handler){
    var dataElements = $("[key]", html);
	for (var i=0;i<dataElements.length;i++) {
		var dataElement = dataElements[i];
		var value = "";
		var key = "";
		for (var j=0; j<dataElement.attributes.length; j++) {
			if (dataElement.attributes[j].name == "key") {
				key = dataElement.attributes[j].value;
				value = responseData[key];
			}
		}
		var j_elem = $(dataElement);	// convert to jQuery object
        if (handler) {
            handler(j_elem, key, value);
        }
        else {
            j_elem.html(value);
        }
	}
}

//Split data using a separator character and store the resulting array.
//responseData: The data to split.
//dataCollection: The data object in which to store the data.
//dataKey: The key used to store the data.
//dataSeparator: The separator character.
function parseData(responseData, dataCollection, dataCollectionOrig, dataKey, dataSeparator){
    var responsePieces = responseData.split(dataSeparator);
    var responsePiecesOrig = responseData.split(dataSeparator);
    dataCollection[dataKey] = responsePieces;
    dataCollectionOrig[dataKey] = responsePiecesOrig;
}

//Split a collection of data that is in name/value pair form (e.g. /rpc/get_all) and store it in a data object.
//The key becomes the first part of the split, and the value becomes the second (v=0 would be stored as {"v": 0}).
//responseData: The data to split.
//dataCollection: The data object in which to store the data. The data can be changed by the user.
//dataCollectionOrig: The data object in which to store the data. These data are not changed by the user.
//separatorChar: The character that separates the name/value pairs.
function parseSeparatedData(responseData, dataCollection, dataCollectionOrig, separatorChar){
    var responsePieces = responseData.split("\n");
    for (var i=0;i<responsePieces.length;i++) {
		var elem = responsePieces[i];
		if (separatorChar == "=") {		// split always once
			var j = elem.indexOf(separatorChar);
			if (j >= 0) { 
				var name = elem.substring(0,j);
				var value = elem.substring(j+1);
				var cleanedData = value.replace(/\r/g, "");
				dataCollection[name] = cleanedData;
				dataCollectionOrig[name] = cleanedData;
			}
		} else {
			var pieceArray = elem.split(separatorChar);
			if (pieceArray.length == 2) {
				var cleanedData = pieceArray[1].replace(/\r/g, "");
				dataCollection[pieceArray[0]] = cleanedData;
				dataCollectionOrig[pieceArray[0]] = cleanedData;
			}
			else {
				var responseData = new Array(pieceArray.length - 1);
				$.each(pieceArray, function(i, value){
					if (pieceArray[i + 1]) {
						var cleanedData = pieceArray[i + 1].replace(/\r/g, "");
						responseData[i] = cleanedData;
					}
				});
				dataCollection[pieceArray[0]] = responseData;
				dataCollectionOrig[pieceArray[0]] = responseData;
			}
		}
	}
}

//A generic wrapper for making AJAX GET requests.
//url: The url to make the request to.
//params: A collection of objects to be passed as querystring arguments. Use the format {"key": value}. For example,
//[{"uuid": 1234}, {"example": true}] will be passed as ?uuid=1234&example=true in the querystring.
//callback: The callback to be called after the request finishes.
//failureCallback: The callback to be called if the request fails to finish.
function makeGetRequest2(url, params, callback, failureCallback){
    var urlParams = "";
    var separatorChar = "?";
	for (var key in params) {
		if (!params.hasOwnProperty(key)) {
			continue;
		}
		urlParams += separatorChar + key + "=" + params[key];
		separatorChar = "&";
	}
    $.get(url + urlParams, function(response){
        if (callback) {
            callback(response);
        }
    }).error(function() {
        if (failureCallback) {
            failureCallback();
        }
	});
}

function makeGetRequest(url, params, callback){
    makeGetRequest2(url, params, callback, null);
}

//A generic wrapper for making AJAX POST requests.
//url: The url to make the request to.
//params: A collection of objects to be passed as querystring arguments. Use the format {"key": value}. For example,
//[{"uuid": 1234}, {"example": true}] will be passed as ?uuid=1234&example=true in the querystring.
//data: The data to be passed during the POST request.
//callback: The callback to be called after the request finishes.
function makePostRequest(url, params, data, callback){
    var urlParams = "";
    var separatorChar = "?";
	for (var key in params) {
		if (!params.hasOwnProperty(key)) {
			continue;
		}
		urlParams += separatorChar + key + "=" + params[key];
		separatorChar = "&";
	}
    $.post(url + urlParams, data, function(response){
        if (callback) {
            callback(response);
        }
    });
}

function showLoadingGraphic(){
    $(".serverSettingsContentWrapper").addClass("loading");
	if (loadingGraficActiv) window.clearInterval(loadingGraficActiv);
	loadingGraficActiv = window.setInterval("hideLoadingGraphic()", 8000);
}

function hideLoadingGraphic(){
	window.clearInterval(loadingGraficActiv);
	loadingGraficActiv = null;
	if ($(".serverSettingsContentWrapper").hasClass("loading"))
		$(".serverSettingsContentWrapper").removeClass("loading");
}

function onLanguageFetched(){
    replaceStrings($(document));
    $(window).trigger("hashchange");
}

function setVisitLinks() {
	var id1 = document.getElementById("visitLink1");
	var id2 = document.getElementById("visitLink2");
	var id3 = document.getElementById("visitLink3");
	var id4 = document.getElementById("visitLink4");
	var id11 = document.getElementById("legalLink1");
	// Twonky
	id1.innerHTML = "<a href='http://www.twonky.com' target='_blank' string='twonky.com'></a>";
	// Mobile Apps
	id2.innerHTML = "<a href='http://twonky.com/twonky-beam-info/' target='_blank' string='mobileApps'></a>";
	// Help center
	id3.innerHTML = "<a href='http://getsatisfaction.com/Twonky' target='_blank' string='helpCenter'></a>";
	// -
	id4.innerHTML = "";
	// Licensing Information
	id11.innerHTML = "<a href='' onclick='navigateTo(\"licenseinfo\"); return false;' string='licensinginfo'></a>";
	//id11.innerHTML = "<a href='http://www.pv.com/media_solution.html' target='_blank'>" + getString("licensinginfo") + "</a>";
}

//Initialize the Settings application by first reading the user's language setting, then loading the language file
//and calling loadStatus.
function initPage() {
	var url = window.location.href;
	if (top != self) {
		// page is in an iFrame; show no header and footer
		$("#headWrapper").hide();
		$("#footer").hide();
	}
	// identify browser and OS
	browserIdentification();
	osIdentification();
	// get the portal link
	makeGetRequest("/rpc/portal_page?login", {}, function(response){
		statusData["portallogin"] = response;
		onlineservices["portallogin"] = response;
	});
	statusData["privacypolicy"] = "http://twonky.com/legal/dataCollection";
	$(".toggleButton").live("click", function(obj){
		toggleContainer($(obj.currentTarget));
	});
	getConvertReadmeFile();
    // Get default language
    makeGetRequest("/webconfig/strings-en.json", {}, function(data){
        defaultLanguageFile = parseJson(data);
        languageFile = parseJson(data);
    });
    // Use "makeGetRequest2" so that the failure callback is invoked.
    makeGetRequest2("/rpc/get_all", {}, function(response){
        parseSeparatedData(response, statusData, statusDataOrig, "=");
        //Handle the version case separately. 
		//get_all, info_status and version return a "version" property. 
		//get_all.version is only set if the server comes with NMC
        statusData["fullversion"] = statusData.version;
	    makeGetRequest("/webconfig/strings-"+statusData["language"]+".json", {}, function(data2){
		    languageFile = parseJson(data2);
			statusData["privacypolicy"] = "http://twonky.com/legal/dataCollection?lang="+statusData["language"];
			onLanguageFetched();
		});
        var mediafusionServerUrl = statusData["mediafusionserverurl"];
        // Setting empty value to 'mediafusionserverurl' is used to indicate 
        // that the MediaFusion is disabled, and must not be shown on the config page.
        if (mediafusionServerUrl.length < 1) noMediaFusionServer = true;
		if (statusData["disablemytwonky"] == 1) myTwonkyDisabled = true;
		setVisitLinks();	// set links to myTwonky and twonky in footer
    },
    function() {
        // On failure ... invoke the onLanguageFetched() callback.
        onLanguageFetched();
    });
}

function onEventClick() {
	if (!(changesMade || inputFieldClicked)) {
		inputFieldClicked = true;
		// give "save"-button a new look
		$("#saveButton").addClass("confirm");
	}
}
function onEventChange(){
	if (!changesMade) {
		changesMade = true;
		// give "save"-button a new look
		if (!$("#saveButton").hasClass("confirm")) $("#saveButton").addClass("confirm");
	}
}
function resetChanged(){
	inputFieldClicked = false;
	changesMade = false;
	sharingReceiverChanged = false;
	sharingAggServerChanged = false;	
	// reset the look of the "save"-button
	if ($("#saveButton").hasClass("confirm")) $("#saveButton").removeClass("confirm");
}

//If the user has changed any inputs on the page, display a dialog to warn them and prompt them to save changes.
//Otherwise, navigate away.
//navFunctionStr: A string indicating the function that should be called when navigation is performed 
//(e.g. "loadStatus()").
function checkChanges(navFunctionStr){
    if (changesMade) {
        showDialogOverlay(function(){
            return getString("saveprompt");
        }, {}, {
            1: {
                text: getString("savechanges"),
                onclick: saveHandler + " " + "hideDialogOverlay(); " + navFunctionStr
            },
            2: {
                text: getString("discardchanges"),
                onclick: "changesMade = false; hideDialogOverlay(); " + navFunctionStr
            }
        });
    }
    else {
        eval(navFunctionStr);
    }
}

function populateSettingsNav(){
    if ($(".serverSettingsLeftNav").length == 0) {
        makeGetRequest("/webconfig/settings-nav.htm", {}, function(response){
            var responseHtml = $(response);
            replaceStrings(responseHtml);
            $("a", "#nav").removeClass("active");
            $(".serverSettingsContentWrapper").removeClass("contentDisplay");
            $("#leftNavContainer").html(responseHtml);
      			if (noWebDavServer) {
      				// remove nav-tree synchronization
      				$("#nav_synchronization").remove();
      			}
            if (noMediaFusionServer || myTwonkyDisabled) {
               // Remove the online services link
               $("#nav_onlineservices").remove();          
            }
        });
    }
}

//Clear the selection on the currently selected left navigation item and highlight the new one. Cancel the
//udpate timer if it exists.
//currentNav: The newly clicked navigation item.
function highlightNav(currentNav){
    if (activeNav) {
        activeNav.removeClass("current");
        if (updateTimer) {
			clearInterval(updateTimer);
            //clearTimeout(updateTimer);
        }
    }
    currentNav.addClass("current");
    activeNav = currentNav;
}
// accountingstatus:
//#define ACCOUNTING_TRIAL_VERSION                            1 "TwonkyServer"
//#define ACCOUNTING_REGISTERED_VERSION_TS_ONLY               2
//#define ACCOUNTING_REGISTERED_VERSION_TSTML                 3
//#define ACCOUNTING_REGISTERED_VERSION_TSTMF                 4
//#define ACCOUNTING_PORTAL_VERSION                           5 "TwonkyServer Free"
//#define ACCOUNTING_PREMIUM_VERSION                          6 "TwonkyServer Premium"
//#define ACCOUNTING_OEM_VERSION                              7
function getServerType(accStatus) {
	var str = "TwonkyServer";
	switch (accStatus) {
        case "2": str = "TwonkyServer";
				break;
        case "5": str = "TwonkyServer free";
				break;
        case "6": str = "TwonkyServer Premium";
				break;
	}
	return str;
}

// ------------------------
// status page
// ------------------------
//Load data for the Status page.
//isInitial: Default false. /rpc/get_all is called on application load, so set isInitial to true to avoid a duplicate 
//call.
function loadStatus(isInitial){
    returnedCalls = 0;
    expectedCalls = (isInitial) ? 4 : 6;
    saveHandler = "function(){};"
	inputFieldClicked = false;
    changesMade = false;
	
	showLoadingGraphic();
    if (!isInitial) {
        makeGetRequest("/rpc/get_all", {}, function(response){
            parseSeparatedData(response, statusData, statusDataOrig, "=");
			statusData["fullversion"] = statusData.version;		// info_status returns the property "version" too
            returnedCalls++;
            if (expectedCalls == returnedCalls) {
                loadStatusHtml();
				hideLoadingGraphic();
            }
        });
    }
    
    makeGetRequest("/rpc/info_status", {}, function(response){
        parseSeparatedData(response, statusData, statusDataOrig, "|");
		statusData["serverversion"] = statusData.version;		// get_all returns the property "version" too
		// statusData["servertype"] = getServerType(statusData["licensestatus"]);
		// statusData["servertypepart2"] = statusData["servertype"];
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadStatusHtml();
			hideLoadingGraphic();
        }
    });
	// function get_server_type restored - should be retired again. See also chapter advanced!
	makeGetRequest("/rpc/get_server_type", {}, function(response){
		statusData["servertype"] = response;
		statusData["servertypepart2"] = response;
		advanced["servertype"] = response;
		returnedCalls++;
		if (expectedCalls == returnedCalls) {
			loadStatusHtml();
			hideLoadingGraphic();
		}
	});

	makeGetRequest("/rpc/get_friendlyname", {}, function(response){
		statusData["friendlynamestring"] = response;
		returnedCalls++;
		if (expectedCalls == returnedCalls) {
			loadStatusHtml();
			hideLoadingGraphic();
		}
	});
    
	makeGetRequest("/rpc/info_nics", {}, function(response){
        parseData(response, statusData, statusDataOrig, "nics", "\n");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadStatusHtml();
			hideLoadingGraphic();
        }
    });
    
    makeGetRequest("/rpc/stream_active", {}, function(response){
        parseData(response, statusData, statusDataOrig, "streams", "SA:");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadStatusHtml();
			hideLoadingGraphic();
        }
    });
}

function handleStatusData(element, key, data){
    var returnValue = "";
    switch (key) {
        case "restartpending":
            returnValue = (data == 0) ? (getString("no")) : (getString("yes"));
            break;
        case "wmdrmstatus":
            returnValue = (data) ? (data.toUpperCase()) : ("");
            break;
        case "uptime":
            var days = data[0];
            var timePieces = data[1].split(":");
            returnValue = days + " " + getString("days") + ", " + timePieces[0] + " " + getString("hours") + ", " + timePieces[1] + " " + getString("minutes") + ", " + timePieces[2] + " " + getString("seconds");
            break;
		case "nics":
            if (data) {
				for (var i=0;i<data.length;i++) {
                    if (data[i].length > 0 && data[i].lastIndexOf("127.0.0.1") == -1) {
                        var nicPieces = data[i].split(",");
                        var mac = (nicPieces[1]) ? (nicPieces[1]) : ("")
                        returnValue += "<span class='nicIp'>" + nicPieces[0] + "</span>" + " " + mac + "<br />";
                    }
                }
            }
            break;
        case "cdkey":
			// show the license key
			// licensestatus 0=Trial, 2=OEM, -201..-207=error
			// licenseregistered 0=not registered, 1=registered
			if (statusData["licensestatus"] == "2") break;		// OEM-version: do not show the key
			// licenseregistered 0=server is not registered, 1=server is registered
			if (statusData["licenseregistered"] == "0") break;	// license is not registered
            if (data) {
				// show the license key under the header details
                returnValue = '<div class="serverStatusLabel floatL">' + getString("cdkey") + '</div><div class="floatL">' + data + '</div><div class="clear"></div>';
            }
            break;
        case "licensestatus":
			// enter the license key
			// licensestatus 0=Trial, 2=OEM, -201..-207=error
			// licenseregistered 0=not registered, 1=registered
			if (statusData["licenseregistered"] == "1") break;	// license is registered
            if (data >= 2) break;	// OEM
			//Remove the element's key to prevent it from being overwritten during the automatic update timer.
			element.attr("key", "nothing");
			returnValue += '<div class="boxHeader">\
			<span class="titleWrapper">\
				<span class="title">' + getString("licensekey") + '</span>\
			</span>\
			<div class="clear" />\
			</div>\
			<div><div>' +
			getString("licensekeycaption") +
			'</div><br />';
			if (os != "Mac") {
				// Windows, Linux: show 8 fields for license key
				for (var i = 0; i < 8; i++) {
					returnValue += '<input type="text" class="licenseKeyInput floatL" maxchars="4" onkeyup="onLicenseInputKeyUp(event, $(this))"></input>'
				}
			} else {
				// Mac: show one field for license key
				returnValue += '<input type="text" class="licenseKeyInputMac floatL" maxchars="39" onkeyup="onLicenseInputKeyUpMac(event)"></input>'
			}
			
			returnValue += '<a class="actionbtn floatL" onclick="saveLicenseKey()" onmousedown="onButtonMouseDown(this)" onmouseup="onButtonMouseUp(this)">\
					<span class="actionbtn_l"></span>\
					<span class="actionbtn_c">' + getString("enter") + '</span>\
					<span class="actionbtn_r"></span>\
				</a>\
				<div class="clear"></div>'
			
			// licensestatus 0=Trial OR -201..-207=error
			if (data >= 0) {
				returnValue += "<div class='error'>" + statusData["licensedays"] + " " + getString("daysremaining") + "</div>";
			} else {
				// show the text of the errorcode (license-201, license-203, ...)
				returnValue += "<div class='error'>" + getString("license" + data) + "</div>";
			}
			returnValue += '</div><div class="serverContentSpacer"></div>';
            break;
        case "streams":
            returnValue = (data[1] > 0) ? (getString("activestreams")) : (getString("noactivestreams"));
			var indexdb = statusData["dbupdate"].indexOf("[");
			if (indexdb > 1) {
				// database update in progress
				returnValue = returnValue + "<br>" + getString("rescancontent") + " - " + statusData["dbupdate"].substring(0,indexdb-1);
			}
            break;
        case "servertype":
			// show the server type and version
			// free: Twonky 7.1 (servertype, fullversion)
			// premium: TwonkyServer Premium 7.1  (servertype, fullversion)
			// standard: Twonky Server 7.2 (servertype, fullversion)
            var serverType = data.toLowerCase();
            if (serverType.lastIndexOf("premium") > -1) {
				returnValue = getString("twonkyserver");		// only temporarily, 2013-01-16
                //returnValue = getString("premiumserver");
            }
            else 
                if (serverType.lastIndexOf("free") > -1) {
                    returnValue = getString("freeserver");
                }
                else {
                    returnValue = getString("twonkyserver");
                }
            break;
        case "servertypepart2":
			// currently not used
			return "";
            break;
        default:
            returnValue = data;
            break;
    }
    element.html(returnValue);
}

function onLicenseInput(input){
	inputFieldClicked = true;
    if (input.val().match(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$/)) {
        var keyPieces = input.val().split("-");
        var inputs = $(".licenseKeyInput");
        $.each(inputs, function(i, element){
            $(element).val(keyPieces[i]);
        });
    }
    else {
        if (input.val().length > input.attr("maxchars")) {
            input.val(input.val().substring(0, input.attr("maxchars")));
        }
        if (input.val().length == input.attr("maxchars")) {
            input.next().focus();
        }
    }
}

function onLicenseInputKeyUp(event, input){
    if (event.which == 13) {
        saveLicenseKey();
		return;
    }
    if ((event.which < 48) || (event.which > 122)) return;
	onLicenseInput(input);
}
function onLicenseInputKeyUpMac(event){
    if (event.which == 13) {
        saveLicenseKey();
    }
}

function saveLicenseKey(){
    var key = "";
    resetChanged();
	if (os != "Mac") {
		var inputs = $(".licenseKeyInput");
		$.each(inputs, function(i, element){
			key += $(element).val();
			if (i != inputs.length - 1) {
				key += "-";
			}
		});
	} else key = $(".licenseKeyInputMac")[0].value;
    var data = "cdkey=" + key + "\n";
    makeGetRequest("/rpc/set_option?"+data, {}, function(response) {});
    //location.reload();
	var timerKey = setTimeout("reloadSide()",30);
}
function reloadSide() {
    location.reload();
}

function loadStatusHtml(){
    makeGetRequest("/webconfig/status.htm", {}, function(response){
        var responseHtml = $(response);
        replaceStrings(responseHtml);
        replaceData(responseHtml, statusData, handleStatusData);       
  		showToggleButtons(responseHtml);
        $(".serverSettingsContentWrapper").html(responseHtml);
  	    $("#statusSyncUrl").hide();
        highlightNav($("#nav_status"));
  		hideLoadingGraphic();
  		updateTimer = setInterval(updateStatus, updateTimerInterval);
		});
}

function updateStatus(){
	if (inputFieldClicked) return;	// don't update page if changes are made (during enter the license key)
    returnedCalls = 0;
    expectedCalls = 3;
	showLoadingGraphic();
	
    makeGetRequest("/rpc/info_status", {}, function(response){
        parseSeparatedData(response, statusData, statusDataOrig, "|");
		statusData["serverversion"] = statusData.version;		// get_all returns the property "version" too
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            replaceData($(".serverSettingsContentWrapper"), statusData, handleStatusData);
			hideLoadingGraphic();
        }
    });
    
    makeGetRequest("/rpc/get_all", {}, function(response){
        parseSeparatedData(response, statusData, statusDataOrig, "=");
		statusData["fullversion"] = statusData.version;		// info_status returns the property "version" too
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            replaceData($(".serverSettingsContentWrapper"), statusData, handleStatusData);
			hideLoadingGraphic();
        }
    });
    
    makeGetRequest("/rpc/stream_active", {}, function(response){
        parseData(response, statusData, statusDataOrig, "streams", "SA:");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadStatusHtml();
			hideLoadingGraphic();
        }
    });
}


// ------------------------
// setup page
// ------------------------
function loadSetup(){
    returnedCalls = 0;
    expectedCalls = 2;
    saveHandler = "submitSetupData();"
	inputFieldClicked = false;
    changesMade = false;

	showLoadingGraphic();
    
    makeGetRequest("/rpc/get_all", {}, function(response){
        parseSeparatedData(response, setup, setupOrig, "=");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadSetupHtml();
			hideLoadingGraphic();
        }
    });
    
    makeGetRequest("/rpc/view_names", {}, function(response){
        parseData(response, setup, setupOrig, "viewnames", ",");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadSetupHtml();
			hideLoadingGraphic();
        }
    });
}

function loadSetupHtml(){
    makeGetRequest("/webconfig/setup.htm", {}, function(response){
        var responseHtml = $(response);
        replaceStrings(responseHtml);
        replaceData(responseHtml, setup, handleSetupData);
		showToggleButtons(responseHtml);
        
        $(".serverSettingsContentWrapper").html(responseHtml);
        $("input", "#setupContainer").live("click", onEventClick);
        $("input,select", "#setupContainer").live("change", onEventChange);
        highlightNav($("#nav_setup"));
    });
}

function handleSetupData(element, key, data){
    switch (key) {
        case "friendlyname":
            element.val(data);
            break;
        case "language":
            var matchingLanguage = $("[value=" + data + "]", element);
            matchingLanguage.attr("selected", "yes");
            break;
        case "viewnames":
            html = "";
			for (var i=0;i<data.length;i++) {
                var selected = "";
                if (setup["defaultview"] == data[i]) {
                    selected = "checked";
                    selectedNavType = data[i];
                }
                html += '<div class="radioControlWrapper">\
        			<input style="float: left" name="viewname" id="' + data[i] + '" ' + selected + ' type="radio" onclick="setNavType(\'' + data[i] + '\')" />\
        				<div class="radioControlTextWrapper">\
            				<div class="radioHeader">\
                				' +
                getString(data[i]) +
                '\
            				</div>\
            				<div class="smallFont">\
                				' +
                getString(data[i] + "caption") +
                '\
            				</div>\
        				</div>\
        			<div class="clear">\
        			</div>\
    			</div>';
            }
            element.html(html);
            break;
    }
}

function setNavType(navType){
    selectedNavType = navType;
}

function submitSetupData(){
	if (!changesMade) return;
    returnedCalls = 0;
    expectedCalls = 1;
	setNewLanguage = false;
    hideActionButtons();
    resetChanged();
	
	var data = "";
	var fname = $("#servername").val();
	if (setupOrig["friendlyname"] != fname) {
		data += "friendlyname=" + fname + "\n";
		setup["friendlyname"] = fname;
		setupOrig["friendlyname"] = fname;
	}
	var newLanguage = $("#language").val();
	if (newLanguage != null && setupOrig["language"] != newLanguage) {
		data += "language=" + newLanguage + "\n";
		setup["language"] = newLanguage;
		setupOrig["language"] = newLanguage;
		setNewLanguage = true;
	}	
	if (setupOrig["defaultview"] != selectedNavType) {
		data += "defaultview=" + selectedNavType + "\n";
		setup["defaultview"] = selectedNavType;
		setupOrig["defaultview"] = selectedNavType;
	}
	
	if (data == "") {
		returnedCalls++;
		finishSaving();
	} else {
		makePostRequest("/rpc/set_all", {}, data, function(){
			returnedCalls++;
			if (setNewLanguage) {
				setWebDavLanguage($("#language").val());	// set also the WebDav server language
				setReloadSide = true;
			}
			finishSaving();
		});
	}
}

function setWebDavLanguage(lang) {
	var request = loadXMLDoc("/set_language?lang="+lang,"");
}

// ------------------------
// sharing page
// ------------------------
function loadSharing(){
    returnedCalls = 0;
    expectedCalls = 4;
    saveHandler = "submitSharingData();"
	inputFieldClicked = false;
    changesMade = false;

	showLoadingGraphic();
    
    makeGetRequest("/rpc/get_all", {}, function(response){
        parseSeparatedData(response, sharing, sharingOrig, "=");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadSharingHtml();
			hideLoadingGraphic();
        }
    });

    makeGetRequest("/rpc/info_clients", {}, function(response){
        parseData(response, sharing, sharingOrig, "clients", "\n");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadSharingHtml();
			hideLoadingGraphic();
        }
    });
    
    makeGetRequest("/rpc/info_connected_clients", {}, function(response){
        parseData(response, sharing, sharingOrig, "mediareceivers", "##########\n");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadSharingHtml();
			hideLoadingGraphic();
        }
    });

    makeGetRequest("/rpc/view_names", {}, function(response){
        parseData(response, sharing, sharingOrig, "viewnames", ",");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadSharingHtml();
			hideLoadingGraphic();
        }
    });
}

function loadSharingHtml(){
    makeGetRequest("/webconfig/sharing.htm", {}, function(response){
        var responseHtml = $(response);
        replaceStrings(responseHtml);
        replaceData(responseHtml, sharing, handleSharingData);
		showToggleButtons(responseHtml);
        
        $(".serverSettingsContentWrapper").html(responseHtml);
        $("input", "#sharingContainer").live("click", onEventClick);
        $("input,select", "#sharingContainer").live("change", onEventChange);
        highlightNav($("#nav_sharing"));
		updateSharing();
        updateTimer = setInterval(updateSharing, updateTimerInterval);
    });
}

function updateSharing(){
    makeGetRequest("/rpc/info_connected_clients", {}, function(response){
        parseData(response, sharing, sharingOrig, "mediareceivers", "##########\n");
        updateMediaReceivers($("[key=mediareceivers]"), sharing.mediareceivers)
    });
}

function splitContentDirs(data){
    var delimiter = ",[-\\+\\*][AMVPDamvpd]\\|";
    var contentDirs = new Array();
    var index;
    while ((index = data.search(delimiter)) != -1) {
        contentDirs.push(data.substring(0, index));
        data = data.substring(index + 1);
    }
    contentDirs.push(data);
    return contentDirs;
}

function handleSharingData(element, key, data){
    switch (key) {
        case "rmautoshare":
            if (sharing["platform"] == "WIN32") {
                element.show();
                if (data > 0) {
                    $("input[type=checkbox]", element).attr("checked", "true");
                }
            }
            break;
        case "contentdir":
			folderBrowseDialogMsg = 1;
			updateSharedFolderList(element, data);
            break;
		case "v":
        case "clientautoenable":
            element.attr("checked", data > 0)
            break;
        case "mediareceivers":
            updateMediaReceivers(element, data);
            break;
    }
}

//A utility function used during dynamic HTML generation to determine whether a dropdown option should be selected.
//mediaKey: The value of the input in question.
//compareKey: The string to compare to.
function checkSelectedMediaOption(mediaKey, compareKey){
    return (mediaKey == compareKey) ? ("selected") : ("");
}

function checkShareBox(checkbox){
    if (checkbox.is(":checked")) {
        var shareBox = $(".sharedCheckbox", checkbox.parent());
        shareBox.attr("checked", true);
    }
}

function uncheckAggregationBox(checkbox){
    if (!checkbox.is(":checked")) {
        var aggregationBox = $(".aggregationCheckbox", checkbox.parent());
        aggregationBox.attr("checked", false);
    }
}

//Display a dialog that allows the user to browse folders on his local machine. This can't be a browser control
//because browsers only allow file selection, not folder browsing.
//rowNumber: The number of the selected folder browse row. Used to track which input the user is working with.
function showFolderBrowse(rowNumber){
    showDialogOverlay(createFolderBrowseDialog, {
        onstart: makeGetRequest("/rpc/dir", {
            "path": ""
        }, function(response){
            populateDirs(response, "", "");
        })
    }, {
        1: {
            text: getString("select"),
            onclick: "selectDir('" + rowNumber + "')"
        },
        2: {
            text: getString("cancel"),
            onclick: "hideDialogOverlay()"
        }
    }, "folderBrowse");
}

//Hide the folder selection dialog and populate an input with the user's selected directory.
//rowNumber: The number of the selected folder browse row. Used to track which input the user is working with. 
function selectDir(rowNumber){
    if ($("#dirPathDisplay").html()) {
		var div = document.getElementById('divSelectDir');
		div.innerHTML = $("#dirPathDisplay").html();
        $("#pathInput" + rowNumber).val(div.firstChild.nodeValue);
		onEventChange();
        hideDialogOverlay();
    }
}

function createFolderBrowseDialog(){
	if (folderBrowseDialogMsg == 1) 
		return '<div>\
				<div class="boxHeader">\
					<span class="titleWrapper">\
						<span class="title">' + getString("selectfolder") + '</span>\
					</span>\
					<div class="clear" />\
				</div>\
				<div id="dirPathDisplay" class="dirPathDisplay"></div>\
				<div id="dirDisplayContainer"></div>\
			</div>';
	else 
		return '<div>\
				<div class="boxHeader">\
					<span class="titleWrapper">\
						<span class="title">' + getString("selectsyncfolder") + '</span>\
					</span>\
					<div class="clear" />\
				</div>\
				<div id="dirPathDisplay" class="dirPathDisplay"></div>\
				<div id="dirDisplayContainer"></div>\
			</div>';
}

//The maximum height of the directory display area before it begins scrolling, in pixels.
function getWindowHeight() {
	var windowHeight = 50;
	 if (typeof( window.innerWidth ) == 'number' ) {
		//Non-IE
		windowHeight = window.innerHeight;
	  } else if (document.documentElement && document.documentElement.clientHeight) {
		//IE 6+ in 'standards compliant mode'
		windowHeight = document.documentElement.clientHeight;
	  } else if (document.body && document.body.clientHeight) {
		//IE 4 compatible
		windowHeight = document.body.clientHeight;
	  }		
	  return windowHeight;
}

function replaceSpecialChars(stringIn) {
    var str1 = stringIn.replace(/&amp;/g, "&");
	str1 = str1.replace(/&/g, "&amp;");
	return str1;
}

//Generate HTML to display the list of directories, along with a breadcrumb and a link for the parent directory.
//response: The data containing the directory list.
//rootPath: The path of the previous directory.
//rootId: The id of the previous directory.
function populateDirs(responseIn, rootPathIn, rootId){
    ($("#dirDisplayContainer")).removeClass("scroll");
	$("#dirDisplayContainer").css("height", "auto"); 
    var html = "";
    var response = replaceSpecialChars(responseIn);
    var rootPath = replaceSpecialChars(rootPathIn);
    var responsePieces = response.split("\n");
    var platformSpecificSeparator = responsePieces[0];
    var dirDisplay = $("#dirPathDisplay");
    dirDisplay.attr("dirid", rootId);
    dirDisplay.html(rootPath);
    if (dirDisplay.attr("dirid") && rootPath && rootId) {
		var lastSlash = rootPath.lastIndexOf(platformSpecificSeparator);
        var lastPipe = rootId.lastIndexOf("|");
        //If rootPath matches the format of a file path (e.g. C:\), parentPath is everything from the start of the string
        //to the last \, beyond which is the id of the current directory.
        var parentPath = (rootPath.match(/^[A-Z]:\\$/)) ? ("") : (rootPath.substring(0, lastSlash));
        //If parentPath is now only a drive designation (e.g. C:), add the \ back on.
        if (parentPath.match(/^[A-Z]:$/)) {
            parentPath += "\\";
        }
        var parentId = rootId.substring(0, lastPipe);
        html += '<div class="parentDirRow" onclick="getDirs(\'' + escape(parentPath) + '\', \'' + parentId + '\', \'' + platformSpecificSeparator.replace(/\\/g, "\\\\") + '\')"><span class="parentDirIcon"></span><span>' + getString("parentdir") + '</span></div>';
    }
    else {
        html += '<div class="parentDirRow"></div>';
    }
    $.each(responsePieces, function(i, value){
        if (value.length > 1) {

	    // directory/file id is 3+ digits long
	    var ii = 3;
	    while ((value.charAt(ii) != "D" && value.charAt(ii) != "F") && ii < value.length) {
		ii = ii + 1;
	    }
			
	    var dirId = value.substring(0, ii);
            var fullId = dirId;
            if (rootId) {
                fullId = rootId + "|" + dirId;
            }

            var dirKey = value.charAt(ii);
            var dirPath = value.substring(ii + 1);
            var fullPath = dirPath;

            if (rootPath) {
                var separatorChar = (rootPath.lastIndexOf(platformSpecificSeparator) != rootPath.length - 1) ? (platformSpecificSeparator) : ("");
                fullPath = rootPath + separatorChar + dirPath;
            }
            if (dirKey == "D") {
                html += '<div class="dirRow" onclick="getDirs(\'' + escape(fullPath) + '\', \'' + fullId + '\', \'' + platformSpecificSeparator.replace(/\\/g, "\\\\") + '\')"><span class="dirIcon"></span><span>' + dirPath + '</span></div>';
	    }
        }
    });
    $("#dirDisplayContainer").html(html);
    //If the container is too tall, add the scroll class to it to prevent it from taking up too much real estate.
	var wHeight = getWindowHeight();
	var dirDisplayMaxHeight = wHeight - Math.round(wHeight/2) - $("#dirPathDisplay").outerHeight() - $("#dialogButtonContainer").outerHeight();
    if (parseInt($("#dirDisplayContainer").css("height")) > dirDisplayMaxHeight) {
        ($("#dirDisplayContainer")).addClass("scroll");
		if (dirDisplayMaxHeight < 150) dirDisplayMaxHeight = 150;
		$(".scroll").css("height", dirDisplayMaxHeight); 
    }
    else {
        ($("#dirDisplayContainer")).removeClass("scroll");
    }
}

//Get the directories under a given directory id.
//dirPath: The path of the previous directory to be used for breadcrumb navigation.
//dirId: The id to use for the new dirs call.
function getDirs(dirPathIn, dirId, platformSpecificSeparator){
	var dirPath = unescape(dirPathIn);
    var passId = dirId.replace(/\|/g, platformSpecificSeparator)
    makeGetRequest("/rpc/dir", {
        "path": passId
    }, function(response){
        populateDirs(response, dirPath, dirId);
    });
}

//Create a new shared folder row for directory browsing. Do this only if the user hasn't chosen a directory for the last
//existing row to avoid duplicate blank rows getting stacked up.
function createNewSharedFolderRow(){
    if ($(".pathInput:last", "#share_folders_container").val()) {
        var sharingRows = $(".sharingRowWrapper", "#share_folders_container");
        //Unbind the change listener, since only the last row should be listening to add a fresh row when a value is set.
        sharingRows.unbind("change");
        var i = sharingRows.length;
        var html = getNewSharedFolderRowHtml(i+1);
        $("#share_folders_container").append(html);
    }
}

//Get the HTML for a shared folder row.
//i: The row number. Use this to uniquely identify the row.
function getNewSharedFolderRowHtml(i){
	folderBrowseDialogMsg = 1;
    return '<div class="sharingRowWrapper">\
		<input class="sharedCheckbox floatL" onclick="uncheckAggregationBox($(this))" type="checkbox" checked="true"/><input id="pathInput' + i + '" class="longInput pathInput floatL" type="text" onchange="createNewSharedFolderRow()" value=""/>\
		<select class="contentTypeDropdown floatL">\
			<option value="A">'+getString("allcontenttypes")+'</option>\
			<option value="M">'+getString("music")+'</option>\
			<option value="P">'+getString("photos")+'</option>\
			<option value="V">'+getString("videos")+'</option>\
			<option value="m">'+getString("photos")+' & '+getString("videos")+'</option>\
			<option value="p">'+getString("music")+' & '+getString("videos")+'</option>\
			<option value="v">'+getString("music")+' & '+getString("photos")+'</option>\
		</select>\
		<a class="actionbtn floatL" onclick="showFolderBrowse(' +
    i +
    ')" onmousedown="onButtonMouseDown(this)" onmouseup="onButtonMouseUp(this)"><span class="actionbtn_l"></span><span class="actionbtn_c">' +
    getString("browse") +
    '</span><span class="actionbtn_r"></span></a>\
			<input id="aggCheckbox' +
    i +
    '" class="aggregationCheckbox floatL" onclick="checkShareBox($(this))" type="checkbox" checked="true"/>' +
    '<label for="aggCheckbox' +
    i +
    '">' +
    getString("shareforagg") +
    '</label>\
		<div class="clear">\
		</div>\
	</div>';
}


// update the receiver list and the aggregation server list
function updateMediaReceivers(element, data){
	// if user has made changes, do not update the receiver and aggregation server list 
	if (sharingReceiverChanged || sharingAggServerChanged) return;
	var elementa = $("[key=aggservers]");
    if (!data) {
        element.hide();
        elementa.hide();
		return;
    }
	if (data[data.length-1].length == 0) data.pop();	//delete last element if emty
	// count the number of receivers and aggregation server
	var mrec = 0; 
	var aggs = 0;
	for (var key in data) {
		var p = data[key].split("\n");
		if (p[4] == 0) mrec ++;				// p[4] = 0 -> receiver; p[4] = 1 -> aggregation server
		else aggs ++;
	}
	// media receivers list
	var html = "";
	// set header if there are receivers
	if (mrec > 0) {
		html = '<tr>\
			<th>\
			</th>\
			<th>\
				<span>' + getString("mac") + '</span>\
			</th>\
			<th>\
				<span>' +
		getString("ip") +
		'</span>\
			</th>\
			<th>\
				<span>' +
		getString("friendlyname") +
		'</span>\
			</th>\
			<th>\
				<span>' +
		getString("receivertype") +
		'</span>\
			</th>\
			<th>\
				<span>' +
		getString("navtype") +
		'</span>\
			</th>\
		</tr>';
	}
	// aggregation server list
	var htmla = "";
	// set header if there are aggregation server
	if (aggs > 0) {
		htmla = '<tr>\
			<th>\
			</th>\
			<th>\
				<span>' + getString("mac") + '</span>\
			</th>\
			<th>\
				<span>' +
		getString("ip") +
		'</span>\
			</th>\
			<th>\
				<span>' +
		getString("friendlyname") +
		'</span>\
			</th>\
			<th>\
			</th>\
		</tr>';
	}
	$.each(data, function(i, value){
		var receiverPieces = value.split("\n");
		var receiver = {};
		receiver["receiverKey"] = receiverPieces[0];
		receiver["id"] = receiverPieces[1];
		receiver["mac"] = receiverPieces[2];
		receiver["ip"] = receiverPieces[3];
		receiver["isAggregation"] = receiverPieces[4];
		receiver["enabled"] = receiverPieces[5];
		receiver["clientName"] = receiverPieces[6];
		receiver["icon"] = receiverPieces[7];
		receiver["iconMimeType"] = receiverPieces[8];
		receiver["viewName"] = receiverPieces[9];
		receiver["hasDefaultView"] = receiverPieces[10];
		receiver["friendlyname"] = receiverPieces[11];
		var checked = (receiver.enabled == 1) ? ("checked") : ("");
		if (receiver.isAggregation == 0) {
			html += '<tr id="receiverRow' + i + '">\
		<td>\
			<input onchange="receiverChanged(' +
			i +
			')" type="checkbox" ' +
			checked +
			'/>\
		</td>\
		<td>\
			<input class="macInput" type="text" value="' +
			receiver.mac +
			'" disabled="true" style="cursor:default" />\
		</td>\
		<td>\
			<input class="ipInput" type="text" value="' +
			receiver.ip +
			'" disabled="true" style="cursor:default" />\
		</td>\
		<td>\
			<input class="fnameInput" type="text" value="' +
			receiver.friendlyname +
			'" disabled="true" title="' + receiver.friendlyname + '" alt="' + receiver.friendlyname + '" style="cursor:default" />\
		</td>\
		<td>' +
			getReceiverClientDropdown(receiver.clientName, i, true) +
			'</td>\
		<td>' +
			getReceiverViewDropdown(receiver.viewName, receiver.hasDefaultView == 1, i) +
			'</td>\
		<td>\
			<input class="receiverKey" type="hidden" value="' +
			receiver.receiverKey +
			'" />\
		</td>\
	</tr>';
		} else {
			htmla += '<tr id="aggServerRow' + i + '">\
		<td>\
			<input onchange="aggServerChanged(' +
			i +
			')" type="checkbox" ' +
			checked +
			'/>\
		</td>\
		<td>\
			<input class="macInput" type="text" value="' +
			receiver.mac +
			'" disabled="true" style="cursor:default" />\
		</td>\
		<td>\
			<input class="ipInput" type="text" value="' +
			receiver.ip +
			'" disabled="true" style="cursor:default" />\
		</td>\
		<td>\
			<input class="fnameInputLong" type="text" value="' +
			receiver.friendlyname +
			'" disabled="true" title="' + receiver.friendlyname + '" alt="' + receiver.friendlyname + '" style="cursor:default" />\
		</td>\
		<td>' +
			getReceiverClientDropdown(receiver.clientName, i, false) +
			'</td>\
		<td>\
			<input class="receiverKey" type="hidden" value="' +
			receiver.receiverKey +
			'" />\
		</td>\
	</tr>';
		}
	});
	element.html("");
	element.show();
	element.append(html);
	elementa.html("");
	elementa.show();
	elementa.append(htmla);
}
function updateSharedFolderList(element, data){
	// shared folder list
	element.html("");
	var html = "";
	var dirPairs = splitContentDirs(data);
	var html = "";
	if ((dirPairs.length == 1) && (dirPairs[0] == "")) {
		element.append(getNewSharedFolderRowHtml(dirPairs.length));
		return;
	}
	// list the content dirs
	$.each(dirPairs, function(i, value){
		var dirPieces = value.split("|");
		var dirPath = dirPieces[1];
		var dirKeys = dirPieces[0];
		var enabledKey = dirKeys.substring(0, 1);
		var mediaKey = dirKeys.substring(1, 2);
		var shared = (enabledKey == "+" || enabledKey == "*") ? ("checked") : ("");
		var enabledForAgg = (enabledKey == "*") ? ("checked") : ("");
		html += '<div class="sharingRowWrapper">\
			<input class="sharedCheckbox floatL" onclick="uncheckAggregationBox($(this))" type="checkbox" ' + shared + '/><input id="pathInput' + i + '" class="longInput pathInput floatL" type="text" value="' + dirPath + '"/>\
			<select class="contentTypeDropdown floatL">\
				<option value="A" ' +
		checkSelectedMediaOption(mediaKey, "A") +
		'>'+getString("allcontenttypes")+'</option>\
				<option value="M" ' +
		checkSelectedMediaOption(mediaKey, "M") +
		'>'+getString("music")+'</option>\
				<option value="P" ' +
		checkSelectedMediaOption(mediaKey, "P") +
		'>'+getString("photos")+'</option>\
				<option value="V" ' +
		checkSelectedMediaOption(mediaKey, "V") +
		'>'+getString("videos")+'</option>\
				<option value="m" ' +
		checkSelectedMediaOption(mediaKey, "m") +
		'>'+getString("photos")+' & '+getString("videos")+'</option>\
				<option value="p" ' +
		checkSelectedMediaOption(mediaKey, "p") +
		'>'+getString("music")+' & '+getString("videos")+'</option>\
				<option value="v" ' +
		checkSelectedMediaOption(mediaKey, "v") +
		'>'+getString("music")+' & '+getString("photos")+'</option>\
			</select>\
			<a class="actionbtn floatL" onclick="showFolderBrowse(' +
		i +
		')" onmousedown="onButtonMouseDown(this)" onmouseup="onButtonMouseUp(this)"><span class="actionbtn_l"></span><span class="actionbtn_c">' +
		getString("browse") +
		'</span><span class="actionbtn_r"></span></a>\
				<input id="aggCheckbox' +
		i +
		'" class="aggregationCheckbox floatL" onclick="checkShareBox($(this))" type="checkbox" ' +
		enabledForAgg +
		'/>' +
		'<label for="aggCheckbox' +
		i +
		'">' +
		getString("shareforagg") +
		'</label>\
			<div class="clear">\
			</div>\
		</div>';
	});
	element.html(html);
//	element.append(getNewSharedFolderRowHtml(dirPairs.length + 1));
}

function submitSharingData(){
	if (!changesMade) return;
	var args = submitSharingData.arguments.length;
    returnedCalls = 0;
	expectedCalls = 1;
    $.each(changedReceivers, function(key, receiverRow){
		expectedCalls++;
    });
    $.each(changedAggServer, function(key, aggServerRow){
		expectedCalls++;
    });
	showLoadingGraphic();
    hideActionButtons();
    resetChanged();

    var shareFoldersList = $(".sharingRowWrapper", $("#share_folders_container"));
	var emptyPath = false;
	var contentDirKey = "contentdir=";
    var contentDir = "contentdir=";
    $.each(shareFoldersList, function(i, value){
        var dirInput = $(".pathInput", value);
        var dirPath = dirInput.val();
        if (dirPath) {
            var sharedCheckbox = $(".sharedCheckbox", value);
            var aggregationCheckbox = $(".aggregationCheckbox", value);
            var enabledKey;
            if (sharedCheckbox.is(":checked") && aggregationCheckbox.is(":checked")) {
                enabledKey = "*";
            }
            else 
                if (sharedCheckbox.is(":checked")) {
                    enabledKey = "+";
                }
                else {
                    enabledKey = "-";
                }
            var mediaKey = $(".contentTypeDropdown", value).val();
            contentDir += enabledKey + mediaKey + "|" + dirPath + ",";
        }
		else emptyPath = true;
    });
	if (contentDir.length > contentDirKey.length) contentDir = contentDir.substring(0, contentDir.length - 1);
	var data = "";
	data += contentDir + "\n";
	var autoshareCheckbox = $("#autoshareCheckbox", $(".serverSettingsContentWrapper"));
	var autoshareCheckboxValue = ((autoshareCheckbox.is(":checked")) ? (1) : (0));
	if (sharingOrig["rmautoshare"] != autoshareCheckboxValue) {
		data += "rmautoshare=" + autoshareCheckboxValue + "\n";
		sharing["rmautoshare"] = autoshareCheckboxValue;
		sharingOrig["rmautoshare"] = autoshareCheckboxValue;
	}
    var clientautoenable = (($("input[key=clientautoenable]").attr("checked") == true) ? ("1") : ("0"));
	if (sharingOrig["clientautoenable"] != clientautoenable) {
		data += "clientautoenable=" + clientautoenable + "\n";
		sharing["clientautoenable"] = clientautoenable;
		sharingOrig["clientautoenable"] = clientautoenable;
	}
    makePostRequest("/rpc/set_all", {}, data, function(){
        returnedCalls++;
		if (expectedCalls == returnedCalls) finishSavingSharingData(args, emptyPath, contentDir.substring(contentDirKey.length, contentDir.length));
    });

    //Only submit client_change requests for receivers that have been changed.
    $.each(changedReceivers, function(key, receiverRow){
        var receiverKey = $(".receiverKey", receiverRow).val();
        var enabled = ($("input[type=checkbox]", receiverRow).attr("checked")) ? ("1") : ("0");
        var clientId = $("select[name=clientType]", receiverRow).val();
        var viewName = $("select[name=viewName]", receiverRow).val();
        var mac = $(".macInput", receiverRow).val();
        makeGetRequest("/rpc/client_change", {
			"key": receiverKey,
            "mac": mac,
            "id": clientId,
            "enabled": enabled,
            "view": viewName
        }, function(){
            returnedCalls++;
			if (expectedCalls == returnedCalls) finishSavingSharingData(args, emptyPath, contentDir.substring(contentDirKey.length, contentDir.length));
        });
    });

    //Only submit client_change requests for agg servers that have been changed.
    $.each(changedAggServer, function(key, aggServerRow){
        var receiverKey = $(".receiverKey", aggServerRow).val();
        var enabled = ($("input[type=checkbox]", aggServerRow).attr("checked")) ? ("1") : ("0");
        var clientId = $("select[name=clientType]", aggServerRow).val();
        var mac = $(".macInput", aggServerRow).val();
        makeGetRequest("/rpc/client_change", {
			"key": receiverKey,
            "mac": mac,
            "id": clientId,
            "enabled": enabled
        }, function(){
            returnedCalls++;
			if (expectedCalls == returnedCalls) finishSavingSharingData(args, emptyPath, contentDir.substring(contentDirKey.length, contentDir.length));
        });
    });
}
function finishSavingSharingData(args, emptyPath, contentDir){
	finishSaving();
	hideLoadingGraphic();
	if ((args > 0) && emptyPath) {
		updateSharedFolderList($("[key=contentdir]"), contentDir)
	}
}


// ------------------------
// aggregation page
// ------------------------
function loadAggregation(){
    returnedCalls = 0;
    expectedCalls = 2;
    saveHandler = "submitAggregationData();"
	inputFieldClicked = false;
    changesMade = false;

	showLoadingGraphic();
    
    makeGetRequest("/rpc/get_all", {}, function(response){
        parseSeparatedData(response, aggregation, aggregationOrig, "=");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadAggregationHtml();
			hideLoadingGraphic();
        }
    });
 
    //The listaggregatedservers call will fail if aggregation is disabled. If data is returned, handle it as normal.
    //Otherwise, make sure the aggregated servers collection is empty and load the HTML.
    $.ajax("/rpc/listaggregatedservers", {
        success: function(response){
            parseData(response, aggregation, aggregationOrig, "aggregatedservers", "----------");
            returnedCalls++;
            if (expectedCalls == returnedCalls) {
                loadAggregationHtml();
				hideLoadingGraphic();
            }
        },
        error: function(){
            aggregation["aggregatedservers"] = null;
            returnedCalls++;
            if (expectedCalls == returnedCalls) {
                loadAggregationHtml();
				hideLoadingGraphic();
            }
        }
    });
}

function loadAggregationHtml(){
    makeGetRequest("/webconfig/aggregation.htm", {}, function(response){
        var responseHtml = $(response);
        replaceStrings(responseHtml);
        replaceData(responseHtml, aggregation, handleAggregationData);
		showToggleButtons(responseHtml);
        
        $(".serverSettingsContentWrapper").html(responseHtml);
        //Show or hide the aggregation server container based on whether or not aggregation is enabled.
        toggleAvailableServers(aggregation["aggregation"] == 1);
        $("input,select", "#aggregationContainer").live("change", onEventChange);
        highlightNav($("#nav_aggregation"));
        updateTimer = setInterval(updateAggregation, updateTimerInterval);
    });
}

function updateAggregation(){
    //Only call to get an updated list of servers if no changes have been made.  This avoids
    //   updating HTML while a user is making changes.
    if(!changesMade) {
       $.ajax("/rpc/listaggregatedservers", {
           success: function(response){
               parseData(response, aggregation, aggregationOrig, "aggregatedservers", "----------");
               updateAggregatedServers($("[key=aggregatedservers]"), aggregation.aggregatedservers);
           },
           error: function(){
               aggregation["aggregatedservers"] = null;
           }
       });
    }
}

function handleAggregationData(element, key, data){
    switch (key) {
        case "aggregation":
            if (data == 1) {
                element.attr("checked", true);
            }
            break;
        case "aggmode":
            var matchingInput = $("input[type=radio][name=aggregationMode][value=" + data + "]", element);
            matchingInput.attr("checked", true);
            break;
        case "aggregatedservers":
            updateAggregatedServers(element, data);
            break;
    }
}

function updateAggregatedServers(element, data){
    if (data) {
        var serverHtml = "";
        //Pop the last element of the collection off, since it's an empty piece of data.
        data.pop();
        $.each(data, function(i, value){
            var serverDataPieces = value.split("<br>");
            var serverData = {};
            $.each(serverDataPieces, function(i, value){
                var dataKey = value.substring(0, 1);
                var dataValue = value.substring(2, value.length).replace(/\n/g, "");
                serverData[dataKey] = dataValue;
            });
            var musicChecked = "";
            var photosChecked = "";
            var videosChecked = "";
            switch (serverData["F"]) {
                case "A":
                    musicChecked = "checked";
                    photosChecked = "checked";
                    videosChecked = "checked";
                    break;
                case "M":
                    musicChecked = "checked";
                    break;
                case "P":
                    photosChecked = "checked";
                    break;
                case "V":
                    videosChecked = "checked";
                    break;
                case "m":
                    photosChecked = "checked";
                    videosChecked = "checked";
                    break;
                case "p":
                    musicChecked = "checked";
                    videosChecked = "checked";
                    break;
                case "v":
                    musicChecked = "checked";
                    photosChecked = "checked";
                    break;
            }
            serverHtml += '<div uuid="' + serverData["S"] + '" class="availableServerContainer">' +
            serverData["N"] +
            '<div>\
            <span class="serverMediaLabel"><input onclick="onServerChanged(\'' +
            serverData["S"] +
            '\')" name="videos" type="checkbox"' +
            videosChecked +
            '/>' +
            getString("videos") +
            ' ' +
            '</span><span class="serverMediaLabel"><input onclick="onServerChanged(\'' +
			serverData["S"] +
            '\')" name="songs" type="checkbox"' +
            musicChecked +
            '/>' +
            getString("songs") +
            ' ' +
            '</span><span class="serverMediaLabel"><input onclick="onServerChanged(\'' +
            serverData["S"] +
            '\')" name="photos" type="checkbox"' +
            photosChecked +
            '/>' +
            getString("photos") +
            ' ' +
            '</span></div>\
            <div class="radioControlWrapper">\
                <input onclick="onServerChanged(\'' +
            serverData["S"] +
            '\')" name="' +
            serverData["S"] +
            'aggmode" type="radio" ' +
            checkAggMode(0, serverData["E"]) +
            ' value="0"/>' + 
            getString("ignore") +
            '</div>\
            <div class="radioControlWrapper">\
                <input onclick="onServerChanged(\'' +
            serverData["S"] +
            '\')" name="' +
            serverData["S"] +
            'aggmode" type="radio" ' +
            checkAggMode(1, serverData["E"]) +
            ' value="1" />' + 
            getString("aggregate") +
            '</div>\
            <div class="radioControlWrapper">\
                <input onclick="onServerChanged(\'' +
            serverData["S"] +
            '\')" name="' +
            serverData["S"] +
            'aggmode" type="radio" ' +
            checkAggMode(2, serverData["E"]) +
            ' value="2" />' +
            getString("mirror") +
            '</div>\
			 <div class="clear"></div>\
		</div>';
        });
        element.show();
        element.html(serverHtml);
    }
    else {
        element.hide();
    }
}

//A utility function to determine whether a checkbox or radio input should be checked.
//aggMode: The value of the input in question.
//compareMode: The string to compare to.
function checkAggMode(aggMode, compareMode){
    return (aggMode == compareMode) ? ("checked") : ("");
}

//When a server is updated, add it to the changedServers collection.
//uuid: The uuid of the changed server.
function onServerChanged(uuid){
    changedServers[uuid] = uuid;
}

function toggleAvailableServers(isAggEnabled){
    (isAggEnabled) ? ($("#availableServersContainer").show()) : ($("#availableServersContainer").hide());
}

function submitAggregationData(){
	if (!changesMade) return;
    hideActionButtons();
    returnedCalls = 0;
    expectedCalls = 1;
	
	showLoadingGraphic();
    resetChanged();
	
	var data = "";
    var aggregationEnabledCheckbox = $("#aggregationEnabledCheckbox");
    var enableAggregation = ((aggregationEnabledCheckbox.is(":checked")) ? (1) : (0));
	if (aggregationOrig["aggregation"] != enableAggregation) {
		data += "aggregation=" + enableAggregation + "\n";
		aggregation["aggregation"] = enableAggregation;
		aggregationOrig["aggregation"] = enableAggregation;
	}
    var aggMode = $("input[name=aggregationMode]:checked").val();
	if (aggregationOrig["aggmode"] != aggMode) {
		data += "aggmode=" + aggMode + "\n";
		aggregation["aggmode"] = aggMode;
		aggregationOrig["aggmode"] = aggMode;
	}
    
    var aggregationServers = $(".availableServerContainer");
    $.each(aggregationServers, function(i, value){
        var element = $(value);
        //Only submit aggregatedserverswitch and aggregatedservercontent calls for servers that have been changed
        //(are in the changedServers collection).
        if (changedServers[element.attr("uuid")]) {
            expectedCalls += 2;
            var selectedAggregationMode = $("input[type=radio]:checked", element).val();
            var selectedContentTypes = $("input[type=checkbox]:checked", element);
            var musicChecked = false;
            var photosChecked = false;
            var videosChecked = false;
            $.each(selectedContentTypes, function(i, value){
                var checkbox = $(value);
                switch (checkbox.attr("name")) {
                    case "songs":
                        musicChecked = true;
                        break;
                    case "photos":
                        photosChecked = true;
                        break;
                    case "videos":
                        videosChecked = true;
                        break;
                }
            });
            var contentType = "";
            if (musicChecked && photosChecked && videosChecked) {
                contentType = "A";
            }
            else 
                if (musicChecked && photosChecked) {
                    contentType = "v";
                }
                else 
                    if (musicChecked && videosChecked) {
                        contentType = "p";
                    }
                    else 
                        if (photosChecked && videosChecked) {
                            contentType = "m";
                        }
                        else 
                            if (musicChecked) {
                                contentType = "M";
                            }
                            else 
                                if (photosChecked) {
                                    contentType = "P";
                                }
                                else 
                                    if (videosChecked) {
                                        contentType = "V";
                                    }
            makeGetRequest("/rpc/aggregatedserverswitch", {
                "uuid": element.attr("uuid"),
                "enabled": selectedAggregationMode
            }, function(){
                returnedCalls++;
                finishSaving();
            });
            makeGetRequest("/rpc/aggregatedservercontent", {
                "uuid": element.attr("uuid"),
                "cType": contentType
            }, function(){
                returnedCalls++;
                finishSaving();
            });
        }
    });
	if (data == "") {
		returnedCalls++;
		finishSaving();
		hideLoadingGraphic();
	} else {
		makePostRequest("/rpc/set_all", {}, data, function(){
			returnedCalls++;
			finishSaving();
			hideLoadingGraphic();
		});
	}
}

function finishSaving(){
    if (returnedCalls == expectedCalls) {
        showActionButtons();
        makeGetRequest("/rpc/info_status", {}, function(data){
            var dataPieces = data.split("\n");
            $.each(dataPieces, function(i, value){
                var pieces = value.split("|");
                if (pieces[0] == "restartpending") {
                    var restartPending = (pieces[1] == 1);
                    if (restartPending) {
                        showDialogOverlay(function(){
                            return getString("restartprompt")
                        }, {}, [{
                            text: getString("ok"),
                            onclick: "restartServer();"
                        }, {
                            text: getString("cancel"),
                            onclick: "hideDialogOverlay();"
                        }]);
                    } else {
						if (setReloadSide) reloadSide();
						setReloadSide = false;				
					}
                    return false;
                } 
            });
        });
    }
}


// ------------------------
// advanced page
// ------------------------
function loadAdvanced(){
    returnedCalls = 0;
    expectedCalls = 3;
    saveHandler = "submitAdvancedData();"
	inputFieldClicked = false;
    changesMade = false;

	showLoadingGraphic();
    
    // function get_server_type restored - should be retired again.
	makeGetRequest("/rpc/get_server_type", {}, function(response){
		advanced["servertype"] = response;
		returnedCalls++;
		if (expectedCalls == returnedCalls) {
            loadAdvancedHtml();
			hideLoadingGraphic();
		}
	});
	
	makeGetRequest("/rpc/get_all", {}, function(response){
        parseSeparatedData(response, advanced, advancedOrig, "=");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadAdvancedHtml();
			hideLoadingGraphic();
        }
    });

    makeGetRequest("/rpc/info_status", {}, function(response){
		parseSeparatedData(response, advanced, advancedOrig, "|");
		// advanced["servertype"] = getServerType(advanced["licensestatus"]);
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadAdvancedHtml();
			hideLoadingGraphic();
        }
    });
}

function loadAdvancedHtml(){
    makeGetRequest("/webconfig/advanced.htm", {}, function(response){
        var responseHtml = $(response);
        replaceStrings(responseHtml);
        replaceData(responseHtml, advanced, handleAdvancedData);
		    showToggleButtons(responseHtml);
        
        $(".serverSettingsContentWrapper").html(responseHtml);
		($("#availableWebdavContainer").hide());
        $("input", "#advancedContainer").live("click", onEventClick);
        $("input,select", "#advancedContainer").live("change", onEventChange);
        highlightNav($("#nav_advanced"));
    });
}

function handleAdvancedData(element, key, data){
	var serverType = advanced["servertype"];
    switch (key) {
		case "accessuser":
            element.val(data);
			break;
        case "accesspwd":
			if (data.length > 0) element.val("_twonkypassword_");
			break;
		case "myexperiencecheckbox":
            if (!(noMediaFusionServer || myTwonkyDisabled)) {
				// Playback and Beam reporting (portal)
				var reporting = (advanced["enablereporting"] != "0") ? ("checked") : ("");
				var pbreporting = getString("playbackbeamreportingcaption");
				pbreporting = pbreporting.replace("Twonky Data Collection Policy", "<a class=\'inlineLink\' href=\'" + statusData["privacypolicy"] + "\' target=\'_blank\'>Twonky Data Collection Policy</a>");
				returnValue = '<input id="pbreportingCheckbox" type="checkbox" ' + reporting + ' /><span>' + 
				pbreporting +
				'</span>\
				<div class="serverContentSpacer"></div>';
				element.html(returnValue);
				break;
			} else {
				// special text
				var reporting = (advanced["enablereporting"] != "0") ? ("checked") : ("");
				var pbreporting = getString("myexperience_desc");
				returnValue = '<input id="pbreportingCheckbox" type="checkbox" ' + reporting + ' /><span>' + 
				pbreporting +
				'</span>\
				<div class="serverContentSpacer"></div>';
				element.html(returnValue);
			}
			break;
        case "compilationsdir":
		case "ignoredir":
        case "scantime":
            element.val(data);
            break;
		case "nicrestart":
            element.attr("checked", data > 0)
            break;
		case "v":
            element.attr("checked", data > 0)
            break;
	}
}

// If the portal status is "connecting", the portal info is updated every 2 seconds (max 30 times).
// No longer used since the portal info has been removed from the Advanced page. 
function updateAdvancedCheck() {
    if (changesMade) {
		clearInterval(updateTimer);
		return;
	}
}

function updateAdvanced(){
    returnedCalls = 0;
    expectedCalls = 3;

	showLoadingGraphic();
    resetChanged();
    
    // function get_server_type restored - should be retired again.
	makeGetRequest("/rpc/get_server_type", {}, function(response){
		advanced["servertype"] = response;
		returnedCalls++;
		if (expectedCalls == returnedCalls) {
            loadAdvancedHtml();
			hideLoadingGraphic();
		}
	});
	
	makeGetRequest("/rpc/get_all", {}, function(response){
        parseSeparatedData(response, advanced, advancedOrig, "=");
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadAdvancedHtml();
			hideLoadingGraphic();
        }
    });

    makeGetRequest("/rpc/info_status", {}, function(response){
		parseSeparatedData(response, advanced, advancedOrig, "|");
		// advanced["servertype"] = getServerType(advanced["licensestatus"]);
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadAdvancedHtml();
			hideLoadingGraphic();
        }
    });
}



//Get HTML for the receiver navigation view dropdown.
//selectedView: The currently selected navigation view for the current receiver.
//isDefault: A boolean that indicates whether or not the user is able to update the dropdown. If true, a disabled
//dropdown is returned.
//i: The row number used to uniquely identify the receiver.
function getReceiverViewDropdown(selectedView, isDefault, index){
    var html = "";
    if (!isDefault) {
		var data = sharing["viewnames"];
		html = '<select name="viewName" onchange="receiverChanged(' + index + ')">';
		for (var i=0;i<data.length;i++) {
			html += '<option value="' + data[i] + '" ' +
			checkSelectedMediaOption(data[i], selectedView) +
			'>' +
			getString(data[i]) +
			'</option>';
		}
		html += '</select>';
	}
    else {
        html = '';
    }
    return html;
}

//Get HTML for the receiver client type dropdown.
//selectedView: The currently selected navigation view for the current receiver.
//i: The row number used to uniquely identify the receiver.
function getReceiverClientDropdown(selectedClient, i, showBox){
    var html = '<select class="clientType" name="clientType" ';
	if (!showBox) html += 'style="display:none" ';
    html += 'onchange="receiverChanged(' + i + ')">';
    var clientPieces = sharing.clients[0].split(",");
    $.each(clientPieces, function(i, value){
        if (i % 2 == 0) {
            html += '<option value="' + value + '" ';
        }
        else {
            html += checkSelectedMediaOption(value, selectedClient) + '>' + value + '</option>';
        }
    });
    html += "</select>";
    return html;
}

//Add a changed receiver to the changedReceviers collection.
//i: The row number of the changed receiver.
function receiverChanged(i){
	sharingReceiverChanged = true;
    changedReceivers[i] = $("#receiverRow" + i, ".mediaReceiversTable");
}
//Add a changed agg server to the changedAggServer collection.
//i: The row number of the changed agg server.
function aggServerChanged(i){
	sharingAggServerChanged = true;
    changedAggServer[i] = $("#aggServerRow" + i, ".aggServersTable");
}

function clearPassword() {
	$("#password").val("");
}

function submitAdvancedData(){
	if (!changesMade) return;
	var accessCredentialChanged = false;
    hideActionButtons();
    returnedCalls = 0;
    expectedCalls = 1;

	showLoadingGraphic();
    resetChanged();

	var data = "";
    var compilations = $("#compilations", ".accountSettingsContainer").val();
	if (advancedOrig["compilationsdir"] != compilations) {
		data += "compilationsdir=" + compilations + "\n";
		advanced["compilationsdir"] = compilations;
		advancedOrig["compilationsdir"] = compilations;
	}
    var ignoredir = $("#ignoredirs", ".accountSettingsContainer").val();
	if (advancedOrig["ignoredir"] != ignoredir) {
		data += "ignoredir=" + ignoredir + "\n";
		advanced["ignoredir"] = ignoredir;
		advancedOrig["ignoredir"] = ignoredir;
	}
    var rescan = $("#rescan", ".accountSettingsContainer").val();
	if (advancedOrig["scantime"] != rescan) {
		data += "scantime=" + rescan + "\n";
		advanced["scantime"] = rescan;
		advancedOrig["scantime"] = rescan;
	}
    var nicrestart = (($("#nicRestartEnabledCheckbox").attr("checked") == true) ? ("1") : ("0"));
	if (advancedOrig["nicrestart"] != nicrestart) {
		data += "nicrestart=" + nicrestart + "\n";
		advanced["nicrestart"] = nicrestart;
		advancedOrig["nicrestart"] = nicrestart;
	}
	// reportdevice was replaced by enablereporting (since 7.1)
	//if (advancedOrig["myexperience"] != myexperience) data += "reportdevice=" + myexperience + "\n";
    var reporting = (($("#pbreportingCheckbox").attr("checked") == true) ? ("15") : ("0"));
	if (advancedOrig["enablereporting"] != reporting) {
		data += "enablereporting=" + reporting + "\n";
		advanced["enablereporting"] = reporting;
		advancedOrig["enablereporting"] = reporting;
	}
    var loggingEnabled = (($("#loggingEnabledCheckbox").attr("checked") == true) ? ("4095") : ("0"));
	if (advancedOrig["v"] != loggingEnabled) {
		data += "v=" + loggingEnabled + "\n";
		advanced["v"] = loggingEnabled;
		advancedOrig["v"] = loggingEnabled;
	}

	if (!($("#password", ".accountSettingsContainer").val() == "_twonkypassword_")) {
		var username = "accessuser=" + $("#username", ".accountSettingsContainer").val();
		var password = "accesspwd=" + $("#password", ".accountSettingsContainer").val();
		if (((username.length > 11) && (password.length > 10)) || ((username.length == 11) && (password.length == 10))) {
			// set new username password
			data += username + "\n" + password + "\n";
			accessCredentialChanged = true;
		} else {
			// reset username and password (only username or password was entered)
			$("#username").val(advancedOrig["accessuser"]);
			if (advancedOrig["accesspwd"].length > 0) $("#password").val("_twonkypassword_");
			else $("#password").val("");
			showDialogOverlay(function(){
				return getString("notchanged")
			}, {}, [{
				text: getString("ok"),
				onclick: "hideDialogOverlay();"
			}]);
		}
	}
	if (data == "") {
		returnedCalls++;
		hideLoadingGraphic();
		finishSaving();
	} else {
		makePostRequest("/rpc/set_all", {}, data, function(){
			returnedCalls++;
			hideLoadingGraphic();
			if (accessCredentialChanged) {
				updateWebDavAdmin($("#username", ".accountSettingsContainer").val(), $("#password", ".accountSettingsContainer").val());	// change also the WebDav server admin credentials 
			}
			finishSaving();
	   });
	}
}

function updateWebDavAdmin(user, pass) {
	var request = loadXMLDoc("/update_admin_account?user="+user+"&pass="+pass,"");
	if (request.status < 200 && request.status > 300)
		showDialog(getString("dialog_admin_acc_could_not_update"));
	else {
		admin_user_name = user;
		admin_password = pass;
	}
}

var restartTest;
function restartServer(){
    makeGetRequest("/rpc/restart", {}, function(){
        showDialogOverlay(function(){
            return "<div class='spinner floatL'></div><div style='padding: 5px 0px 0px 10px;' class='floatL'>" + getString("serverrestarting") + "</div>"
        }, {}, {});
        restartTest = setInterval(function(){
            makeGetRequest("/rpc/get_all", {}, function(response){
				//if (response == "") break;
                clearInterval(restartTest);
                hideDialogOverlay();
                // Update aggregation info after the restart is complete on the Aggregation page to display the list of servers more quickly.
                if(window.location.hash == '#aggregation') {
                    // Callback must be on a short timeout in order to work since rpc call needs a short amount of time to popuplate list of
                    //      aggregation servers after restarting, if call is done without timeout, response is still empty.
                    setTimeout("updateAggregation()", 1500);
                }
            })
        }, 1000);
    });
}

function rescanFolders(){
    makeGetRequest("/rpc/rescan", {}, null);
}

//Display a dialog that prompts the user before completing a server reset.
function promptReset(){
    showDialogOverlay(function(){
        return getString("resetprompt");
    }, null, {
        1: {
            text: getString("ok"),
            onclick: "hideDialogOverlay(); resetServer()"
        },
        2: {
            text: getString("cancel"),
            onclick: "hideDialogOverlay()"
        }
    });
}

var resetTest;
function resetServer(){
    makeGetRequest("/rpc/reset", {}, function(){
        showDialogOverlay(function(){
            return "<div class='spinner floatL'></div><div style='padding: 5px 0px 0px 10px;' class='floatL'>" + getString("serverrestarting") + "</div>"
        }, {}, {});
		var t = setTimeout("waitingForServer()", 3000);
    });
}
function waitingForServer() {
	resetTest = setInterval(function(){
		makeGetRequest("/rpc/get_all", {}, function(response){
			if (response != "") {
				clearInterval(resetTest);
				setReloadSide = true;
				hideDialogOverlay();
			}
		})
	}, 2000);
}

function clearCache(){
    makeGetRequest("/rpc/clear_cache", {}, null);
}


var resetTest;
function resetClients(){
    makeGetRequest("/rpc/resetclients", {}, function(){
        showDialogOverlay(function(){
            return "<div class='spinner floatL'></div><div style='padding: 5px 0px 0px 10px;' class='floatL'>" + getString("clientreset") + "</div>"
        }, {}, {});
        resetTest = setInterval(function(){
            makeGetRequest("/rpc/get_all", {}, function(){
                clearInterval(resetTest);
                hideDialogOverlay();
                loadSharing();
            })
        }, 1000);
    });
}

function viewLog(){
    window.open("/rpc/log_getfile", "_blank");
}

function clearLog(){
    makeGetRequest("/rpc/log_clear", {}, null);
}

//Add the active class to a button when the mouse is pressed.
function onButtonMouseDown(button){
    var button = $(button);
    button.addClass("active");
}

//Remove the active class from a button when the mouse is released.
function onButtonMouseUp(button){
    var button = $(button);
    button.removeClass("active");
}

function cancelSettings(){
    resetChanged();
    $(window).trigger("hashchange");
}

function showActionButtons(){
    $("#actionButtonContainer").show();
    $("#spinnerContainer").hide();
}

function hideActionButtons(){
    $("#actionButtonContainer").hide();
    $("#spinnerContainer").show();
}

//Display a dialog overlay and opaque the background to prevent the user from interacting with the page until
//the dialog is closed.
//contentConstructor: The function to be called in order to populate the contents of the dialog.
//contentArgs: Arguments to be passed to the content constructor.
//buttons: A collection of buttons to include in the dialog. Buttons should be in the format {"text": text, "onclick":
//"onClickFunction()"}, where text is the text to be shown on the button and onclick is the function to be called
//when the button is clicked, expressed as a string ("onClickFunction()" rather than onClickFunction). 
function showDialogOverlay(contentConstructor, contentArgs, buttons, widthClass){
    var dialog = $("#dialogOverlay");
    if (dialog) {
        dialog.remove();
    }
    var body = $(document.body);
    var contentHtml = contentConstructor(contentArgs);
    var buttonHtml = makeButtons(buttons);
    var overlay = $("#overlay");
    if (overlay.length < 1) {
        body.append("<div id='overlay' class='overlay'></div>");
    }
    body.append('<div id="dialogOverlay" class="dialogWrapper ' + widthClass + '"> \
	<b class="dialogTop"><b class="d1"></b><b class="d2"></b><b class="d3"></b><b class="d4"></b></b> \
		<div class="dialogContentWrapper">\
			<div class="dialogContent">\
				' +
    contentHtml +
    '\
				<div class="dialogButtonContainer" id ="dialogButtonContainer">\
					' +
    buttonHtml +
    '\
				</div>\
				<div class="clear"></div>\
			</div>\
		</div>\
	<b class="dialogBottom"><b class="d4"></b><b class="d3"></b><b class="d2"></b><b class="d1"></b></b></div>');
    var dialog = $("#dialogOverlay");
    var dialogWidth = dialog.outerWidth();
    var left = (body.width() / 2) - (dialogWidth / 2);
    dialog.css("left", left);
    if (contentArgs && contentArgs.onstart) {
        contentArgs.onstart();
    }
}

//Iterate through the collection of buttons to produce the HTML for them.
//buttons: The collection of button objects.
function makeButtons(buttons){
    var buttonHtml = "";
	for (var key in buttons) {
		if (!buttons.hasOwnProperty(key)) {
			continue;
		}
        buttonHtml += '\
			<a class="actionbtnmd floatL" onclick="' + buttons[key].onclick + '" onmousedown="onButtonMouseDown(this)" onmouseup="onButtonMouseUp(this)">\
				<span class="actionbtn_l"></span>\
				<span class="actionbtn_c">' +
        buttons[key].text +
        '</span>\
				<span class="actionbtn_r"></span>\
			</a>';
    }
    return buttonHtml;
}

//Remove the dialog and opaque overlay.
function hideDialogOverlay(){
    var overlay = $("#overlay");
    overlay.remove();
    var dialog = $("#dialogOverlay");
    dialog.remove();
	if (setReloadSide) reloadSide();
	setReloadSide = false;
}

//A function to wrap retrieved JSON data in parentheses for eval-ing to prevent errors.
function parseJson(jsonData){
    return eval("(" + jsonData + ")");
}


function toggleContainer(clickedButton)
{
	var parent = clickedButton.parents(".boxHeader");
	var toggleElement = $(parent).next();
	var elementID = clickedButton.attr("id");
	if (toggleElement.css("display") == "none") {
		toggleElement.show();
		$(".toggleText", clickedButton).text(getString("hide"));
		clickedButton.removeClass("hidden");
		clickedButton.addClass("showing");
		document.cookie = elementID + "=show;";
	}
	else {
		toggleElement.hide();
		$(".toggleText", clickedButton).text(getString("show"));
		clickedButton.removeClass("showing");
		clickedButton.addClass("hidden");
		document.cookie = elementID + "=hide;";
	}
}

// ------------------------------------------
// OnlineServices page
// ------------------------------------------

function loadOnlineServices(){
    returnedCalls = 0;
    expectedCalls = 3;
	inputFieldClicked = false;
    changesMade = false;

	showLoadingGraphic();

    makeGetRequest("/rpc/get_option?portalusername", {}, function(response){
        onlineservices["portalusername"] = response;
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadOnlineServicesHtml();
			      hideLoadingGraphic();
        }
    });
    
    makeGetRequest("/rpc/portal_page?login", {}, function(response){
		  onlineservices["portallogin"] = response;
		  returnedCalls++;
      if (expectedCalls == returnedCalls) {
          loadOnlineServicesHtml();
		      hideLoadingGraphic();
      }
	  });
	 
	 	// function get_server_type restored - should be retired again. See also chapter advanced!
	  makeGetRequest("/rpc/get_server_type", {}, function(response){
  		onlineservices["servertype"] = response;
  		returnedCalls++;
  		if (expectedCalls == returnedCalls) {
  			loadOnlineServicesHtml();
  			hideLoadingGraphic();
  		}
	 });
}

function loadOnlineServicesHtml(){
    makeGetRequest("/webconfig/onlineservices.htm", {}, function(response){
        var responseHtml = $(response);
        replaceStrings(responseHtml);
        replaceData(responseHtml, onlineservices, handleOnlineServicesData);
		showToggleButtons(responseHtml);
        
        $(".serverSettingsContentWrapper").html(responseHtml);
        $("input", "#onlineServicesContainer").live("click", onEventClick);
        $("input,select", "#onlineServicesContainer").live("change", onEventChange);
        highlightNav($("#nav_onlineservices"));
   		var rpcIP = window.location.protocol + '//' + window.location.hostname;
        if (window.location.port) {
          rpcIP += ":" + window.location.port;
        }
        
        // Read the base url for the online services app from the ini property
        var onlineServicesAppUrl = "";
        makeGetRequest("/rpc/get_option?profileserviceurl", {}, function(response){
            onlineServicesAppUrl = response;
            if (onlineServicesAppUrl.length === 0 || onlineServicesAppUrl === "" || onlineServicesAppUrl.indexOf("twonky.com") == -1){
                $('#oschklink').attr('href', 'http://profile.twonky.com/tsconfig/css/empty.css');
                $('#osIframe').attr('src', 'http://profile.twonky.com/tsconfig/#/splash?rpc=' + rpcIP);
            } else {
                $('#oschklink').attr('href', onlineServicesAppUrl + '/tsconfig/css/empty.css');
                $('#osIframe').attr('src', onlineServicesAppUrl + '/tsconfig/#/splash?rpc=' + rpcIP);
            }
	      }); 
        
        /*if (onlineServicesAppUrl || onlineServicesAppUrl === "" || onlineServicesAppUrl.indexOf("twonky.com") == -1){
          $('#osIframe').attr('src', 'http://profile.twonky.com/tsconfig/#/splash?rpc=' + rpcIP);
        } else {
          $('#osIframe').attr('src', onlineServicesAppUrl + '/tsconfig/#/splash?rpc=' + rpcIP);
        } */    
    });
}

function handleOnlineServicesData(element, key, data){
    var returnValue = "";
    element.html(returnValue);
}

function updateOnlineServices(){
	if (inputFieldClicked) return;	// don't update page if changes are made (during enter the license key)
    returnedCalls = 0;
    expectedCalls = 3;
	showLoadingGraphic();
	
    makeGetRequest("/rpc/get_server_type", {}, function(response){
  		onlineservices["servertype"] = response;
  		returnedCalls++;
  		if (expectedCalls == returnedCalls) {
  			loadOnlineServicesHtml();
  			hideLoadingGraphic();
  		}
	});

    makeGetRequest("/rpc/get_option?portalusername", {}, function(response){
        onlineservices["portalusername"] = response;
        returnedCalls++;
        if (expectedCalls == returnedCalls) {
            loadOnlineServicesHtml();
			hideLoadingGraphic();
        }
    });
    
    makeGetRequest("/rpc/portal_page?login", {}, function(response){
		  onlineservices["portallogin"] = response;
		  returnedCalls++;
      if (expectedCalls == returnedCalls) {
          loadOnlineServicesHtml();
		  hideLoadingGraphic();
      }
	});
}

// ------------------------------------------
// synchronization (WebDav server)
// ------------------------------------------
var shares_alias_array = new Array();
var shares_path_array = new Array();
var shares_user_array = new Array();
var shares_rights_array = new Array();
var user_array = new Array();
var rights_user_array = new Array();
var rights_share_array = new Array();
var rights_mode_array = new Array();

var values_loaded=0;
var reserve_user_name = "Any";

         
function loadSynchronization(){
//	getMetaInfo();
    populateSettingsNav();			
	makeGetRequest("/webconfig/synchronization.htm", {}, function(response){
        var responseHtml = $(response);        	
		replaceStrings(responseHtml);
		showToggleButtons(responseHtml);
		$("#userslist",responseHtml).html(getUserList());        
		$("#sharedlist",responseHtml).html(getShareList());
        $(".serverSettingsContentWrapper").html(responseHtml);		
		// hide the "add new user" button if there are 10 or more users
		var id = document.getElementById("syncAddUserButton");
		if (user_array.length >= 10) id.style.display = "none";
		else id.style.display = "block";
		// hide the "add share" button if there are 10 or more shares
		var id = document.getElementById("syncAddShareButton");
		if (shares_alias_array.length >= 10) id.style.display = "none";
		else id.style.display = "block";
        highlightNav($("#nav_synchronization")); 
    });
}

function getMetaInfo() {
	if (!getServerDetails()) return;
	var rawdata = getServerDetails().responseText;
	var lines = rawdata.split("\n");
	server_name = lines[0];	
	server_port = lines[1];	
	server_version = lines[2];
	//globalLanguage = lines[3]
	server_start_time = lines[4];
	server_build_date = lines[5];	
}
function getServerDetails() {
	return loadXMLDoc("/get_server_info","");
}

function showDialog(msg, handler){
	showDialogOverlay(function(){
		return msg;
		}, {}, {
			1: {
				text: getString("ok"),
				onclick: "hideDialogOverlay(); " + handler
			}				
	}); 
}
function confirmDialog(msg,handler) {
    showDialogOverlay(function(){
        return msg;
    }, null, {
        1: {
            text: getString("ok"),
            onclick: handler
        },
        2: {
            text: getString("cancel"),
            onclick: "hideDialogOverlay()"
        }
    });
}

// status subheader: reload
function reloadConfig() {
	var request = loadXMLDoc("/reload","");
	if (request.status != 200) {
		showDialog(getString("reload_failed"));
	} else {
		window.location.reload();
	}	
    highlightNav($("#nav_synchronization"));       
}

function getUserList() {
	var i;
	var strOut = "";
	var numUsers = 0;
	if (!values_loaded) loadAll();
	numUsers = user_array.length;
	
	if (numUsers <= 0) {
		strOut += "<font color=\"red\">" + getString("no_user_added") + "</font>";
	} else {
		strOut += "<select class=\"selectUserInput floatL\" id=\"user\">";
		for (i=0;i<numUsers;i++) {
			strOut += "<option "+((i==0)?"selected ":"")+"value=\""+user_array[i]+"\">"+user_array[i]+"</option>";
		}
		strOut += "</select>";
		strOut += "<a class=\"actionbtn floatL\" onmousedown=\"onButtonMouseDown(this)\" onmouseup=\"onButtonMouseUp(this)\" onclick=\"deleteUser();\"> <span class=\"actionbtn_l\"></span><span class=\"actionbtn_c\">"+getString("delete")+"</span><span class=\"actionbtn_r\"></span></a>";
		strOut += "<div class=\"smallServerContentSpacer\"></div>";
	}	
	return strOut;
}
function loadAll() {
	var rawdata=getShares().responseText;
	if (rawdata == "failed") return;
	var lines=rawdata.split("\n");
	var len = parseInt(lines.length/4);
	shares_alias_array = new Array(len);
	shares_path_array = new Array(len);
	shares_user_array = new Array(len);
	shares_rights_array = new Array(len);
	for (i=0;i<len;i++) {
	    shares_alias_array[i]=lines[4*i];
	    shares_path_array[i]=lines[4*i+1];
	    shares_user_array[i]=lines[4*i+2];
	    shares_rights_array[i]=lines[4*i+3];
	}

	rawdata = getUsers().responseText;
	if (rawdata == "failed") return;
	lines = rawdata.split("\n");
	len = lines.length-1;
	user_array = new Array(len);
	for (i=0;i<len;i++) {
	    user_array[i]=lines[i];
	}

	rawdata=getRights().responseText;
	if (rawdata == "failed") return;
	lines=rawdata.split("\n");
	len = parseInt(lines.length/3);
	rights_user_array = new Array(len); 
	rights_share_array = new Array(len); 
	rights_mode_array = new Array(len); 
	for (i=0;i<len;i++) {
	    rights_user_array[i]=lines[3*i];
	    rights_share_array[i]=lines[3*i+1];
	    rights_mode_array[i]=lines[3*i+2];
	}
	values_loaded=1;
}
function getShares() {
	var request = loadXMLDoc("/get_shares","");
	if (request.status != 200) {
		showDialog(getString("dialog_server_req_failed"));
		request.responseText = "failed";
	}
	return request;
}
function getUsers() {
	var request = loadXMLDoc("/get_users","");
	if (request.status != 200) {
		showDialog(getString("dialog_server_req_failed"));
		request.responseText = "failed";
	}
	return request;
}
function getRights() {
	var request = loadXMLDoc("/get_rights","");
	if (request.status != 200) {
		showDialog(getString("dialog_server_req_failed"));
		request.responseText = "failed";
	}
	return request;
}


// delete and add users
function deleteUser() {
	var user = $("#user").val();
	var msg = formatString(getString("dialog_delete_user"),[user,user]);
	confirmDialog(msg,"confirmDeleteUser()");
}
function confirmDeleteUser() {
	var user = $("#user").val();
	user = encodeURIComponent(user);
	var request = loadXMLDoc("/delete_user?user="+user,"");
	if (request.status != 200) {
		showDialog(getString("dialog_server_req_failed"));
	} else {
		updateSharesForUser(user);
		window.location.reload();
        highlightNav($("#nav_synchronization"));       
	}
}
function updateSharesForUser(user) {
	var len = shares_alias_array.length;
	var i = 0;
	for (i=0;i<len;i++) {
		if (shares_user_array[i].length <= 0) continue;
		if (shares_user_array[i] != user) continue;
		removeRight(shares_alias_array[i]);
	}
}
function removeRight(alias) {
	alias = encodeURIComponent(alias);
	var request = loadXMLDoc("/remove_right?alias="+alias,"");
	if (request.status != 200) {
		showDialog(getString("dialog_server_req_failed"));
		return 0;
	}
	return 1;
}
function highlightText(field) {
	if(field!=null) {
		field.focus();
		field.select();
	}
}

function handleKeyPress(event) {
	// escape key
	if (event.keyCode==27) {
		hideDialogOverlay();
	}
}
function promptUserDialog(msg, handler, ispassword){
var inputtype="text";
var inputvalue=msg;
   if(ispassword) {
         inputtype = "password";
         inputvalue = "";
   }
    showDialogOverlay(function(){
        return "<div>" + msg + "</div>"
			+ "<input  type=\""+inputtype+"\" id=\"promptInput\" align='center' type=\"text\" value=\"" + inputvalue + "\" onkeyup=\"handleKeyPress(event)\" onclick=\"highlightText(this)\"/>";
    }, null, {
        1: {
            text: getString("ok"),
            onclick: handler
        },
        2: {
            text: getString("cancel"),
            onclick: "hideDialogOverlay()"
        }
    });
}
function addUser() {	
	promptUserDialog(getString("enter_valid_un"),"userEntered()", false);
}
var validUser;
function userEntered(){	
	var user = $("#promptInput").val();	
	if (user == getString("enter_valid_un")) {
		user = '';
	} else if (user.toLowerCase().replace(/\s/g, "") == reserve_user_name.toLowerCase()) {		
		showDialog(formatString(getString("dialog_reserve_user_name"),[reserve_user_name]));
		return;
	}	
	if (user.length > 0) {
		validUser = encodeURIComponent(user);
		promptUserDialog(getString("enter_valid_pw"),"passwordEntered()", true);	
	} else {
		showDialog(getString("dialog_enter_valid_un"));
	}
}
function passwordEntered () {
	var pw = $("#promptInput").val();	
	if (pw == getString("enter_valid_pw")) {
		pw = '';
	} 
	if (pw.length > 0) {
		pw = encodeURIComponent(pw);
		var request = loadXMLDoc("/add_user?user=" + validUser + "&pass=" +pw,"");
		if (request.status != 200) {
			showDialog(getString("dialog_server_req_failed"));
		} else {
			showDialog(getString("dialog_user_add_success"),"window.location.reload()");			
		}
	} else {
		showDialog(getString("dialog_enter_valid_pw"));
	}
}


// SHARES
function getShareList() {
	folderBrowseDialogMsg = 2;
	var i;
	var strOut = "";
	var newlink = "";
	if (!values_loaded) loadAll();
	var numSharesPresent = shares_alias_array.length;	

	if (numSharesPresent <= 0) {
		strOut += "<font color=\"red\">" + getString("no_syncfolders") + "</font>";
	}
	else {	
		// table columns: share name, share path, user, share rights, button delete share, button view share
		strOut += "<table class='syncTable'><tr>"
				+ "<th>" + getString("syncfolder_name") + "</th>"
				+ "<th>" + getString("local_folder") + "</th>"
				+ "<th style=\"text-align:center\">" + getString("username") + "</th>"					
				+ "<th style=\"text-align:center\">" + getString("rights") + "</th>"
				+ "<th></th>"
				+ "<th></th>"
				+ "</tr>";
		var uname = reserve_user_name;
		// Get the existing shares
		for (i=0;i<shares_alias_array.length;i++) {
   		    if (shares_user_array[i].length > 0)
				uname = shares_user_array[i];
		    else 
				uname = reserve_user_name;
		    strOut += "<tr><td><input class=\"floatL\" type=\"text\" readonly=\"readonly\" disabled=\"true\" value=\"" + shares_alias_array[i] + "\"/>"
						+ "</td><td>" 						
						+ "<input class=\"longInput floatL\" type=\"text\" readonly=\"readonly\" disabled=\"true\" value=\"" + shares_path_array[i] + "\"/>"
						+ "</td><td>"
						+ "<input class=\"webdavuser floatL\" style=\"text-align:center\" type=\"text\" readonly=\"readonly\" disabled=\"true\" value=\"" + uname  + "\"/>"
						+ "</td><td>"
						+ "<input class=\"webdavrights floatL\" style=\"text-align:center\" type=\"text\" readonly=\"readonly\" disabled=\"true\" value=\"" + shares_rights_array[i]  + "\"/>"
						+ "</td><td>"
						+ "<a style=\"width:100%\" class=\"actionbtn floatL\" onmousedown=\"onButtonMouseDown(this)\" onmouseup=\"onButtonMouseUp(this)\" onClick=\"deleteShare('"+ shares_alias_array[i] +"');\">"
						+ "<span class=\"actionbtn_l\"></span><span class=\"actionbtn_c\">" + getString('delete') + "</span><span class=\"actionbtn_r\"></span>"
						+ "</a></td>"
						+ "<td>"
						+ "<a style=\"width:100%\" class=\"actionbtn floatL\" onmousedown=\"onButtonMouseDown(this)\" onmouseup=\"onButtonMouseUp(this)\" onClick=\"openShare(" + i + ");\">"
						+ "<span class=\"actionbtn_l\"></span><span class=\"actionbtn_c\">" + getString('view') + "</span><span class=\"actionbtn_r\"></span>"
						+ "</a></td>"
						+ "</tr>";
		}
		strOut += "</table>";		
	}
	strOut += "<div class=\"smallServerContentSpacer\"/>"
	
	// show the part where a new share can be added (only if there not more than 10 shares)
	if (numSharesPresent >= 10) return strOut;
	
	strOut += "<div><b><span class=\"title\">" + getString("syncfolder_new_share_info") + "</span></div></b>";	
	// table columns: share name, sahre path, button browse path, user, share rights
	strOut += "<table class='syncTable'><tr>"
				+ "<th>" + getString("syncfolder_name") + "</th>"
				+ "<th>" + getString("local_folder") + "</th>"
				+ "<th></th>"
				+ "<th>" + getString("username") + "</th>"					
				+ "<th>" + getString("rights") + "</th>"
				+ "</tr>";
	strOut += "<tr><td>" 						
				+ "<input id=\"shareAlias\" class=\"pathInput floatL\" type=\"text\" value=\"\" />"
				+ "</td><td>"
				+ "<input id=\"pathInput1\" readonly=\"readonly\" class=\"longInput floatL\" type=\"text\" value=\"\"/>"
				+ "</td><td>"
				+ "<a style=\"width:100%\" class=\"actionbtn floatL\" onmousedown=\"onButtonMouseDown(this)\" onmouseup=\"onButtonMouseUp(this)\" onClick=\"showFolderBrowse('1');\">"
				+ "<span class=\"actionbtn_l\"></span><span class=\"actionbtn_c\">" + getString("browse") + "</span><span class=\"actionbtn_r\"></span>"
				+ "</a></td><td>"
				+ "<select class=\"selectUserInput floatL\" id=\"userInput\" onchange=\"updateRight(this.value)\">";
	for (i = 0; i < user_array.length; i++) {
		if (i == 0) strOut += "<option selected=\"selected\" value=\"" + user_array[i] + "\">" + user_array[i] + "</option>";
		else strOut += "<option value=\"" + user_array[i] + "\">" + user_array[i] + "</option>";
	} 
	strOut += "<option value=\"" + reserve_user_name + "\">" + getString("any") + "</option></select>"
				+ "</td><td>";
	if (user_array.length == 0) 
		strOut += "<select class=\"selectRightsInput floatL\" id=\"right\">"
					+ "<option selected=\"selected\" value=\"r/w\">r/w</option>"
					+ "</select></td></tr>";
	else
		strOut += "<select class=\"selectRightsInput floatL\" id=\"right\">"
					+ "<option selected=\"selected\" value=\"r/w\">r/w</option>"
					+ "<option value=\"r/o\">r/o</option>"
					+ "</select></td></tr>";
	strOut += "</table>";
	strOut += "<div class=\"verySmallServerContentSpacer\"></div>";
	return strOut;
}
function updateRight(val) {
	var elem = document.getElementById("right");
	elem.options.length = 0;
	if (val == reserve_user_name) {
		elem.options[0] = new Option("r/w", "r/w",true);
	} else {
		elem.options[0] = new Option("r/w", "r/w",true);
		elem.options[1] = new Option("r/o", "r/o");
	}
}
function getShareUrl(idx) 
{
	var url = shares_alias_array[idx];
	var lines = url.split("/");
	if (lines.length > 1) {		
		url = "/" + encodeURIComponent(lines[1]);
	}
	if (shares_alias_array[idx] != "/") {
	 url += "/";
	}
	return statusData["syncurl"] + url;
}
function openShare(idx) {
	window.open(getShareUrl(idx));
}

// add shares and rights, delete shares
function addShareAndRights() {
	var alias = $("#shareAlias").val();
	var folder = $("#pathInput1").val();
	var user = $("#userInput").val();
	var right = $("#right").val();
	var result = 0;
	var validRights = 0;
	var enableAuth = 1;
	if (user.toLowerCase().replace(/\s/g, "") == reserve_user_name.toLowerCase()) {
		enableAuth = 0;
	}

	result = addShare(alias, folder)
	if (1 == result) {
		if (enableAuth == 1) {
			result = addRight(alias, user, right);
		} else {
			result = removeRight(alias);
		}
		if (1 == result) {
			showDialog(getString("dialog_share_added_success"),"window.location.reload()");				
		}		
	}
}
function addRight(alias,user,mode) {
	if (alias.charAt(0) != '/')
		alias = '/' + alias;
	alias = encodeURIComponent(alias);
	user = encodeURIComponent(user);
	var request = loadXMLDoc("/rpc/webdav/add_right?alias="+alias+"&user="+user+"&mode="+mode,"");
	if (request.status != 200) {
		showDialog(getString("dialog_server_req_failed"));
		return 0;
	}
	return 1;
}
function addShare(alias,path) {
	if (alias==null || alias=="") {
		showDialog(getString("dialog_enter_alias_name"));       	
		return 0;
	}
        	
	var lines = alias.split("\\");
	if (lines.length > 1) {
		showDialog(formatString(getString("dialog_invalid_share_name_2"),["\\"]));
		return 0;
	}

	var lines = alias.split("/");
	if (lines.length > 2) {
		showDialog(formatString(getString("dialog_invalid_share_name_1"),["/","/","/","/","/"]));
		return 0;
	}

	if (path==null || path=="") {
		showDialog(getString("dialog_enter_share_dir"));
		return 0;
	}

	if (alias.charAt(0) != '/')
		alias = '/' + alias;
		
	alias = encodeURIComponent(alias);
	path = encodeURIComponent(path);
	
	var request = loadXMLDoc("/add_share?alias="+alias+"&path="+path,"");
	if (request.status != 200) {
		showDialog(getString("dialog_invalid_share_path"));
		return 0;
	}
	return 1;
}
function deleteShare(share) {
	shareToDelete = encodeURIComponent(share);
	var request = loadXMLDoc("/delete_share?share="+shareToDelete+"&tmp=","");
	if (request.status != 200) {
		showDialog(getString("dialog_failed_delete_share"));
	} else {
		window.location.reload();
        highlightNav($("#nav_synchronization"));       
	}	
}


function formatString(string2Fmt, values){
	if (string2Fmt == null || values == null || values.length == 0)
		return;
	var len = values.length;
	for (i=0;i<=len;i++){
		string2Fmt = string2Fmt.replace("{" + i + "}", values[i]);
	}
	return string2Fmt;	
}

function getWebDavUrl() {
	return "/rpc/webdavproxy?/rpc/webdav";
}

// Helper function that does the actual RPC invocation
function loadXMLDoc(my_url,strData) 
{
	var req;
	req = false;
	// branch for native XMLHttpRequest object
	if(window.XMLHttpRequest) {
		try {
			req = new XMLHttpRequest();
		} catch(e) {
			req = false;
		}
		// branch for IE/Windows ActiveX version
		} else if(window.ActiveXObject) {
		try {
			req = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				req = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
				req = false;
			}
		}
	}
	if(req) {
		my_url = getWebDavUrl() + my_url;
		if (strData.length>0) {  // post request
			req.open("POST", my_url, false);
			//req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			req.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');
			req.send(strData);
		}
		else { // get request
			req.open("GET", my_url, false);
			try {
				req.send("");
			} catch(e) {
				req = false;
			}
		}
		return req;
	}
	return "";
}
