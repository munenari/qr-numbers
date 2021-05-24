
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
	function strokeEnd ( width = 8, color = '#33ff77' ) {
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

	function getResult ( imageData, ox, oy ) {
		var code
		try {
			code = jsQR( imageData.data, imageData.width, imageData.height, qrOptions )
		} catch ( e ) {
			console.error( 'failed to find QR:', e )
		}
		if ( code && code.data != '' ) {
			code.location.topLeftCorner.x += ox
			code.location.topLeftCorner.y += oy
			code.location.topRightCorner.x += ox
			code.location.topRightCorner.y += oy
			code.location.bottomRightCorner.x += ox
			code.location.bottomRightCorner.y += oy
			code.location.bottomLeftCorner.x += ox
			code.location.bottomLeftCorner.y += oy
			drawLine( code.location.topLeftCorner, code.location.topRightCorner )
			drawLine( code.location.topRightCorner, code.location.bottomRightCorner )
			drawLine( code.location.bottomRightCorner, code.location.bottomLeftCorner )
			drawLine( code.location.bottomLeftCorner, code.location.topLeftCorner )
			callback( code )
		}
		return code
	}
	function getResultWithCrop ( canvas, ox, oy, width, height ) {
		return getResult( canvas.getImageData( ox, oy, width, height ), ox, oy )
	}
	function tick () {
		if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
			canvasElement.height = video.videoHeight
			canvasElement.width = video.videoWidth
			canvasOverlayElement.height = video.videoHeight
			canvasOverlayElement.width = video.videoWidth
			canvas.drawImage( video, 0, 0, canvasElement.width, canvasElement.height )

			var w = canvasElement.width
			var h = canvasElement.height
			var w2 = w / 2
			var h2 = h / 2
			strokeStart()
			getResultWithCrop( canvas, 0, 0, w, h ) // 1/1
			//
			getResultWithCrop( canvas, 0, 0, w, h2 ) // 1/2
			getResultWithCrop( canvas, 0, h2, w, h2 ) // 1/2
			getResultWithCrop( canvas, 0, 0, w2, h ) // 1/2
			getResultWithCrop( canvas, w2, 0, w2, h ) // 1/2
			//
			getResultWithCrop( canvas, 0, 0, w2, h2 ) // 1/4
			getResultWithCrop( canvas, w2, 0, w2, h2 ) // 1/4
			getResultWithCrop( canvas, 0, h2, w2, h2 ) // 1/4
			getResultWithCrop( canvas, w2, h2, w2, h2 ) // 1/4
			strokeEnd()
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
