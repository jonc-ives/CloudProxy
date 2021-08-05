
let remoteIP = '75.118.37.73'
// let remoteIP = '192.168.0.11'
let remoteVideoPort = '9000'
let remotePort = '3001'
let remoteURL = 'http://' + remoteIP + ':' + remotePort
let remoteVideoURL  = 'http://' + remoteIP + ':' + remoteVideoPort

var startIndex = 0
var pageCount = 60
var collectionCount = 0
var tabCount = 0

var mainLoads = true

function initPage() {
	// begin populating
	initPageContent()
	// activate loading animation
}

async function initPageContent() {
	var res = await fetch(remoteURL + '/tmp-all')
	let server = await res.json()
	// handle response -- prozy must reach server

	// get container information
	var containerURL = remoteURL + '/meta?start=' + startIndex + '&count=' + pageCount
	var res = await fetch(containerURL)
	let container = await res.json()
	console.log(container)
	
	// get container meta data
	collectionCount = container['collectionCount']
	// list of items in container
	containerItems = container['item']

	containerItems.forEach(function(item, index) {
		buildPanelFromMeta(item, index)
	})

	buildPagination()
}

function buildPanelFromMeta(data, index) {
	// Create the base link container
	let root = document.createElement('a')
	root.setAttribute("href", remoteVideoURL + data['link'])
	root.setAttribute("title", data['title'])
	root.setAttribute("id", "link#" + index)
	// create the panel container
	let panel = document.createElement('div')
	panel.setAttribute('class', 'panel')
	root.appendChild(panel)
	// Create the panel thumbnail
	let panelThumbnail = document.createElement('img')
	panelThumbnail.setAttribute('class', 'panelThumbnail')
	panelThumbnail.setAttribute('src', `${remoteURL}/thumbnail?uri=${data['thumbnail']}`)
	panel.appendChild(panelThumbnail)
	// Create the panel content container
	let panelContent = document.createElement('div')
	panelContent.setAttribute('class', 'panelContent')
	panel.appendChild(panelContent)
	// Create panelTitle text
	let panelTitle = document.createElement('h3')
	panelTitle.setAttribute('class', 'panelTitle')
	panelTitle.textContent = data['title']
	panelContent.appendChild(panelTitle)
	// Create the panelFoot container
	let panelFoot = document.createElement('div')
	panelFoot.setAttribute('class', 'panelFoot')
	panelContent.appendChild(panelFoot)
	// Create the duration tag
	let duration = document.createElement('p')
	duration.setAttribute('class', 'panelFootText')
	duration.textContent = data['duration']
	panelFoot.appendChild(duration)
	// Create the dateEdited tag
	let dateEdited = document.createElement('p')
	dateEdited.setAttribute('class', 'panelFootText')
	dateEdited.textContent = data['date']
	panelFoot.appendChild(dateEdited)
	// add root to the document
	container = document.getElementById('body')
	container.appendChild(root)
}

async function navigatePage(event) {
	let nextPage = event.target.id.replace('page#', '')
	// make sure it isn't a same page click
	if ((nextPage - 1) * pageCount == startIndex) return;
	else document.getElementById('body').innerHTML = '';
	// update the start index
	startIndex = (nextPage - 1) * pageCount
	// fetch the page content
	var containerURL = remoteURL + '/meta?start=' + startIndex + '&count=' + pageCount
	var res = await fetch(containerURL)
	let container = await res.json()	
	// get container meta data
	collectionCount = container['collectionCount']
	// list of items in container
	containerItems = container['item']
	containerItems.forEach(function(item, index) {
		buildPanelFromMeta(item, index)
	})

	// change active pagination link
	let current = document.querySelector('.active')
	current.setAttribute('class', '')
	// set new active
	event.target.setAttribute('class', 'active')
}

function buildPagination() {
	// calculate the number of pages
	tabCount = collectionCount / pageCount
	tabCount = (Math.floor(tabCount) == tabCount) ? tabCount : Math.floor(tabCount) + 1
	// build each page number
	let root = document.getElementById('paginationID')
	for (let i = 1; i <= tabCount; i++) {
		let link = document.createElement('p')
		link.setAttribute('id', `page#${i}`)
		link.addEventListener('click', navigatePage)
		link.textContent = i
		root.appendChild(link)
	}

	document.getElementById(`page#1`).setAttribute('class', 'active')
}
