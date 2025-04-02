import { defineOperationApi } from '@directus/extensions-sdk';
import { parseBuffer } from "music-metadata"

type Options = {
	fileKey: string;
	maxBytes: number;
	baseUrl: string;
	accessToken: string;
};
export default defineOperationApi<Options>({
	id: 'audio-metadata',
	handler: async ({ fileKey, maxBytes = 262144, baseUrl, accessToken}) => {
			
		if (!fileKey) {
			throw new Error('File key is required');
		  }
	
		  try {
			// Construct the asset URL
			const assetUrl = `${baseUrl}/${fileKey}`;
			
			// Use native fetch with Range header to get only the file header
			const response = await fetch(assetUrl, {
			  headers: {
				Range: `bytes=0-${maxBytes - 1}`,
				Authorization: `Bearer ${accessToken}`
			  }
			});

			let contentType: string
			
			if (!response.ok) {
			  throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
			} else {
			
				// Get content type
					contentType = response.headers.get('content-type') ?? '';
					
				// Get array buffer from response
				const arrayBuffer = await response.arrayBuffer();
				
				// Convert to Buffer for music-metadata
				const buffer = Buffer.from(arrayBuffer);
				
				// Parse metadata from the buffer - this returns a JavaScript object
				const metadata = await parseBuffer(buffer, {
				  mimeType: contentType

				});


				// Add formatted duration for convenience
				const duration = metadata.format?.duration || 0;
				const duration_in_ms = Math.round(duration * 1000);


				// Return the metadata object directly - Directus will serialize to JSON
				return { 
					metadata,
					"durationms": duration_in_ms,
					"file_url": assetUrl
				};
			}
		  } catch (error) {
			throw new Error(`Failed to get audio metadata: ${error}`);
		  }
		
	}

});
