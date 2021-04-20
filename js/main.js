
var onstop
var onstart

( function () {
	var table = document.getElementById( 'textareatable' )
	var video = document.getElementById( 'video' )
	var canvasElement = document.getElementById( 'canvas' )
	var canvasOverlayElement = document.getElementById( 'canvas-overlay' )
	var canvas = canvasElement.getContext( '2d' )
	var canvasOverlay = canvasOverlayElement.getContext( '2d' )
	var results = {}
	var qrOptions = { inversionAttempts: 'dontInvert' }
	var requestId

	function strokeStart () {
		canvasOverlay.beginPath()
	}
	function drawLine ( begin, end ) {
		canvasOverlay.moveTo( begin.x, begin.y )
		canvasOverlay.lineTo( end.x, end.y )
	}
	function strokeEnd ( width = 4, color = '#33ff77' ) {
		canvasOverlay.lineWidth = width
		canvasOverlay.strokeStyle = color
		canvasOverlay.stroke()
	}

	function play () {
		// Use facingMode: environment to attemt to get the front camera on phones
		var videoOpts = {
			facingMode: 'environment'
		}
		navigator.mediaDevices.getUserMedia( { video: videoOpts } ).then( stream => {
			video.srcObject = stream
			video.setAttribute( 'playsinline', true ) // required to tell iOS safari we don't want fullscreen
			video.play()
			requestId = requestAnimationFrame( tick )
		} )
	}

	function buildTextArray () {
		const array = []
		Object.keys( results ).forEach( str => array.push( str ) )
		array.sort()
		return array
	}

	function callback ( data ) {
		const str = data.data
		results[ str ] = true
		const array = buildTextArray()
		const tbody = document.createElement( 'tbody' )
		const thead = document.createElement( 'thead' )
		const thr = document.createElement( 'tr' )
		const th = document.createElement( 'td' )
		th.textContent = `${ array.length || 0 } 件`
		thead.appendChild( thr ).appendChild( th )
		array.forEach( s => {
			const tr = document.createElement( 'tr' )
			const td = document.createElement( 'td' )
			tr.appendChild( td )
			td.textContent = s
			tbody.appendChild( tr )
		} )
		table.innerHTML = ''
		table.appendChild( thead )
		table.appendChild( tbody )
	}

	function tick () {
		if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
			canvasElement.height = video.videoHeight
			canvasElement.width = video.videoWidth
			canvasOverlayElement.height = video.videoHeight
			canvasOverlayElement.width = video.videoWidth
			canvas.drawImage( video, 0, 0, canvasElement.width, canvasElement.height )
			var imageData = canvas.getImageData( 0, 0, canvasElement.width, canvasElement.height )
			var code = jsQR( imageData.data, imageData.width, imageData.height, qrOptions )
			if ( code && code.data != '' ) {
				strokeStart()
				drawLine( code.location.topLeftCorner, code.location.topRightCorner )
				drawLine( code.location.topRightCorner, code.location.bottomRightCorner )
				drawLine( code.location.bottomRightCorner, code.location.bottomLeftCorner )
				drawLine( code.location.bottomLeftCorner, code.location.topLeftCorner )
				strokeEnd()
				callback( code )
			}
		}
		cancelAnimationFrame( requestId )
		requestId = requestAnimationFrame( tick )
	}

	onstop = () => {
		video.srcObject.getTracks().forEach( s => s.stop() )
		video.srcObject = null
		cancelAnimationFrame( requestId )
	}
	onstart = () => play()

	play()

} )()
