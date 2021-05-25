
importScripts( './jsQR-1.3.1.js' )

onmessage = event => {
	const { imageData, qrOptions, offsetX, offsetY } = event.data
	try {
		const code = jsQR( imageData.data, imageData.width, imageData.height, qrOptions ) || {}
		code.offsetX = offsetX
		code.offsetY = offsetY
		postMessage( code )
	} catch ( e ) {
		console.error( 'failed to find QR:', e )
	}
}
