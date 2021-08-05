//A JSON object that contains the string translations retrieved according to the user's language setting.
var languageFile = {};
//A JSON object that contains the string translations for the default language file (assumed to be English).
var defaultLanguageFile = {};
// convert-readme.txt file with license informations
var convertReadmeFile = "";
// Reload side after overlay dialog has been closed
var setReloadSide = false;
// detect safari browser
var browser = "other";
// detect Mac OS
var os = "other";

// timer which clear the background spinner after 5 seconds
var loadingGraficActiv;

//An object containing all the data for the Status page.
var statusData = {};

var mediaBrowsePageCount;
//The number of items/container to display on a page
var contentPages = "";
var pageCountItem = 30;
var pageCountContainer = 12;
// number of items/container in one row
var pageCountItemPerRow = 6;		// 5 * pageCountItemPerRow = 30 (pageCountItem)
var pageCountContainerPerRow = 4;	// 3 * pageCountContainerPerRow = 12 (pageCountContainer)

var persistentIDMusic = "music";
var persistentIDPhoto = "picture";
var persistentIDVideo = "video";
var serverURL = "";
var currentPersistentID = "";
var loginToMyTwonky = false;

var navTreeSpecialItem = false;

var timer;
var timerInterval = 1000;
var lastHash = "";

// default thumbnails of items
var videoDefaultImg = "/resources/webbrowse/gen_video_100.png";
var musicDefaultImg = "/resources/webbrowse/gen_music_40.png";
var photoDefaultImg = "/resources/webbrowse/gen_photo_100.png";
// default thumbnails of containers
var noCoverAudio = "/resources/webbrowse/nocover_audio.jpg";
var noCoverPhoto = "/resources/webbrowse/nocover_photo.jpg";
var noCoverVideo = "/resources/webbrowse/nocover_video.jpg";
// number of calls needed to find the container thumbnail
var getThumbnailCalls;


// ---- Initialize the Browse application
function initPage() {
    /*	if (top != self) {
     // page is in an iFrame; show no header and footer
     $("#headWrapper").hide();
     $("#footer").hide();
     } */
    browserIdentification();	// identify browser
    osIdentification();			// identify OS
    statusData["privacypolicy"] = "http://my.twonky.com/user/privacy";
    getConvertReadmeFile();		// license file
    readStatusData();
    readLanguageFiles();		// default language = english
    onLanguageFetched();
    setVisitLinks();			// set links to myTwonky and twonky in footer
    // build navigation and content area
    initBase();
    initTimer();

       

}

// ---- navigation
// navigate to settings page
function navigateToUrl(param) {
    window.location.href = param;
}
// navigate web browse
function navigateTo(params) {
    var id;
    if (params) window.location.hash = params;		// change hash
    lastHash = window.location.hash;
    resetContentArea();
    switch (params) {
        case "settings":
            navigateToUrl("/webconfig");
            break;
        case "":
        case "video":
            buildRootAndLeftNavigation(persistentIDVideo);
            break;
        case "music":
            buildRootAndLeftNavigation(persistentIDMusic);
            break;
        case "photo":
            buildRootAndLeftNavigation(persistentIDPhoto);
            break;
        case "licenseinfo":
            showLicenseInfo();
            break;
        default:
            // show content - Parameter: id, startPage, count
            loadMediaBrowseContent(params);
            break;
    }
}
function resetContentArea() {
    try {
        id = document.getElementById("leftNavContainer");
        id.style.display = "block";			// show navigation menu
        id = document.getElementById("serverSettingsContentWrapper");
        id.style.display = "block";			// show content area
        id = document.getElementById("browseContents");
        id.innerHTML = "";					// clear content area
        id = document.getElementById("licenseInfoPage");
        id.style.display = "none";			// hide license info page
        id = document.getElementById("breadcrumb");
        id.innerHTML = "";					// clear breadcrumb (above content area)
        id = document.getElementById("browsePages");
        id.innerHTML = "";					// clear page area (below content area)
    } catch (e) {
    }
}
function resetNavigationArea() {
    try {
        id = document.getElementById("browseNav");
        id.innerHTML = "";					// clear navigation area
    } catch (e) {
    }
}

function buildRootAndLeftNavigation(pID) {
    markRootGroup(pID);
    currentPersistentID = pID;
    mediaBrowsePageCount = pageCountItem;
    var url = getBaseContainerContent(serverURL, pID);
    resetNavigationArea();
    var url0 = populateLeftNavigation(url);	// show navigation entries
    if (url0 != "") {
        loadMediaBrowseContent(url0);
    }			// show content
}
// mark the current root item and navigation item
function markRootGroup(pID) {
    removeClass(persistentIDVideo, "active");
    removeClass(persistentIDMusic, "active");
    removeClass(persistentIDPhoto, "active");
    addClass(pID, "active");
}
function markLeftNavigation(id) {
    if (loginToMyTwonky) return;
    try {
        var elem = document.getElementById("browseNav");
        var l = elem.children.length;
        var j = 1000;
        for (var i = 0; i < l; i++) {
            removeClass(elem.children[i].id, "current");
            if (elem.children[i].id == id) j = i;
        }
        if (j < 1000) addClass(elem.children[j].id, "current");
    } catch (e) {
    }
}

// initialize page
function initBase() {
    var id;
    var hash = window.location.hash;
    if (hash) hash = hash.substring(1, hash.length); // remove hash mark
    switch (hash) {
        case "":
        case "video":
            // load/refresh Video
            initBaseRoot(persistentIDVideo);
            break;
        case "music":
            // load/refresh Music
            initBaseRoot(persistentIDMusic);
            break;
        case "photo":
            // load/refresh Photo
            initBaseRoot(persistentIDPhoto);
            break;
        default:
            // refresh child page with containers and/or items
            initBaseAfterRefresh(hash);
    }
}
function initBaseRoot(persistentID) {
    currentPersistentID = persistentID;
    lastHash = currentPersistentID;
    serverURL = getServerURL();			// get server url
    var url = getBaseContainerContent(serverURL, currentPersistentID); 	// video/music/photo
    loadSkeleton();
    resetContentArea();
    resetNavigationArea();
    var url0 = populateLeftNavigation(url);	// show navigation entries
    if (url0 != "") loadMediaBrowseContent(url0);			// show content
}
function initBaseAfterRefresh(hash) {
    // get item with parent list
    var response = httpGet(hash + "&fmt=json");
    if (!response) {
        initBaseRoot(persistentIDVideo);
        return;
    }
    try {
        var list = parseJson(response); 		// transform json item to object
    } catch (e) {
        return;
    }
    if (itemHasProperty(list, "error")) {
        initBaseRoot(persistentIDVideo);
        return;
    }
    var parentListLength = getNMCPropertyInt(list, "parentList.length");
    if (parentListLength == 1) {        // only root parent
        initBaseRoot(persistentIDVideo);
        return;
    }
    if (parentListLength >= 2) {
        serverURL = getNMCPropertyText(list, "parentList.url", parentListLength - 1); 		// root
        var url = getNMCPropertyText(list, "parentList.url", parentListLength - 2); 		// video/music/photo
        currentPersistentID = getObjIDFromTitle(list);
        lastHash = currentPersistentID;
        markRootGroup(currentPersistentID);
        loadSkeleton();
        resetContentArea();
        resetNavigationArea();
        populateLeftNavigation(url);
        loadMediaBrowseContent(hash);
    }
    // build breadcrumb and mark current title in left navigation
    if (parentListLength >= 2) {        // mark item in left navigation
        if (parentListLength == 2) markLeftNavigation(getNMCPropertyText(list, "id"));
        else markLeftNavigation(getNMCPropertyText(list, "parentList.id", parentListLength - 3));
        buildBreadcrumb(list);
    }
}

// ----------- 1. - get server list 
function getServerURL() {
    var r = httpGet("/nmc/rss/server" + "?start=0&fmt=json");
    if (!r) return "";
    try {
        var list = parseJson(r); 				// transform json item to object
    } catch (e) {
        return "";
    }
    if (itemHasProperty(list, "error")) return "";
    var itemCount = getReturnedItems(list);	// item count
    var port1 = getPort(window.location.host);
    for (var i = 0; i < itemCount; i++) {        // find the server
        if (isServer(list, i, port1)) return getNMCPropertyText(list, "item.url", i);
    }
    return "";
}
function isServer(elem, index, port1) {
    var isLocalDevice = (getNMCPropertyText(elem, "item.server.isLocalDevice", index) == "true");
    var port2 = getPort(getNMCPropertyText(elem, "item.server.baseURL", index));
    // server found if running on local device and server port is current port
    if (isLocalDevice && (port1 == port2)) return true;
    return false;
}
function getPort(url) {
    try {
        var i = url.indexOf(":", 6);
        if (i < 0) return "";
        return url.substr(i + 1, 4);
    } catch (e) {
        return "";
    }
}
// ----------- 2. - get root container with video, photo and music
function getBaseContainerContent(server, pvID) {
    navTreeSpecialItem = false;
    var server1 = server;
    if (server1 == "") {
        server1 = getServerURL();
    }
    if (server1 == "") {
        return "";
    }
    var r = httpGet(server1 + "?start=0&fmt=json");
    if (!r) return "";
    try {
        var list = parseJson(r); 				// transform json item to object
    } catch (e) {
        return "";
    }
    if (itemHasProperty(list, "error")) return "";
    var itemCount = getReturnedItems(list);	// item count
    var child = getItem(list, 0);
    if (child == "") return "";
    if (!itemHasProperty(child, "meta.pv:persistentID")) {
        // no video, music or photo item
        navTreeSpecialItem = true;
        return getNMCPropertyText(list, "meta.id", 0);
    }
    for (var i = 0; i < itemCount; i++) {        // find the media content video, photo or music
        if (getNMCPropertyText(list, "meta.pv:persistentID", i) == pvID)
            return getNMCPropertyText(list, "item.url", i);
    }
    return "";
}

// ----------- 3. - build the skeleton with the main html-container:
//   - left navigation tree = leftNavContainer
//   - title and navigation on top of the content area = breadcrumb
//   - content area = browseContents
//   - pages below the content area = browsePagination
function loadSkeleton() {
    try {
        if (document.getElementById("leftColumn")) return;   // left navigation is already loaded
        var response = httpGet("/resources/webbrowse/browse-nav.htm");
        if (!response) return;
        var id = document.getElementById("leftNavContainer");
        id.innerHTML = response;
        replaceStrings("leftColumn");
        var id = document.getElementById("serverSettingsContentWrapper");
        id.innerHTML = "<div id='breadcrumb' class='breadcrumb'></div>\
						<div id='browseContents'></div></div>\
						<div class='clear'></div>\
						<div id='browsePagination'><div id='browsePages' class='browsePages largeFont'></div></div>";
        id.className += " contentDisplay";
    } catch (e) {
    }
}

// ----------- 4. - populate the left navigation tree
// baseContainer: url of the base container music, video or photo
// return url of the first item or an empty string
function populateLeftNavigation(baseContainer) {
    var rc = "";
    showLoadingGraphic();
    var html = "";
    if (baseContainer == "") {
        clearContentArea();
        hideLoadingGraphic();
        return rc;
    }
    var response = httpGet(baseContainer + "?start=0&fmt=json");
    if (!response) {
        clearContentArea();
        hideLoadingGraphic();
        return rc;
    }
    // show the left navigation tree
    try {
        var list = parseJson(response);				// transform json item to object
    } catch (e) {
        hideLoadingGraphic();
        return rc;
    }
    if (itemHasProperty(list, "error")) {
        clearContentArea();
        hideLoadingGraphic();
        return rc;
    }
    var itemCount = getReturnedItems(list);
    if (itemCount == 0) {
        clearContentArea();
        hideLoadingGraphic();
        return rc;
    }
    loginToMyTwonky = false;
    for (var i = 0; i < itemCount; i++) {
        html += getLeftNavItem(list, i);
    }
    try {
        var id = document.getElementById("browseNav");
        id.innerHTML = html;
        rc = getNavigateTo(list, 0);
    } catch (e) {
    }
    hideLoadingGraphic();
    return rc;
}
function getLeftNavItem(list, index) {
    try {
        var itemId = getNMCPropertyText(list, "item.meta.id", index);
        var url = getNMCPropertyText(list, "item.url", index);
        var childCount = getHttpCount(getNMCPropertyInt(list, "item.meta.childCount", index));
        var title = myTwonkyTitle(list, index);
        if (loginToMyTwonky || navTreeSpecialItem) return title;
        else return '<li id="' + itemId + '" onclick="navigateTo(\'' + url + '?start=0&count=' + childCount + '&' + itemId + '\')"><a>' + title + '</a></li>';
    } catch (e) {
        return "";
    }
}
function getNavigateTo(list, index) {
    try {
        var itemId = getNMCPropertyText(list, "item.meta.id", index);
        var url = getNMCPropertyText(list, "item.url", index);
        var childCount = getHttpCount(getNMCPropertyInt(list, "item.meta.childCount", index));
        if (loginToMyTwonky || navTreeSpecialItem) return "";
        return url + '?start=0&count=' + childCount + '&' + itemId;
    } catch (e) {
        return "";
    }
}
function clearContentArea() {
    try {
        var id = document.getElementById("browseContents");
        id.innerHTML = "";
        id = document.getElementById("browsePages");
        id.innerHTML = "";
        id = document.getElementById("breadcrumb");
        id.innerHTML = "";
    } catch (e) {
    }
}

// server returns login message to myTwonky. Replace the text with a link.
function myTwonkyTitle(list, index) {
    try {
        var item = getItem(list, index);
        if (item == "") return "";
        var title = getNMCPropertyText(item, "title");
        if (getNMCPropertyText(item, "meta.id") == 0) {
            if (title.indexOf("myTwonky") >= 0) {
                loginToMyTwonky = true;
                if (browser == "other") {
                    // other browser (IE, Firefox,...)
                    title = title.replace("myTwonky", "<a class=\'inlineLink\' href=\"javascript:openPortalLink(\'login24\')\">myTwonky</a>");
                } else {
                    // Safari
                    title = title.replace("myTwonky", "<a class=\'inlineLink\' href=\" " + statusData["portallogin24"] + "\" target=\"_self\" onClick=\"javascript:startPortalCheckTimerOnClick(\'login24\')\">myTwonky</a>");
                }
            }
        }
        return title;
    } catch (e) {
        return "";
    }
}
// return V, M or P
function getObjType() {
    return (currentPersistentID.substring(0, 1)).toUpperCase();
}
function getObjIDFromTitle(elem) {
    try {
        var title = getNMCPropertyText(elem, "parentList.title", getNMCPropertyInt(elem, "parentList.length") - 2);
        var str = title.toLowerCase();
        str = str.substring(0, 5);
        switch (str) {
            case "video":
                return persistentIDVideo;
            case "music":
                return persistentIDMusic;
            case "photo":
            case "pictu":
                return persistentIDPhoto;
            default:
                return persistentIDVideo;
        }
        return persistentIDVideo;
    } catch (e) {
        return persistentIDVideo;
    }
}
function getThumbnail(elem) {
    try {
        var albumArtURI = true;
        var resValue = true;
        if (!itemHasProperty(elem, "meta")) return "";
        if (!itemHasProperty(elem, "meta.upnp:albumArtURI")) albumArtURI = false;
        if (!itemHasProperty(elem, "meta.res")) resValue = false;
        if (resValue) if (!(elem.meta.res.length > 0)) resValue = false;
        if (!albumArtURI && !resValue) return "";

        if (albumArtURI) return elem.meta["upnp:albumArtURI"];
        if (resValue) {
            var resIndex = 0;
            if (elem.meta.res.length > 1) resIndex = 1;
            return elem.meta.res[resIndex].value;
        }
        return "";
    } catch (e) {
        return "";
    }
}
// return true, if the item is a container
// return false, if it is an item
function isContainer(elem) {
    var metaClass = true;
    var upnpClass = true;
    if (!itemHasProperty(elem, "meta")) metaClass = false;
    if (!itemHasProperty(elem, "upnp:class")) upnpClass = false;
    //if (metaClass) if (!itemHasProperty(elem, "meta.upnp:class")) return false;
    if (!metaClass && !upnpClass) return false;
    try {
        if (metaClass)
            if (elem.meta["upnp:class"].substring(0, 16) == "object.container") return true;
        if (upnpClass)
            if (elem["upnp:class"] == "object.container") return true;
        return false;
    } catch (e) {
        return false;
    }
}

// content http requests have the parameter start and count to get some items and not all items
// function returns the count parameter
function getHttpCount(countIn) {
    if (countIn > pageCountItem) return pageCountItem;
    else return countIn;
}

// replace the text myTwonky with a link
function isOnlineFolder(elem) {
    try {
        var title = getNMCPropertyText(elem, "title");
        if (elem.parentList.length > 2) title = elem.parentList[elem.parentList.length - 3].title;
        if (title == ("myTwonky")) return true;
        return false;
    } catch (e) {
        return false;
    }
}

// the following function returns one property from the nmc json feeds as text
function getNMCPropertyText(elem, property, index) {
    try {
        switch (property) {
            case "parentList.id":
                return elem.parentList[index].id
            case "parentList.url":
                return elem.parentList[index].url;
            case "parentList.title":
                return elem.parentList[index].title;
            case "parentList.childCount":
                return elem.parentList[index].childCount;
            case "id":
                return elem.id;
            case "title":
                return elem.title;
            case "url":
                return elem.enclosure.url;
            case "item.url":
                return elem.item[index].enclosure.url;
            case "item.id":
                return elem.item[index].id;
            case "meta.id":
                return elem.meta.id;
            case "meta.title":
                return elem.meta['dc:title'];
            case "meta.album":
                return elem.meta['upnp:album'];
            case "meta.artist":
                return elem.meta['upnp:artist'];
            case "meta.genre":
                return elem.meta['upnp:genre'];
            case "res.size":
                return elem.meta.res[0].size;
            case "meta.format":
                return elem.meta['pv:extension'];
            case "meta.date":
                return elem.meta['dc:date'];
            case "item.meta.id":
                return elem.item[index].meta.id;
            case "item.server.isLocalDevice":
                return elem.item[index].server.isLocalDevice;
            case "item.server.baseURL":
                return elem.item[index].server.baseURL;
            case "meta.pv:persistentID":
                return elem.item[index].meta['pv:persistentID'];
            case "meta.res.value":
                return elem.meta.res[index].value;
            case "bookmark":
                return elem.bookmark;
            case "childCountContainer":
                return elem.meta['pv:childCountContainer'];
            default:
                return "";
        }
    } catch (e) {
        return "";
    }
}
// the following function returns one property from the nmc json feeds as integer
function getNMCPropertyInt(elem, property, index) {
    try {
        switch (property) {
            case "parentList.length":
                return elem.parentList.length;
            case "childCount":
                return elem.childCount;
            case "childCountContainer":
                return elem.childCountContainer;
            case "meta.childCount":
                return elem.meta.childCount;
            case "item.meta.childCount":
                return elem.item[index].meta.childCount;
            default:
                return 0;
        }
    } catch (e) {
        return 0;
    }
}
// get one item of a list
function getItem(elem, index) {
    try {
        return elem.item[index];
    } catch (e) {
        return "";
    }
}
// get property returneditems
function getReturnedItems(elem) {
    try {
        if (elem.returneditems.length > 0) {
            var c = elem.returneditems.split(" ");
            if (c.length > 1) return parseInt(c[0]);
        }
        return 0;
    } catch (e) {
        return 0;
    }
}
// get property meta.duration and return the formated value
function getMetaDuration(elem) {
    if (!itemHasProperty(elem, "meta.pv:duration" )) return "";
    try {
        var duration = elem.meta["pv:duration"].split(".")[0];
        if (duration.length == 0) duration = elem.meta["pv:duration"];
        if (!(duration.indexOf(":") > 0)) {
            if (duration.length == 0) duration = "00:00";
            if (duration.length == 1) duration = "00:0" + duration;
            if (duration.length == 2) duration = "00:" + duration;
        }
        if (duration.length > 5) {
            if (duration.split(":")[0] == "00") {
                duration = duration.substring(3, duration.length);
            } else {
                if (duration.split(":")[0] == "0") {
                    duration = duration.substring(2, duration.length);
                }
            }
        }
        return duration;
    } catch (e) {
        return "";
    }
}


// ---------- 5. - build the content area with breadcrumb and pagination
// fragment: <url>?start=<no>&count=<no>
function loadMediaBrowseContent(fragment) {
    var paramPieces = fragment.split("?");
    var url = paramPieces[0];
    var paramPieces2 = paramPieces[1].split("&");
    var start = paramPieces2[0].split("=")[1];
    var count = paramPieces2[1].split("=")[1];
    if (paramPieces2.length > 2) markLeftNavigation(paramPieces2[2]);	// mark item in left navigation
    loadMediaContents(url, start, count, false);
}
// url: The url to have its contents displayed.
// startItem: The index of the first item to display.
// numItems: The number of child items.
// reloadContent: reload the page (only if online folder - myTwonky)
function loadMediaContents(url, startItem, numItems, reloadContent) {
    showLoadingGraphic();
    var leaf = false;
    var branch = false;
    var nullNodes = 0;	// count nodes with 0 items
    var nodes = 0;		// count nodes
    var html = "";		// container
    var html1 = "";		// items
    var response = httpGet(url + "?start=" + startItem + "&count=" + numItems + "&fmt=json");
    if (!response) {
        return "";
    }
    try {
        var json = parseJson(response);
    } catch (e) {
        hideLoadingGraphic();
        return;
    }
    if (itemHasProperty(json, "error")) {
        hideLoadingGraphic();
        return;
    }
    var onlineFolder = isOnlineFolder(json);		// check for myTwonky
    var returnedItems = getReturnedItems(json);
    var childCount = getNMCPropertyInt(json, "childCount");
    var childCountContainer = getNMCPropertyInt(json, "childCountContainer");
    calculatePages(startItem, numItems, childCount, childCountContainer, returnedItems);
    var count = returnedItems;
    if (startItem == 0) {
        var c = getPageCount(1);
        if (c < count) count = c;
    }
    // show the container items
    for (var i = 0; i < count; i++) {
        var elem = getItem(json, i);
        if (elem == "") continue;
        if (isContainer(elem)) {
            // nodeType is branch - show thumbnail or default thumbnail
            branch = true;
            html += branchHtml(elem, onlineFolder);
            nodes++;
            if (getNMCPropertyInt(elem, "childCount") == 0) nullNodes++;
        } else {
            // nodeType is leaf
            if (branch && !leaf)
                html = html + '<div class="clear"></div>';  // insert a break between folders and items
            html1 += leafHtml(elem, onlineFolder);
            leaf = true;
        }
    }
    // place a container around photos (only around the items)
    if (currentPersistentID == persistentIDPhoto) {
        if (!(html1 == ""))
            html1 = '<div class="allPhotosContainer">' + html1 + '<div class="clear"></div></div>';
    }
    // header + container + items
	var title = replaceSpecialChars(getNMCPropertyText(json, "title"));	
    if (!leaf) html = '<div class="subHeader"><span class="subheaderTitle">' + title + '</span></div><div>' + html + '<div class="clear"></div></div><div class="myLibraryRow"></div>';
    else html = '<div class="subHeader"><span class="subheaderTitle">' + title + '</span></div><div>' + html + '</div><div>' + html1 + '</div>';
    try {
        var id = document.getElementById("browseContents");
        id.innerHTML = html;
    } catch (e) {
    }
    buildBreadcrumb(json);
    buildPagination(url, startItem);
    hideLoadingGraphic();
    try {
        //Bind dynamically generated elements
        //BEAM.bind($('div.pv-twonky-beam').toArray());
        //Without JQuery support
 
        if (document.body.getElementsByClassName) {
            BEAM.bind(document.getElementsByClassName('pv-twonky-beam'));
        } else {
            // IE8
            var i, j, regex, tags = [ 'div', 'span' ], temp;
            regex = new RegExp('\\b' + 'pv-twonky-beam' + '\\b', 'i');
            for (i = 0; i < tags.length; i += 1) {
                temp = document.getElementsByTagName(tags[i]);
                for (j = 0; temp && j < temp.length; j += 1) {
                    if (temp[j].className && temp[j].className.match(regex)) {
                        BEAM.bind(temp[j]);
						}
					}
				}	
			}
		} catch (e) {
					}
}
function replaceSpecialChars(stringIn) {
    var str1 = stringIn.replace(/&amp;/g, "&");
	str1 = str1.replace(/&/g, "&amp;");
	return str1;
}
// elem: is one item of the example Video - Album (at the end of this document)
// onlineFolder: show not all items if true
function branchHtml(elem, onlineFolder) {
    var html = "";
    var url = getNMCPropertyText(elem, "url");
	var title = replaceSpecialChars(getNMCPropertyText(elem, "meta.title"));
    var childCount = getNMCPropertyInt(elem, "meta.childCount");
    var childCountText = childCount + " items";
	childCount = getHttpCount(childCount);		// get the items for one page (parameter count)
    var id = getNMCPropertyText(elem, "meta.id");
    var objType = getObjType();

    var thumbnail = getThumbnail(elem);
    bookmarkId = getNMCPropertyText(elem, "bookmark");
    isContentContainer = getNMCPropertyText(elem, "childCountContainer") == 0;
    var beamButton = '<div class="pv-twonky-beam pv_bb_small" data-href="' + bookmarkId + '" ><span class="beam-button"></span></div>';

    var thumbnailDisplay = '<img id="fTh' + id + '" class="folderThumbnail" src="/resources/webbrowse/spacer.gif" onload="this.onload=null;loadDefaultThumbnail(this, \'' + objType + '\', ' + true + ')" />';
    if (thumbnail) thumbnailDisplay = '<img id="fTh' + id + '" class="folderThumbnail" src="' + thumbnail + '" onerror="this.onerror=null;loadDefaultThumbnail(this, \'' + objType + '\', ' + true + ')" />';
    if (onlineFolder) childCountText = "&nbsp;";	// online folders have no item count

    html += '<div class="byFolderContainer" onclick="navigateTo(\'' + url + '?start=0&count=' + childCount + '\')"> <div id="title"><a class="truncate">' + title + '</a><div class="smallFont">' + childCountText + '</div></div><div id="img' + id + '" class="folderImageWrapper">' + thumbnailDisplay + '</div>';

    if (isContentContainer) {
        html += '<div class="allContainer" onclick="event.cancelBubble = true;" >' + beamButton + '</div>';
    }

    html += '</div>';


    return html;
}
// elem: is one item of the example Video - Album (at the end of this document)
// onlineFolder: show not all items if true
function leafHtml(elem, onlineFolder) {
    var id = getNMCPropertyText(elem, "meta.id");
    var html = "";
    var htmlButton = "";
    var objType = getObjType();
    var thumbnail = getThumbnail(elem);			// get thumbnail
    if (currentPersistentID != persistentIDPhoto) {
        // music and video container
        var thumbnailDisplay = '<img id="fTh' + id + '" src="' + thumbnail + '" \
		onerror="this.onerror=null;loadDefaultThumbnail(this, \'' + objType + '\', ' + false + ')" />';
    }
    switch (objType) {        // show content
        case "V":
            html = leafHtmlVideo(elem, thumbnailDisplay, onlineFolder);
            break;
        case "P":
            html = leafHtmlPhoto(elem, thumbnail);
            break;
        case "M":
            html = leafHtmlMusic(elem, thumbnailDisplay);
            break;
    }
    return html;
}
function leafHtmlVideo(elem, thumbnail, onlineFolder) {
    var html = "";
    var url = getNMCPropertyText(elem, "meta.res.value", 0);
	var title = replaceSpecialChars(getNMCPropertyText(elem, "meta.title"));
    var duration = getMetaDuration(elem);
    var durationDisplay = (duration) ? ('<div class="timeDisplay">' + duration + '</div>') : ("")
    var contentsize = getNMCPropertyText(elem, "res.size");
    var format = getNMCPropertyText(elem, "meta.format");
    var date = getNMCPropertyText(elem, "meta.date");
    var year = date.substring(0, 4);
    var beamButton = '<div class="pv-twonky-beam pv_bb_small" data-href="' + url + '" > <span class="beam-button"></span></div>';
    var fileSize = '<div class="mediaData">' + getString("filesize") + ' ' + Math.round((parseInt(contentsize) / 1048576) * 100) / 100 + ' MB</div>';
    if (onlineFolder && (contentsize == "0") && (year == "1900")) fileSize = "";	// show no file size
    var videoYear = '<div class="mediaData">' + getString("year") + ' ' + year + '</div>';
    if (onlineFolder && (contentsize == "0") && (year == "1900")) videoYear = "";	// show no year

    html += '<div class="myLibraryRow">\
	<div class="myLibraryMediaContainer">\
	<div class="myLibraryMediaIcon">' + thumbnail + durationDisplay + '</div>\
	<div class="myLibraryMediaBeam">' + beamButton + '</div></div>\
	<div class="mediaData"><a class="largeFont" href="' + url + '" target="_blank">' + title + '</a></div>' +
        fileSize +
        '<div class="mediaData">' + getString("format") + ' ' + format + '</div>' +
        videoYear +
        '</div><div class="clear"></div></div>';

    return html;
}
function leafHtmlPhoto(elem, thumbnailData) {
    var html = '';
    var id = getNMCPropertyText(elem, "meta.id");
    var url = getNMCPropertyText(elem, "meta.res.value", 0);
    var beamButton = '<div class="pv-twonky-beam pv_bb_small" data-href="' + url + '" > \
	      <span class="beam-button"></span></div>';

    html += '<div class="allPhotosItemContainer"> \
	<div class="allPhotosItem"> \
	<a href="' + url + '" target="_blank">\
	<img id="fTh' + id + '" class="photoThumbnail" src="' + thumbnailData + '" onerror="this.onerror=null;loadDefaultThumbnail(this, \'P\', ' + false + ')" /> \
	</a>\
	</div>\
	<div class="allPhotosBeam" >' + beamButton + '</div> \
	</div>';

    return html;
}
function leafHtmlMusic(elem, thumbnail) {
    var html = "";
    var url = getNMCPropertyText(elem, "meta.res.value", 0);
    var artist = getNMCPropertyText(elem, "meta.artist");
    var album = getNMCPropertyText(elem, "meta.album");
    var genre = getNMCPropertyText(elem, "meta.genre");
	var title = replaceSpecialChars(getNMCPropertyText(elem, "meta.title"));
    var duration = getMetaDuration(elem);
    var durationDisplay = (duration) ? ('<div class="timeDisplay">' + duration + '</div>') : ("")
    var beamButton = '<div class="pv-twonky-beam pv_bb_small" data-href="' + url + '" > \
	      <span class="beam-button"></span></div>';
    html += '<div class="myLibraryListRow">\
	<div class="myLibraryListIconContainer">\
	<div class="myLibraryListIcon">' + thumbnail + '</div>\
	<div class="myLibraryListBeam">' + beamButton + '</div>\
	</div><div>\
	<div class="mediaData"><a class="largeFont" href="' + url + '" target="_blank">' + title + '</a> \
	<span class="largeFont">(' + duration + ')</span>\
	</div>\
	<div class="mediaData">' + getString("artist") + ' ' + artist + '</div>\
	<div class="mediaData">' + getString("album") + ' ' + album + '</div>\
	<div class="mediaData">' + getString("genre") + ' ' + genre + '</div>\
	</div><div class="clear"></div></div>';
    return html;
}

// ---------- 6. - build breadcrumb from parentList
function buildBreadcrumb(list) {
    var breadcrumb = "";
    var separator = "";
	var currentTitle = replaceSpecialChars(getNMCPropertyText(list, "title"));
    if (itemHasProperty(list, "parentList")) {
        // parents up to leftNavigation
        var parentListLength = getNMCPropertyInt(list, "parentList.length");
        for (var i = 0; i <= parentListLength - 3; i++) {    // length-1 = root, length-2 = video/music/photo, length-3 = leftNavigation
            var id = getNMCPropertyText(list, "parentList.id", i);
			var title = replaceSpecialChars(getNMCPropertyText(list, "parentList.title", i));
            var url = getNMCPropertyText(list, "parentList.url", i);
            var count = getNMCPropertyText(list, "parentList.childCount", i);
            breadcrumb = '<span class="breadcrumbWrapper" pathid="' + id + '">\
				<a onclick="navigateTo(\'' + url + '?start=0&count=' + count + '\')">\
				<span class="breadcrumbItem" pathid="' + id + '" numitems="' + count + '">' + title + '</span></a>' + separator + '</span>'
                + breadcrumb;
            separator = " / ";
        }
		breadcrumb += separator + replaceSpecialChars(list.title);
    }
    try {
        var id = document.getElementById("breadcrumb");
        id.innerHTML = breadcrumb;
    } catch (e) {
    }
}
// ---------- 7. - build pagination
// url: The url to have its contents displayed.
// startItem: The index of the first item to display.
// page format: 1 2 3 4 5 6 7
// more content pages: 1 2 ... 7 8 9 10 11 12 13 ... 20 21
function buildPagination(url, startItem) {
    var lowerPage;
    var upperPage;
    var p7;
    var pages = contentPages.split("&");	// format: start-count&start-count&...
    var html = "<div>";
    if (pages.length == 0) return;
    var currentPage = 1;
    var showAll = true;
    for (var i = 0; i < pages.length; i++) {    // search current page
        var a = pages[i].split("-");	// a[0]=start a[1]=count
        if ((startItem >= a[0]) && (startItem < a[0] + a[1])) currentPage = i + 1;	// index0=page1, index1=page2,...
    }
    if (pages.length < 12) {            // show all pages, page format: 1 2 3 4 5 6 7
        lowerPage = 1;
        upperPage = pages.length;
    } else {                         // show current page plus three pages in each direction
        showAll = false;
        lowerPage = currentPage - 3;
        upperPage = currentPage + 3;
        while (lowerPage < 1) {
            lowerPage++;
            upperPage++;
        }
        while (upperPage > pages.length) {
            lowerPage--;
            upperPage--;
        }
    }
    if (!showAll && (upperPage > 7)) {
        html += makePaginationLink(url, 1, pages);						// page format: 1
        if (upperPage > 8) html += makePaginationLink(url, 2, pages);	// page format: 1 2
        if (upperPage > 9) html += " ... ";							// page format: 1 2 ...
    }
    if (lowerPage > 10) {
        p7 = lowerPage + 3 - 7;
        html += makePaginationLink(url, p7, pages);						// page format: 1 2 ... 7
        html += " ... ";												// page format: 1 2 ... 7 ...
    }
    for (i = lowerPage; i <= upperPage; i++) {                                // page format: 1 2 ... 7 ... 11 12 13 14 15 16 17
        if (i == currentPage) html += '<span>' + i + '</span> ';
        else html += makePaginationLink(url, i, pages);	// p[0]=start p[1]=count
    }
    var pUpperGap = pages.length - upperPage;
    if (pUpperGap > 10) {
        p7 = upperPage - 3 + 7;
        html += " ... ";												// page format: 1 2 ... 7 ... 11 12 13 14 15 16 17 ...
        html += makePaginationLink(url, p7, pages);						// page format: 1 2 ... 7 ... 11 12 13 14 15 16 17 ... 21
    }
    if (pUpperGap > 2) html += " ... ";									// page format: 1 2 ... 7 ... 11 12 13 14 15 16 17 ... 21 ...
    if (pUpperGap > 1) html += makePaginationLink(url, pages.length - 1, pages);	// page format: 1 2 ... 7 ... 11 12 13 14 15 16 17 ... 21 ... 49
    if (pUpperGap > 0) html += makePaginationLink(url, pages.length, pages);	// page format: 1 2 ... 7 ... 11 12 13 14 15 16 17 ... 21 ... 49 50
    html += "</div>";
    if (pages.length > 1) html += "<div>" + currentPage + " " + getString("of") + " " + pages.length + "</div>";
    try {
        var id = document.getElementById("browsePages");
        id.innerHTML = html;
    } catch (e) {
    }
}
//Get the HTML for a pagination link.
//url: The id of the media node to browse to.
//pageno: The page
//pages: the start item and count of the current page (pageno)
// example: pageno 1, pages 1-12  pageno 2, pages 12-12  pageno 3, page 24-12 ...
function makePaginationLink(url, pageno, pages) {
    var p = pages[pageno - 1].split("-");					// pages[0] .. pages[pages.length-1]
    var itemStart = p[0];
    var itemCount = p[1];
    return '<a onclick="navigateTo(\'' + url + '?start=' + itemStart + '&count=' + itemCount + '\')">' + pageno + '</a> '
}
// currentPage: current page number
// pageCount: add so many pages
// itemCount: number of items on every page
// global var contentPages, contains the pages with start item and count
// format: start-end&start-end&...
//         of page 1 page 2    .....
function addPages(currentItem, pageCount, itemCount) {
    var cItem = currentItem;
    var separator = "";
    var start = 0;
    if (contentPages.length > 0) separator = "&";	// global var
    for (var i = 0; i < pageCount; i++) {
        contentPages += separator + cItem + "-" + itemCount;
        cItem = cItem + itemCount;
        separator = "&";
    }
    return cItem;
}
function calculatePages(startItem, numItem, childCount, childCountContainer, returnedItems) {
    contentPages = "";
    var currentItem = 0;
    var start;
    var end;
    var c_modulo = 0;
    var c = 0;
    if (childCountContainer > 0) {        // container pages (c)
        c_modulo = childCountContainer % pageCountContainer;			// modulo
        c = (childCountContainer - (c_modulo)) / pageCountContainer;	// integer devision (no decimal place)
        if (c > 0) currentItem = addPages(currentItem, c, pageCountContainer);
    }
    var itemsLeft = childCount - (c * pageCountContainer);	// items left
    var c1_modulo = 0;
    var c1 = 0;
    if (c_modulo > 0) {                    // how many container rows (c1) are there
        c1_modulo = c_modulo % pageCountContainerPerRow;
        c1 = ((c_modulo - (c1_modulo)) / pageCountContainerPerRow);
        c1++;
        var halfc1 = (c1 + (c1 % 2)) / 2;
        var childCountLeft = pageCountItem - ( (c1 + halfc1) * pageCountItemPerRow);
        if ((c_modulo + childCountLeft) > itemsLeft) currentItem = addPages(currentItem, 1, itemsLeft);
        else currentItem = addPages(currentItem, 1, c_modulo + childCountLeft);
        itemsLeft = itemsLeft - c_modulo - childCountLeft;		// items left
        if (itemsLeft < 0) itemsLeft = 0;
    }
    if (itemsLeft > 0) {        // pages with items
        var c2_modulo = itemsLeft % pageCountItem;
        var c2 = (itemsLeft - c2_modulo) / pageCountItem;
        currentItem = addPages(currentItem, c2, pageCountItem);
        if (c2_modulo > 0) currentItem = addPages(currentItem, 1, c2_modulo);
    }
}
function getPageCount(page) {
    if (contentPages == "") return 0;
    var a1 = contentPages.split("&");
    if (a1.length < page) return 0;
    var a2 = a1[page - 1].split("-");
    return a2[1];
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
function getConvertReadmeFile() {
    var data = makeGetRequest("/resources/webbrowse/convert-readme.txt", {});
    convertReadmeFile = data;
    convertReadmeFile = convertReadmeFile.replace(/(\r\n)|(\r)|(\n)/g, "<BR>");
}
function readStatusData() {
    var response = makeGetRequest("/rpc/get_all", {});
    if (response) {
        parseSeparatedData(response, statusData, "=");
    }
    //Handle the version case separately.
    //get_all, info_status and version return a "version" property.
    //get_all.version is only set if the server comes with NMC
    statusData["fullversion"] = statusData.version;
}
function readLanguageFiles() {
    // default language file is english
    var data = makeGetRequest("/resources/webbrowse/strings-en.json", {});
    if (data) {
        defaultLanguageFile = parseJson(data);
        languageFile = parseJson(data);
    }
    // read language file
    var data2 = makeGetRequest("/resources/webbrowse/strings-" + statusData["language"] + ".json", {});
    if (data2) languageFile = parseJson(data2);
}
function onLanguageFetched() {
    replaceStrings("headWrapper");
    replaceStrings("twFooter");
}

// A function to wrap retrieved JSON data in parentheses for eval-ing to prevent errors
function parseJson(jsonData) {
    return eval("(" + jsonData + ")");
}

// show the license information page
function showLicenseInfo() {
    try {
        var id;
        id = document.getElementById("leftNavContainer");
        id.style.display = "none";
        id = document.getElementById("serverSettingsContentWrapper");
        id.style.display = "none";
        id = document.getElementById("licenseInfoPage");
        id.style.display = "block";
        id.innerHTML = getString("mpeglicense") + "<br /><br />" + getString("copyright") + "<br /><br /><br /><br />" +
            convertReadmeFile + "<br /><br />" +
            "<BR><BR>License information is provided here: <br /><br /> " +
            "<a class='inlineLink' href='http://jquery.org/license/' >http://jquery.org/license/</a> (click on 'MIT License' link)<br /><br />" +
            "<a class='inlineLink' href='http://benalman.com/about/license/' >http://benalman.com/about/license/</a> <br />";
    } catch (e) {
    }
}
//Get the value of a string given a key from the localized string translations.
//key: The key to retrieve a string for.
//getLong: Default false. If true, retrieve longValue from the translation object rather than value. longValue can be
//used to store longer text that shouldn't necessarily always be displayed.
function getString(key, getLong) {
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

//Replace the contents of all elements in html that have a "string" attribute with the matching 
//value from the translation file.
function replaceStrings(id) {
    try {
        var elem = document.getElementById(id);
        replace(elem);
    } catch (e) {
    }
}
function replace(elem) {
    try {
        if (elem.childNodes == null) return;
        for (var i = 0; i < elem.childNodes.length; i++) {
            var child = elem.childNodes[i];
            if (child.attributes == null) continue;
            for (var j = 0; j < child.attributes.length; j++) {
                if (!(child.attributes[j].name == "string")) continue;
                if (child.childNodes.length > 0)
                    if (typeof child.childNodes[0].textContent == "undefined")
                        child.childNodes[0].nodeValue = getString(child.attributes[j].value, false);
                    else
                        child.childNodes[0].textContent = getString(child.attributes[j].value, false);
                else {
                    var str = getString(child.attributes[j].value, false);
                    var newNode = document.createTextNode(unescapeHtml(str));
                    child.appendChild(newNode);
                }
                child.removeAttribute("string");
                break;
            }
            replace(child);
        }
    } catch (e) {
    }
}

function unescapeHtml(str) {
    var e = document.createElement('div');
    e.innerHTML = str;
    return e.childNodes.length === 0 ? str : e.childNodes[0].nodeValue;
}

//Split a collection of data that is in name/value pair form (e.g. /rpc/get_all) and store it in a data object.
//The key becomes the first part of the split, and the value becomes the second (v=0 would be stored as {"v": 0}).
//responseData: The data to split.
//dataCollection: The data object in which to store the data. The data can be changed by the user.
//separatorChar: The character that separates the name/value pairs.
function parseSeparatedData(responseData, dataCollection, separatorChar) {
    var responsePieces = responseData.split("\n");
    for (var i = 0; i < responsePieces.length; i++) {
        var elem = responsePieces[i];
        var pieceArray = elem.split(separatorChar);
        if (pieceArray.length == 2) {
            var cleanedData = pieceArray[1].replace(/\r/g, "");
            dataCollection[pieceArray[0]] = cleanedData;
        }
    }
}
//A generic wrapper for making AJAX GET requests.
//url: The url to make the request to.
//params: A collection of objects to be passed as querystring arguments. Use the format {"key": value}. For example,
//[{"uuid": 1234}, {"example": true}] will be passed as ?uuid=1234&example=true in the querystring.
function makeGetRequest(url, params) {
    var urlParams = "";
    var separatorChar = "?";
    for (var key in params) {
        if (!params.hasOwnProperty(key)) {
            continue;
        }
        urlParams += separatorChar + key + "=" + params[key];
        separatorChar = "&";
    }
    return httpGet(url + urlParams);
}
function httpGet(urlin) {
    var req;
    req = false;
    var i = urlin.indexOf(":", 5),
        url = '';

    if (i < 1) {
        url = urlin;
    }
    else {
        url = urlin.substr(i + 5, urlin.length);
    }
    // branch for native XMLHttpRequest object
    if (window.XMLHttpRequest) {
        try {
            req = new XMLHttpRequest();
        } catch (e) {
            req = false;
        }
        // branch for IE/Windows ActiveX version
    }
    else if (window.ActiveXObject) {
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                req = false;
            }
        }
    }
    if (req) {
        req.open("GET", url, false);
        try {
            req.send("");
        } catch (e) {
            req = false;
        }
        return req.responseText;
    }
    return "";
}

function showLoadingGraphic() {
    addClass("serverSettingsContentWrapper", "loading");
    if (loadingGraficActiv) window.clearInterval(loadingGraficActiv);
    loadingGraficActiv = window.setInterval("hideLoadingGraphic()", 8000);
}
function hideLoadingGraphic() {
    window.clearInterval(loadingGraficActiv);
    loadingGraficActiv = null;
    removeClass("serverSettingsContentWrapper", "loading");
}

// add class to html-tag
function addClass(idName, className) {
    try {
        var elem = document.getElementById(idName),
            elemClass = elem.className || elem.getAttribute('class') || '',
            separator = elemClass && elemClass.length > 0 ? ' ' : '';

        if (!elemClass || elemClass == '' || !elemClass.match(className)) {
            if (elem.className) {
                elem.className += separator + className;
            }
            else {
                elem.setAttribute('class', elemClass + separator + className);
            }
        }
    } catch (e) {
    }
}
// remove class from html-tag
function removeClass(idName, className) {
    try {
        var elem = document.getElementById(idName),
            elemClass = elem.className || elem.getAttribute('class') || '',
            classList = elemClass.split(' '),
            newClass = '';

        for (var i = 0; i < classList.length; i++) {
            if (!(classList[i] == className)) {
                newClass += classList[i] + ' ';
            }
        }

        newClass = trimString(newClass);

        if (elem.className) {
            elem.className = newClass;
        }
        else {
            elem.setAttribute('class', newClass);
        }
    } catch (e) {
    }
}

// need to add this because trim() is not supported on IE8
function trimString(val) {
    return val.replace(/^\s+|\s+$/g, '');
}

// check if item has the property (l = item, p = property key)
function itemHasProperty(l, p) {
    var prop = p.split(".");
    var n = "";
    for (var key in l) {
        if (key == prop[0]) {
            if (prop.length == 1) return true;
            var pnew = prop[1];
            for (var i = 2; i < prop.length; i++) {
                pnew = pnew + "." + prop[i];
            }
            return itemHasProperty(l[key], pnew);
        }
    }
    return false;
}

function setVisitLinks() {
    try {
        var id1 = document.getElementById("visitLink1");
        var id2 = document.getElementById("visitLink2");
        var id3 = document.getElementById("visitLink3");
        var id4 = document.getElementById("visitLink4");
        var id11 = document.getElementById("legalLink1");
        // Twonky
        id1.innerHTML = "<a href='http://www.twonky.com' target='_blank'>" + getString("twonky.com") + "</a>";
        // Mobile Apps
        id2.innerHTML = "<a href='http://twonky.com/twonky-beam-info/' target='_blank'>" + getString("mobileApps") + "</a>";
        // Help center
        id3.innerHTML = "<a href='http://getsatisfaction.com/Twonky' target='_blank'>" + getString("helpCenter") + "</a>";
        // -
        id4.innerHTML = "";
        // Licensing Information
        //id11.innerHTML = "<a href='http://www.pv.com/media_solution.html' target='_blank'>" + getString("licensinginfo") + "</a>";
        id11.innerHTML = "<a href='' onclick='navigateTo(\"licenseinfo\"); return false;'>" + getString("licensinginfo") + "</a>";
    } catch (e) {
    }
}


function reloadMediaContent(url, start, numItems) {
    loadMediaContents(url, start, numItems, true);
}

// portal check
function openPortalLink(arg) {
    // login with redirect to config pages if 24 hours are over - only free server
    if (arg == "login24") {
        // call the portal with the current url (server config page) as parameter
        // example call: window.open("http://staging-portal.twonky.com/signin?pvx-orig-url=http://127.0.0.1:9000", ....)
        // set cookie. At restart update server portal data.
        document.cookie = "login24=true;";
        var response = makeGetRequest("/rpc/portal_page?" + arg, {});
        window.open(response + "/signin?pvx-orig-url=" + document.URL, "_self", 'menubar=yes,scrollbars=yes,status=yes,toolbar=yes,resizable=yes');
    }
}



function getDefaultContainerThumbnail(mediaType) {
    switch (mediaType) {
        case "V":
            return noCoverVideo;
            break;
        case "M":
            return noCoverAudio;
            break;
        case "P":
            return noCoverPhoto;
            break;
    }
}
//Load the default thumbnail for an image if the one specified in the media browse API can't be successfully loaded.
//image: The image to change the src of.
//mediaType: The media type of the node (video, music, photo). Used to determine which image to display.
function loadDefaultThumbnail(image, mediaType, isFolder) {
    //If the image is a child of an element with the byFolderContainer class, use the larger image.
    //Otherwise, use the smaller image for that content type.
    try {
		switch (mediaType) {
			case "V":
				image.src = (isFolder) ? (noCoverVideo) : (videoDefaultImg);				
				break;
			case "M":
				image.src = (isFolder) ? (noCoverAudio) : (musicDefaultImg);
				break;
			case "P":
				image.src = (isFolder) ? (noCoverPhoto) : (photoDefaultImg);
				break;
			default:
				image.src = "";
		}
		return true;
    } catch (e) {
		return true;
    }
}
// refresh page if browser back button was pressed
// (IE has no event handling for this button)
function initTimer() {
    lastHash = currentPersistentID;
    timer = setInterval(checkTimer, timerInterval);
	// 1000 milliseconds timer to make sure the beam button code is properly intialized
	setTimeout(disableReportingCheck, timerInterval); 
}
function checkTimer() {
    if (!(lastHash == window.location.hash)) navigateTo(window.location.hash.substring(1, window.location.hash.length));
}

function disableReportingCheck() {
   	 try {
           var er = statusData["enablereporting"]
           if (typeof er === "undefined" || er.length == 0  || parseInt(er) == 0) {
               BEAM.disableReporting();
           }
	} catch (e) { }
	
}


// 1 - server list in json format
/*
 "id":"Servers"
 "title":"Servers"
 "upnp:class":"object.container"
 "url":"http://127.0.0.1:9000/nmc/rss/server?fmt=json"
 "description":"4 objects available in container"
 "returneditems":"4 objects returned from container"

 "item": [ {  // server 0
 "title":"margret Library at Margret-PC"
 "enclosure": {
 "value":""
 "type":"application/rss xml"
 "url":"http://127.0.0.1:9000/nmc/rss/server/RBuuid:55076f6e-6b79-4d65-64a5-1c6f65956ad9,0"
 }
 "bookmark":"uuid:55076f6e-6b79-4d65-64a5-1c6f65956ad9,0"

 "server": {
 "name":"margret Library at Margret-PC"
 "friendlyName":"margret Library at Margret-PC"
 "manufacturer":"PacketVideo"
 "modelName":"TwonkyServer"
 "modelNumber":"7.1"
 "modelDescription":"TwonkyServer"
 "dlnaVersion":"DMS-1.50"
 "upnpVersion":"1.0"
 "playlistSupport":"true"
 "isLocalDevice":"false"
 "isInternalDevice":"false"
 "UDN":"uuid:55076f6e-6b79-4d65-64a5-1c6f65956ad9"
 "baseURL":"http://192.168.1.144:9000"
 "isProxyServer":"false"
 "isSupportRecording":"false"
 "dtcpPushSupport":"false"
 "dtcpCopySupport":"false"
 "dtcpMoveSupport":"false"
 "uploadSupportAV":"true"
 "uploadSupportImage":"true"
 "uploadSupportAudio":"true"
 "deviceIsOnline":"true"
 "knownServer":"Twonky 7.1"
 }
 "upnp:class":"object.container"
 "wellKnownBookmarks": [
 { "realContainerId": "0$1", "value": ".,music" }
 { "realContainerId": "0$1$8", "value": ".,music/all" }
 { "realContainerId": "0$1$9", "value": ".,music/playlists" }
 { "realContainerId": "0$1$10", "value": ".,music/genre" }
 { "realContainerId": "0$1$11", "value": ".,music/artists" }
 { "realContainerId": "0$1$12", "value": ".,music/albums" }
 { "realContainerId": "0$1$13", "value": ".,music/folders" }
 { "realContainerId": "0$1$14", "value": ".,music/rating" }
 { "realContainerId": "0$2", "value": ".,picture" }
 ...
 { "realContainerId": "0$3", "value": ".,video" }
 ...
 { "realContainerId": "0$37", "value": ".,playlists" }
 { "realContainerId": "0$1$39", "value": ".,music/mytwonky" }
 ...
 ]
 }
 { // server 1 }
 { // server 2 }
 { // server 3 }
 */
// 2 - base container (video, music, photo)
/*
 "id":"0"
 "title":"margret Library at mgrane6410"
 "upnp:class":"object.container"
 "url":"http://127.0.0.1:9000/nmc/rss/server/RBuuid%3A55076f6e-6b79-4d65-64bc-0026b9ef209b,0%3Fstart%3D0%26count%3D25%26fmt%3Djson"
 "description":"3 objects available in container"
 "returneditems":"3 objects returned from container"
 "item": [ {  // container 0
 "title":"Music"
 "enclosure": {
 "value":""
 "type":"application/rss xml"
 "url":"http://127.0.0.1:9000/nmc/rss/server/RBuuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,0/IBuuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQx,_K3B2OmNsYXNzaWZpZWQ=,0,0,_Um9vdA==,0,"
 }
 "bookmark":"uuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQx,_K3B2OmNsYXNzaWZpZWQ=,0,0,_Um9vdA==,0,"
 "meta": {
 "pv:persistentID": "music"
 "childCount": "12"
 "restricted": "1"
 "parentID": "0"
 "id": "0$1"
 "dc:title":"Music"
 "pv:childCountContainer":"12"
 "pv:modificationTime":"15997621"
 "pv:lastUpdated":"15997621"
 "pv:containerContent":"object.item.audioItem.musicTrack"
 "upnp:class":"object.container"
 }
 "upnp:class":"object.container"
 }
 { // container 1 }
 { // container 2 }
 */
// 3 - left navigation tree (Album, by Folder, ...)
/*
 "id":"0$1"
 "title":"Music"
 "upnp:class":"object.container"
 "url":"http://127.0.0.1:9000/nmc/rss/server/RBuuid%3A55076f6e-6b79-4d65-64bc-0026b9ef209b,0/IBuuid%3A55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQx,_K3B2OmNsYXNzaWZpZWQ%3D,0,0,_Um9vdA%3D%3D,0,%3Fstart%3D0%26count%3D25%26fmt%3Djson"
 "description":"12 objects available in container"
 "returneditems":"12 objects returned from container"
 "childCount":"12"
 "childCountContainer":"12"
 "item": [ {  // item 0
 "title":"Album"
 "enclosure": {
 "value":""
 "type":"application/rss xml"
 "url":"http://127.0.0.1:9000/nmc/rss/server/RBuuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,0/IBuuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQxJDEy,_K3B2OmNsYXNzaWZpZWQ=,0,0,_Um9vdA==,0,,0,0,_TXVzaWM=,_MCQx,"
 }
 "bookmark":"uuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQxJDEy,_K3B2OmNsYXNzaWZpZWQ=,0,0,_Um9vdA==,0,,0,0,_TXVzaWM=,_MCQx,"
 "meta": {
 "pv:persistentID": "music/albums"
 "childCount": "16"
 "restricted": "1"
 "parentID": "0$1"
 "id": "0$1$12"
 "dc:title":"Album"
 "pv:childCountContainer":"16"
 "pv:modificationTime":"15997668"
 "pv:lastUpdated":"15997668"
 "pv:containerContent":"object.item.audioItem.musicTrack"
 "upnp:class":"object.container"
 }
 }
 {  // item 1  }
 {  // item ...  }
 */
// 4 - Example: Video - Album
/*
 {
 "id":"0$3$35"
 "title":"Album"
 "upnp:class":"object.container"
 "url":"http://127.0.0.1:9000/nmc/rss/server/RBuuid%3A55076f6e-6b79-4d65-64bc-0026b9ef209b,0/IBuuid%3A55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQzJDM1,_K3B2OmNsYXNzaWZpZWQ%3D,2,0,_Um9vdA%3D%3D,0,,0,0,_VmlkZW9z,_MCQz,%3Fstart%3D0%26count%3D1%26fmt%3Djson"
 "description":"1 objects available in container"
 "returneditems":"1 objects returned from container"
 "childCount":"1"
 "childCountContainer":"1"
 "item": [ {		// item 0
 "title":"Sample Videos"
 "enclosure": {
 "value":""
 "type":"application/rss xml"
 "url":"http://127.0.0.1:9000/nmc/rss/server/RBuuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,0/IBuuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQzJDM1JDM4MQ==,_K3B2OmNsYXNzaWZpZWQ=,2,0,_Um9vdA==,0,,0,0,_VmlkZW9z,_MCQz,,0,0,_QWxidW0=,_MCQzJDM1,"
 }
 "bookmark":"uuid:55076f6e-6b79-4d65-64bc-0026b9ef209b,_MCQzJDM1JDM4MQ==,_K3B2OmNsYXNzaWZpZWQ=,2,0,_Um9vdA==,0,,0,0,_VmlkZW9z,_MCQz,,0,0,_QWxidW0=,_MCQzJDM1,"
 "meta": {
 "searchable": "1"
 "childCount": "1"
 "restricted": "1"
 "parentID": "0$3$35"
 "id": "0$3$35$381"
 "dc:title":"Sample Videos"
 "upnp:genre":"Unknown"
 "upnp:album":"Sample Videos"
 "pv:childCountContainer":"0"
 "pv:modificationTime":"69748"
 "pv:lastUpdated":"69748"
 "pv:containerContent":"object.item.videoItem.movie"
 "upnp:class":"object.container"
 }
 } { // item 1 } ... ]
 }
 */
// 5 - parentList
/*
 <parentList>
 <parent>
 <id>0$1$12</id>
 <title>Album</title>
 <upnp:class>object.container</upnp:class>
 <childCount>366</childCount>
 <url>http://192.168.1.144:9000/nmc/rss/server/RBuuid%3A55076f6e-6b79-4d65-64a5-1c6f65956ad9,0/IBuuid%3A55076f6e-6b79-4d65-64a5-1c6f65956ad9,-,_K3B2OmNsYXNzaWZpZWQ%3D,0,0,_Um9vdA%3D%3D,0,,0,0,_TXVzaWM%3D,_MCQx,</url>
 </parent>
 <parent>
 <id>0$1</id>
 <title>Music</title>
 <upnp:class>object.container</upnp:class>
 <childCount>12</childCount>
 <url>http://192.168.1.144:9000/nmc/rss/server/RBuuid%3A55076f6e-6b79-4d65-64a5-1c6f65956ad9,0/IBuuid%3A55076f6e-6b79-4d65-64a5-1c6f65956ad9,-,_K3B2OmNsYXNzaWZpZWQ%3D,0,0,_Um9vdA%3D%3D,0,</url>
 </parent>
 <parent>
 <id>0</id>
 <title>Root</title>
 <upnp:class>object.container</upnp:class>
 <childCount>3</childCount>
 <url>http://192.168.1.144:9000/nmc/rss/server/RBuuid%3A55076f6e-6b79-4d65-64a5-1c6f65956ad9,0</url>
 </parent>
 </parentList>
 */
