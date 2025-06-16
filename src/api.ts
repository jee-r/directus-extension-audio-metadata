import { defineOperationApi } from "@directus/extensions-sdk"
import { parseBuffer } from "music-metadata"

type Options = {
  fileKey: string
  maxBytes: number
  downloadFullFile: boolean | null | undefined
  baseUrl: string
  accessToken: string | null | undefined
}

export default defineOperationApi<Options>({
  id: "audio-metadata",
  handler: async ({
    fileKey,
    maxBytes = 262144,
    downloadFullFile,
    baseUrl,
    accessToken,
  }) => {
    if (!fileKey) {
      throw new Error("File key is required")
    }

    try {
      // Construct the asset URL
      const assetUrl = `${baseUrl}/${fileKey}`

      let response: Response

      if (downloadFullFile) {
        // Fetch entire file
        response = await fetch(assetUrl, {
          headers: {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        })
      } else {
        // Use Range header to get only the file header
        response = await fetch(assetUrl, {
          headers: {
            Range: `bytes=0-${maxBytes - 1}`,
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        })
      }

      let contentType: string

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`
        )
      } else {
        // Get content type
        contentType = response.headers.get("content-type") ?? ""

        // Get array buffer from response
        const arrayBuffer = await response.arrayBuffer()

        // Convert to Buffer for music-metadata
        const buffer = Buffer.from(arrayBuffer)

        // Parse metadata from the buffer - this returns a JavaScript object
        const metadata = await parseBuffer(
          buffer,
          {
            mimeType: contentType,
          },
          {
            duration: true,
            skipCovers: true,
            skipPostHeaders: false,
            includeChapters: false,
          }
        )

        // Add formatted duration for convenience
        const duration = metadata.format?.duration || 0
        const duration_in_ms = Math.round(duration * 1000)

        // Return the metadata object directly - Directus will serialize to JSON
        return {
          // metadata,
          durationms: duration_in_ms,
          file_url: assetUrl,
          usedFullFile: downloadFullFile,
        }
      }
    } catch (error) {
      throw new Error(`Failed to get audio metadata: ${error}`)
    }
  },
})
